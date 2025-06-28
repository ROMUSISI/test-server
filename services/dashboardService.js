const {QueryTypes} = require ('sequelize');
const {sequelize} = require ('../databaseConnection/db')
const {format} = require ('date-fns')

//get data for dashbosrd
const getDashInfo = async (userId, role, unitId) => {

  const currentYear = format (new Date(), 'yyyy')

  //Now define define the queries to be run depending on whether the user is a Director or not

  const allMemberQ = 

    role === 'Director' ?

      `SELECT COUNT(uniqueMemberId) AS total 
       FROM member WHERE deleted <> 1
      ` 
      :

      `SELECT COUNT(uniqueMemberId) AS total 
       FROM member WHERE deleted <> 1
       AND unitId = :unitId;
      ` 

  const activeMemberQ = 

    role === 'Director' ?

      `SELECT COUNT(uniqueMemberId) AS totalActive FROM 

        ( 
      
          SELECT uniqueMemberId, categoryValue, category, unitId, SUM(amountPaid) AS totalPaid
          FROM 

            ( 

              SELECT s.uniqueMemberId, s.categoryValue, s.category, s.yearSubscribed, s.amountPaid, m.unitId
              FROM Subscription AS s INNER JOIN member AS m
              ON s.uniqueMemberId = m.uniqueMemberId
              WHERE m.deleted <> 1
              AND s.deleted <> 1

            ) as subq2

        WHERE yearSubscribed = :currentYear
        GROUP BY uniqueMemberId, categoryValue, category, unitId
      
      ) as subq1
        
      WHERE totalPaid >= categoryValue
      ` 
      :

      
      `SELECT COUNT(uniqueMemberId) AS totalActive FROM 

        ( 
      
          SELECT uniqueMemberId, categoryValue, category, unitId, SUM(amountPaid) AS totalPaid
          FROM 

            ( 

              SELECT s.uniqueMemberId, s.categoryValue, s.category, s.yearSubscribed, s.amountPaid, m.unitId
              FROM Subscription AS s INNER JOIN member AS m
              ON s.uniqueMemberId = m.uniqueMemberId
              WHERE m.deleted <> 1
              AND s.deleted <> 1

            ) as subq2

          WHERE yearSubscribed = :currentYear
          AND unitId = :unitId
          GROUP BY uniqueMemberId, categoryValue, category, unitId
      
        ) as subq1
        
      WHERE totalPaid >= categoryValue
      ` 
      const dashR = 
        role === 'Director' ? {currentYear} : {currentYear, unitId}   


    const totalMemberCollectionQ = 

      role === 'Director' ? 
      
        ` SELECT SUM(amountPaid) AS totalPaid
          FROM Subscription 
          WHERE yearSubscribed = :currentYear
          AND category <> 'Welfare'
          AND deleted <> 1`

      :
        `SELECT SUM(amountPaid) AS totalPaid
          FROM
          
            ( SELECT s.uniqueMemberId, s.amountPaid, m.unitId 
              FROM subscription as s INNER JOIN member AS m
              ON s.uniqueMemberId = m.uniqueMemberId
              WHERE s.yearSubscribed = :currentYear
              AND s.category <> 'Welfare'
              AND m.unitId = :unitId
              AND m.deleted <> 1
              AND s.deleted <> 1
            ) 
              
            AS subq1
          `;


    const totalWelfareMemberQ = 

      role === 'Director' ?

        `SELECT COUNT(uniqueMemberId) AS totalActive FROM 

          ( 
        
            SELECT uniqueMemberId, SUM(amountPaid) AS totalPaid
            FROM 

              ( 

                SELECT s.uniqueMemberId, s.yearSubscribed, s.category, s.amountPaid, m.unitId
                FROM Subscription AS s INNER JOIN member AS m
                ON s.uniqueMemberId = m.uniqueMemberId
                WHERE m.deleted <> 1
                AND s.deleted <> 1
                

              ) as subq2

          WHERE yearSubscribed = :currentYear
          AND category = 'Welfare'
          GROUP BY uniqueMemberId
        
        ) as subq1
          
        WHERE totalPaid > 0
        ` 
        :

        `SELECT COUNT(uniqueMemberId) AS totalActive FROM 

          ( 
        
            SELECT uniqueMemberId, SUM(amountPaid) AS totalPaid
            FROM 

              ( 

                SELECT s.uniqueMemberId, s.yearSubscribed, s.category, s.amountPaid, m.unitId
                FROM Subscription AS s INNER JOIN member AS m
                ON s.uniqueMemberId = m.uniqueMemberId
                WHERE m.deleted <> 1
                AND s.deleted <> 1

              ) as subq2

            WHERE yearSubscribed = :currentYear
            AND unitId = :unitId
            AND category = 'Welfare'
            GROUP BY uniqueMemberId
        
          ) as subq1
          
        WHERE totalPaid > 0`


        const totalWelfareCollectionQ = 

        role === 'Director' ? 
        
          ` SELECT SUM(amountPaid) AS totalPaid
            FROM Subscription 
            WHERE yearSubscribed = :currentYear 
            AND category = 'Welfare'
            AND deleted <> 1`
  
        :
          `SELECT SUM(amountPaid) AS totalPaid
            FROM
            
              ( SELECT s.uniqueMemberId, s.yearSubscribed, s.category, s.amountPaid, m.unitId 
                FROM subscription as s INNER JOIN member AS m
                ON s.uniqueMemberId = m.uniqueMemberId
                WHERE s.deleted <> 1
                AND m.deleted <> 1
              ) 
                
              AS subq1
            
            WHERE unitId = :unitId
            AND yearSubscribed = :currentYear
            AND category = 'Welfare'
            `;

  //function to work out the rest of the dashboard parameters which are basically category totals
  const getDashCategoryTotal = async(category, ) => {

    const dashWhereStatement = category === 'Welfare' ? 'WHERE totalPaid > 0' : 'WHERE totalPaid >= categoryValue' 

    const dashCategoryTotalQ = 

      role === 'Director' ?

        `SELECT COUNT(uniqueMemberId) AS totalActive FROM 

          ( 
        
            SELECT uniqueMemberId, categoryValue, SUM(amountPaid) AS totalPaid
            FROM 

              ( 

                SELECT s.uniqueMemberId, s.yearSubscribed, s.amountPaid, m.unitId, s.categoryValue
                FROM Subscription AS s INNER JOIN member AS m
                ON s.uniqueMemberId = m.uniqueMemberId
                WHERE s.category = '${category}'
                AND s.deleted <> 1
                AND m.deleted <> 1

              ) as subq2

          WHERE yearSubscribed = :currentYear
          GROUP BY uniqueMemberId, categoryValue
        
        ) as subq1
          
        WHERE totalPaid >= categoryValue
        ` 
        :

        `SELECT COUNT(uniqueMemberId) AS totalActive FROM 

          ( 
        
            SELECT uniqueMemberId, categoryValue, SUM(amountPaid) AS totalPaid
            FROM 

              ( 

                SELECT s.uniqueMemberId, s.yearSubscribed, s.amountPaid, m.unitId, s.categoryValue
                FROM Subscription AS s INNER JOIN member AS m
                ON s.uniqueMemberId = m.uniqueMemberId
                WHERE s.category = '${category}'
                AND s.deleted <> 1
                AND m.deleted <> 1

              ) as subq2

            WHERE yearSubscribed = :currentYear
            AND unitId = :unitId
            GROUP BY uniqueMemberId, categoryValue
        
          ) as subq1
          
          WHERE totalPaid >= categoryValue`;
        
        

        try {

          const dashCategoryTotalArray = await sequelize.query (
            dashCategoryTotalQ, {
              replacements: dashR,
              type: QueryTypes.SELECT
            }
          )

            return dashCategoryTotalArray
          
          
        } catch (error) {
          console.log(error)
        }
  }

  try {

    //get total TASO Membership.
    const allMembersArray = await sequelize.query(
      allMemberQ, {
        type: QueryTypes.SELECT,
        replacements: dashR
      }
    )
    
    //get total active taso subscriber members
    const totalActiveTasoMembersArray = await sequelize.query (
      activeMemberQ , {
        replacements: dashR,
        type: QueryTypes.SELECT
      }
    );

    //get total subscriptions
    const totalTasoMembershipCollectionArray = await sequelize.query (
      totalMemberCollectionQ, {
        replacements: dashR,
        type: QueryTypes.SELECT
      }
    );

    //get total total welfare members who have either partially or fully subscribed
    const totalActiveWelfareMembersArray = await sequelize.query (
      totalWelfareMemberQ, {
        replacements: dashR,
        type: QueryTypes.SELECT
      }
    );

    //get total welfare subscriptions
    const totalWelfareCollectionArray = await sequelize.query (
      totalWelfareCollectionQ, {
        replacements: dashR,
        type: QueryTypes.SELECT
      }
    );

    //compute total pewter subscribers
    const pewterTotalArray = await getDashCategoryTotal('Pewter');
    const pewterTotal = pewterTotalArray[0]?.totalActive

    //compute total gold subscriners
    const goldTotalArray = await getDashCategoryTotal('Gold');
    const goldTotal = goldTotalArray[0]?.totalActive

    //compute total gold subscriners
    const silverTotalArray = await getDashCategoryTotal('Silver');
    const silverTotal = silverTotalArray[0]?.totalActive

    //compute total diamond subscriners
    const diamondTotalArray = await getDashCategoryTotal('Diamond');
    const diamondTotal = diamondTotalArray[0]?.totalActive

    //compute total platnum subscriners
    const platnumTotalArray = await getDashCategoryTotal('Platnum');
    const platnumTotal = platnumTotalArray[0]?.totalActive

    //compute total platnum subscriners
    const copperTotalArray = await getDashCategoryTotal('Copper');
    const copperTotal = copperTotalArray[0]?.totalActive

    const dashData = {

      allTASOMembers: allMembersArray[0]?.total || 0,
      totalTasoMembers: totalActiveTasoMembersArray[0]?.totalActive || 0,
      totalTasoMemberCollection: totalTasoMembershipCollectionArray[0]?.totalPaid || 0,
      totalWelfareMembers: totalActiveWelfareMembersArray[0]?.totalActive || 0,
      totalWelfareCollection: totalWelfareCollectionArray[0]?.totalPaid || 0,
      totalPewter: pewterTotal,
      totalGold: goldTotal,
      totalDiamond: diamondTotal,
      totalPlatnum: platnumTotal,
      totalCopper: copperTotal,
      totalSilver: silverTotal

    }

    console.log('dashboard data object: ', dashData);

      return ({
        status: 'OK',
        message: 'Total of Active members successifully obtained',
        dashData: dashData
      })

  } catch (error) {
    return ({
      status: 'Error',
      message: error.message || 'Error retrieving the Total of Active members',
      dashData: {}
    })
  }

}

module.exports = {
  getDashInfo
}
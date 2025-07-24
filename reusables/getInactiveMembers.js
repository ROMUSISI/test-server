const { QueryTypes } = require('sequelize')
const {sequelize} = require('../databaseConnection/db')
const getInactiveMembers = async(unitId) => {

const currentYear = new Date().getFullYear();

const inactiveMembersQuery = 
  `WITH q1 AS (
    SELECT 
      uniqueMemberId,
      category,
      yearSubscribed,
      COALESCE(NULLIF(categoryValue, ''), 0) AS categoryValue,
      SUM(COALESCE(NULLIF(amountPaid, ''), 0)) AS amountPaidThisYear
    FROM subscription
    WHERE yearSubscribed = :currentYear
    AND category <> 'welfare'
    AND deleted <> 1
    GROUP BY 
      uniquememberid,
      category,
      yearSubscribed,
      categoryValue
  ),

 q2 AS (
  SELECT 
    m.uniqueMemberId,
    m.memberName AS name,
    m.unitId AS unit,
    m.phone1 AS phone,
    q1.category,
    q1.categoryValue, 
    q1.amountPaidThisYear
 	FROM member m
	LEFT JOIN q1
	ON m.uniqueMemberId = q1.uniqueMemberId
	WHERE m.deleted <> 1
	AND unitId = :unitId
),

 q3 AS (
	SELECT 
	 uniqueMemberId AS id,
	 name,
	 unit,
	 category,
   phone,
	 COALESCE(categoryValue, 0) AS categoryValue,
	 COALESCE(amountPaidThisYear, 0) AS amountPaid
	FROM q2
  )
	
SELECT 
	* 
	FROM q3
	WHERE amountPaid = 0
	OR amountPaid < categoryValue
`

const inactiveMembersReplacements = {unitId, currentYear}

  try {
    const inactiveMembersArray = await sequelize.query(
      inactiveMembersQuery, {
        replacements: inactiveMembersReplacements,
        type: QueryTypes.SELECT
      }
    );

   if(inactiveMembersArray && inactiveMembersArray.length > 0) {
    inactiveMembersArray.map((member) => {console.log('inactive member: ','id: '+ member.id, 'name: ' + member.name, 'phone: ' + member.phone)})
   }
  } catch (error) {
    console.log('An error occurred while retrieving inactive members: ' + error)
  }
};

module.exports = {
  getInactiveMembers
}
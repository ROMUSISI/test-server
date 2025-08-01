const { exportToExcel } = require("../reusables/exportToExcel")

const exportSmsLog = async(req, res) =>{
  try {
    //Get query
    const query = `SELECT id, message, unitId, phone, topUp, credit FROM messageLog`
    const headers = ['id', 'message', 'unit', 'phone', 'Top up', 'Credit']
    const rowMapper = (row) => {
      return(
        [
          row.id,
          row.message,
          row.unitId,
          row.phone,
          row.topUp,
          row.credit
        ]
      )
    }

  const batchSize = 500;
  
  await exportToExcel(res, {
    query: query,
    headers,
    rowMapper,
    batchSize: batchSize
  });

  return;
  } catch (error) {
    console.log('An error occurred while exporting message log to excel: ', error);
    return;
  }
};

const exportMembers = async(req, res) =>{
  const {unitId} = req.user
  const excelReplacements = {unitId}
  try {
    //Get query
    const query = `
    SELECT 
      m.uniqueMemberId, 
      m.unitId, 
      m.memberName, 
      m.phone1,
      m.emailAddress, 
      m.country, 
      m.district,
      m.subCounty,
      m.parish,
      m.cell,
      m.timeCreated,
      m.deleted
    FROM 
      member m 
    WHERE unitId = :unitId
    ORDER BY m.timeCreated DESC`
    const headers = 
    [
      'Member Id', 'Unit', 'Member Name', 'Phone Number', 'Email Address', 'Country',
      'District', 'Sub County', 'Parish/Ward', 'Cell/Village', 'Time and Date Created',
      'Deleted'
    ]
    const rowMapper = (row) => {
      return(
        [
          row.uniqueMemberId,
          row.unitId,
          row.memberName,
          row.phone1,
          row.emailAddress,
          row.country,
          row.district,
          row.subCounty,
          row.parish,
          row.cell,
          row.timeCreated,
          row.deleted
        ]
      )
    }

  const batchSize = 500;
  
  await exportToExcel(res, {
    query: query,
    headers,
    rowMapper,
    batchSize: batchSize,
    excelReplacements
  });

  return;
  } catch (error) {
    console.log('An error occurred while exporting Membersto excel: ', error);
    return;
  }
};

const exportPayments = async(req, res) =>{
  const {unitId} = req.user
  const excelReplacements = {unitId}
  try {
    //Get query
    const query = `
    WITH q1 AS (
    SELECT 
      s.uniqueMemberId, 
      s.timeReceived, 
      s.yearSubscribed, 
      s.category,
      s.categoryValue,
      s.amountPaid, 
      s.deleted,
      s.confirmed,
      s.receivedByUserId,
      u.unitId
    FROM 
      subscription s INNER JOIN user u
      ON s.receivedByUserId = u.id
    WHERE u.unitId = :unitId
    ORDER BY s.timeReceived DESC)
    
    SELECT q1.*, m.memberName
    FROM q1 INNER JOIN member m
    ON q1.uniqueMemberId = m.uniqueMemberId`
    const headers = 
    [
      'Member Id', 'Member Name', 'Payment Date', 'Year Paid', 'Category', 'Category Value', 'Amount Paid',
      'Deleted', 'Confirmed', 'Unit'
    ]
    const rowMapper = (row) => {
      return(
        [
          row.uniqueMemberId,
          row.memberName,
          row.timeReceived,
          row.yearSubscribed,
          row.category,
          row.categoryValue,
          row.amountPaid,
          row.deleted,
          row.confirmed,
          row.unitId
        ]
      )
    }

  const batchSize = 500;
  
  await exportToExcel(res, {
    query: query,
    headers,
    rowMapper,
    batchSize: batchSize,
    excelReplacements
  });

  return;
  } catch (error) {
    console.log('An error occurred while exporting Membersto excel: ', error);
    return;
  }
};

module.exports = {
  exportSmsLog,
  exportMembers,
  exportPayments
}
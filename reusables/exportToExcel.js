const ExcelJS = require('exceljs');
const sequelize = require('../db');

/**
 * Streams a dynamic Excel file to the HTTP response.
 *
 * @param {object} res - Express response object
 * @param {object} options - Export options
 * @param {string} options.query - Raw SQL query without LIMIT/OFFSET
 * @param {string[]} options.headers - Excel column headers
 * @param {(row: object) => any[]} options.rowMapper - Function to map each row to an Excel row
 * @param {number} [options.batchSize=1000] - Optional: batch size
 */
async function exportToExcel(res, { query, headers, rowMapper, batchSize = 1000 }) {
  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="export.xlsx"');

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
  const sheet = workbook.addWorksheet('Export');

  // Write the column headers
  sheet.addRow(headers).commit();

  let offset = 0;
  let keepGoing = true;

  try {
    while (keepGoing) {
      const paginatedQuery = `${query} LIMIT :limit OFFSET :offset`;
      const [rows] = await sequelize.query(paginatedQuery, {
        replacements: { limit: batchSize, offset },
        type: sequelize.QueryTypes.SELECT,
      });

      if (rows.length === 0) break;

      for (const row of rows) {
        const formattedRow = rowMapper(row);
        sheet.addRow(formattedRow).commit();
      }

      offset += batchSize;
      if (rows.length < batchSize) keepGoing = false;
    }

    await workbook.commit();
  } catch (err) {
    console.error('Excel export error:', err);
    if (!res.headersSent) {
      res.status(500).send('Excel export failed');
    }
  }
}

module.exports = {
  exportToExcel
}
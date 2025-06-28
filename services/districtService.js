// services/districtService.js

const { sequelize } = require('../databaseConnection/db'); // Import sequelize instance directly
const { QueryTypes } = require('sequelize'); // To specify the query type (e.g., SELECT, INSERT)

// Create a new district
const createNewDistrict = async (districtData) => {
  const { districtName } = districtData;
  try {
    const [newDistrict, metadata] = await sequelize.query(
      'INSERT INTO District (districtName) VALUES (:districtName) RETURNING *',
      {
        replacements: { districtName }, // Safe parameterized query to prevent SQL injection
        type: QueryTypes.INSERT,
      }
    );

    // Return the newly created district
    return newDistrict[0]; // The returned object is in an array (due to RETURNING * syntax)
  } catch (error) {
    throw new Error('Error creating district: ' + error.message);
  }
};

// Get all districts
const getAllDistricts = async () => {
  try {
    const districts = await sequelize.query('SELECT * FROM District', {
      type: QueryTypes.SELECT, // SELECT query type
    });
    return districts;
  } catch (error) {
    throw new Error('Error fetching districts: ' + error.message);
  }
};

// Get a district by ID
const getDistrictById = async (id) => {
  try {
    const district = await sequelize.query(
      'SELECT * FROM District WHERE id = :id',
      {
        replacements: { id }, // Safe parameterized query
        type: QueryTypes.SELECT,
      }
    );

    if (!district.length) {
      throw new Error('District not found');
    }
    return district[0]; // Return the first (and only) result
  } catch (error) {
    throw new Error('Error fetching district: ' + error.message);
  }
};

// Update a district by ID
const updateDistrict = async (id, districtData) => {
  const { districtName } = districtData;
  try {
    const [updatedRows] = await sequelize.query(
      'UPDATE District SET districtName = :districtName WHERE id = :id',
      {
        replacements: { districtName, id },
        type: QueryTypes.UPDATE,
      }
    );

    if (!updatedRows) {
      throw new Error('District not found or no changes made');
    }
    return { message: 'District updated successfully' };
  } catch (error) {
    throw new Error('Error updating district: ' + error.message);
  }
};

// Delete a district by ID
const deleteDistrict = async (id) => {
  try {
    const deletedRows = await sequelize.query(
      'DELETE FROM District WHERE id = :id',
      {
        replacements: { id },
        type: QueryTypes.DELETE,
      }
    );

    if (!deletedRows) {
      throw new Error('District not found');
    }
    return { message: 'District deleted successfully' };
  } catch (error) {
    throw new Error('Error deleting district: ' + error.message);
  }
};

module.exports = {
  createNewDistrict,
  getAllDistricts,
  getDistrictById,
  updateDistrict,
  deleteDistrict,
};
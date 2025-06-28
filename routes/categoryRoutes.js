// routes/districtRoutes.js

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Get all categories
router.get('/categories', categoryController.getAllCategories);

module.exports = router;
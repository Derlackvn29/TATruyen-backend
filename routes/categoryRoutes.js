const express = require('express');
const { 
  getCategories, 
  getCategory, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  getStoriesByCategory
} = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getCategories);
router.get('/:categoryId', getCategory);
router.post('/', protect, createCategory);
router.put('/:categoryId', protect, updateCategory);
router.delete('/:categoryId', protect, deleteCategory);
router.get('/:categoryId/stories', getStoriesByCategory);

module.exports = router;

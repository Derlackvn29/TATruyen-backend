const express = require('express');
const { 
  getAllStories, 
  getStory, 
  createStory, 
  updateStory, 
  deleteStory,
  likeStory,
  unlikeStory
} = require('../controllers/storyController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllStories);
router.get('/:id', getStory);
router.post('/', protect, createStory);
router.put('/:id', protect, updateStory);
router.delete('/:id', protect, deleteStory);
router.post('/:id/like', protect, likeStory);
router.delete('/:id/like', protect, unlikeStory);

module.exports = router;

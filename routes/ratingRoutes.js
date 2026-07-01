const express = require('express');
const { 
  getRatings, 
  getRating, 
  createRating, 
  updateRating, 
  deleteRating,
  getRatingsByStory,
  getRatingsByUser
} = require('../controllers/ratingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getRatings);
router.get('/:ratingId', getRating);
router.post('/', protect, createRating);
router.put('/:ratingId', protect, updateRating);
router.delete('/:ratingId', protect, deleteRating);
router.get('/story/:storyId', getRatingsByStory);
router.get('/user/:userId', getRatingsByUser);

module.exports = router;

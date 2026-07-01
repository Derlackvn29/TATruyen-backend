const express = require('express');
const { 
  getChapters, 
  getChapter, 
  createChapter, 
  updateChapter, 
  deleteChapter
} = require('../controllers/chapterController');
const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.get('/', getChapters);
router.get('/:chapterId', getChapter);
router.post('/', protect, createChapter);
router.put('/:chapterId', protect, updateChapter);
router.delete('/:chapterId', protect, deleteChapter);

module.exports = router;

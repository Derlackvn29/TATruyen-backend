const express = require('express');
const { 
  getComments, 
  getComment, 
  createComment, 
  updateComment, 
  deleteComment,
  likeComment,
  unlikeComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.get('/', getComments);
router.get('/:commentId', getComment);
router.post('/', protect, createComment);
router.put('/:commentId', protect, updateComment);
router.delete('/:commentId', protect, deleteComment);
router.post('/:commentId/like', protect, likeComment);
router.delete('/:commentId/like', protect, unlikeComment);

module.exports = router;

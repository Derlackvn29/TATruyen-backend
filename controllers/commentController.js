const pool = require('../db/db');

// Get all comments for a chapter
exports.getComments = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.chapter_id = $1 ORDER BY c.created_at DESC LIMIT $2 OFFSET $3',
      [chapterId, limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM comments WHERE chapter_id = $1', [chapterId]);

    res.status(200).json({
      success: true,
      comments: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single comment
exports.getComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const result = await pool.query(
      'SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = $1',
      [commentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.status(200).json({
      success: true,
      comment: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create comment
exports.createComment = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { content } = req.body;
    const user_id = req.user.id;

    if (!content) {
      return res.status(400).json({ error: 'Please provide comment content' });
    }

    const result = await pool.query(
      'INSERT INTO comments (chapter_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [chapterId, user_id, content]
    );

    const commentWithUser = await pool.query(
      'SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = $1',
      [result.rows[0].id]
    );

    res.status(201).json({
      success: true,
      comment: commentWithUser.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update comment
exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const user_id = req.user.id;

    // Check if user is the comment owner
    const commentCheck = await pool.query('SELECT * FROM comments WHERE id = $1 AND user_id = $2', [commentId, user_id]);
    if (commentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to update this comment' });
    }

    const result = await pool.query(
      'UPDATE comments SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [content, commentId]
    );

    const commentWithUser = await pool.query(
      'SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = $1',
      [result.rows[0].id]
    );

    res.status(200).json({
      success: true,
      comment: commentWithUser.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete comment
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const user_id = req.user.id;

    // Check if user is the comment owner
    const commentCheck = await pool.query('SELECT * FROM comments WHERE id = $1 AND user_id = $2', [commentId, user_id]);
    if (commentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Like comment
exports.likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const user_id = req.user.id;

    const existingLike = await pool.query(
      'SELECT * FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      [commentId, user_id]
    );

    if (existingLike.rows.length > 0) {
      return res.status(400).json({ error: 'You already liked this comment' });
    }

    await pool.query(
      'INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)',
      [commentId, user_id]
    );

    const likeCount = await pool.query(
      'SELECT COUNT(*) FROM comment_likes WHERE comment_id = $1',
      [commentId]
    );

    res.status(200).json({
      success: true,
      likes: parseInt(likeCount.rows[0].count),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Unlike comment
exports.unlikeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const user_id = req.user.id;

    await pool.query(
      'DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2',
      [commentId, user_id]
    );

    const likeCount = await pool.query(
      'SELECT COUNT(*) FROM comment_likes WHERE comment_id = $1',
      [commentId]
    );

    res.status(200).json({
      success: true,
      likes: parseInt(likeCount.rows[0].count),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

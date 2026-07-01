const pool = require('../db/db');

// Get all ratings
exports.getRatings = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT * FROM ratings ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM ratings');

    res.status(200).json({
      success: true,
      ratings: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get rating by ID
exports.getRating = async (req, res) => {
  try {
    const { ratingId } = req.params;

    const result = await pool.query(
      'SELECT * FROM ratings WHERE id = $1',
      [ratingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rating not found' });
    }

    res.status(200).json({
      success: true,
      rating: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create rating
exports.createRating = async (req, res) => {
  try {
    const { story_id, user_id, rating, review } = req.body;

    if (!story_id || !user_id || rating === undefined) {
      return res.status(400).json({ error: 'Please provide story_id, user_id, and rating' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if user already rated this story
    const existingRating = await pool.query(
      'SELECT * FROM ratings WHERE story_id = $1 AND user_id = $2',
      [story_id, user_id]
    );

    if (existingRating.rows.length > 0) {
      return res.status(400).json({ error: 'User has already rated this story' });
    }

    const result = await pool.query(
      'INSERT INTO ratings (story_id, user_id, rating, review) VALUES ($1, $2, $3, $4) RETURNING *',
      [story_id, user_id, rating, review || null]
    );

    res.status(201).json({
      success: true,
      rating: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update rating
exports.updateRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { rating, review } = req.body;

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const result = await pool.query(
      'UPDATE ratings SET rating = COALESCE($1, rating), review = COALESCE($2, review), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [rating || null, review || null, ratingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rating not found' });
    }

    res.status(200).json({
      success: true,
      rating: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete rating
exports.deleteRating = async (req, res) => {
  try {
    const { ratingId } = req.params;

    const result = await pool.query('DELETE FROM ratings WHERE id = $1 RETURNING *', [ratingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rating not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Rating deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get ratings by story
exports.getRatingsByStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT * FROM ratings WHERE story_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [storyId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM ratings WHERE story_id = $1',
      [storyId]
    );

    const avgResult = await pool.query(
      'SELECT AVG(rating) as average_rating FROM ratings WHERE story_id = $1',
      [storyId]
    );

    res.status(200).json({
      success: true,
      ratings: result.rows,
      total: parseInt(countResult.rows[0].count),
      averageRating: parseFloat(avgResult.rows[0].average_rating) || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get ratings by user
exports.getRatingsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT * FROM ratings WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM ratings WHERE user_id = $1',
      [userId]
    );

    res.status(200).json({
      success: true,
      ratings: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

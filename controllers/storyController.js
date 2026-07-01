const pool = require('../db/db');

// Get all stories
exports.getAllStories = async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT s.*, u.username, u.avatar_url FROM stories s JOIN users u ON s.author_id = u.id';
    const values = [];

    if (category) {
      query += ' WHERE s.category = $1';
      values.push(category);
    }

    query += ' ORDER BY s.created_at DESC LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
    values.push(limit, offset);

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      stories: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single story
exports.getStory = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT s.*, u.username, u.avatar_url FROM stories s JOIN users u ON s.author_id = u.id WHERE s.id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.status(200).json({
      success: true,
      story: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create story
exports.createStory = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const author_id = req.user.id;

    if (!title || !description) {
      return res.status(400).json({ error: 'Please provide title and description' });
    }

    const result = await pool.query(
      'INSERT INTO stories (title, description, author_id, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, author_id, category || 'general']
    );

    res.status(201).json({
      success: true,
      story: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update story
exports.updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;
    const author_id = req.user.id;

    // Check if user is the author
    const storyCheck = await pool.query('SELECT * FROM stories WHERE id = $1', [id]);
    if (storyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (storyCheck.rows[0].author_id !== author_id) {
      return res.status(403).json({ error: 'Not authorized to update this story' });
    }

    const result = await pool.query(
      'UPDATE stories SET title = COALESCE($1, title), description = COALESCE($2, description), status = COALESCE($3, status), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [title, description, status, id]
    );

    res.status(200).json({
      success: true,
      story: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete story
exports.deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const author_id = req.user.id;

    // Check if user is the author
    const storyCheck = await pool.query('SELECT * FROM stories WHERE id = $1', [id]);
    if (storyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (storyCheck.rows[0].author_id !== author_id) {
      return res.status(403).json({ error: 'Not authorized to delete this story' });
    }

    await pool.query('DELETE FROM stories WHERE id = $1', [id]);

    res.status(200).json({
      success: true,
      message: 'Story deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Like story
exports.likeStory = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Check if already liked
    const likeCheck = await pool.query(
      'SELECT * FROM likes WHERE user_id = $1 AND story_id = $2',
      [user_id, id]
    );

    if (likeCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Already liked this story' });
    }

    await pool.query('INSERT INTO likes (user_id, story_id) VALUES ($1, $2)', [user_id, id]);
    await pool.query('UPDATE stories SET likes = likes + 1 WHERE id = $1', [id]);

    res.status(200).json({
      success: true,
      message: 'Story liked successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Unlike story
exports.unlikeStory = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    await pool.query('DELETE FROM likes WHERE user_id = $1 AND story_id = $2', [user_id, id]);
    await pool.query('UPDATE stories SET likes = GREATEST(likes - 1, 0) WHERE id = $1', [id]);

    res.status(200).json({
      success: true,
      message: 'Story unliked successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

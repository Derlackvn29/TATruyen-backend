const pool = require('../db/db');

// Get all chapters for a story
exports.getChapters = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT * FROM chapters WHERE story_id = $1 ORDER BY chapter_number ASC LIMIT $2 OFFSET $3',
      [storyId, limit, offset]
    );

    res.status(200).json({
      success: true,
      chapters: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single chapter
exports.getChapter = async (req, res) => {
  try {
    const { storyId, chapterId } = req.params;

    const result = await pool.query(
      'SELECT * FROM chapters WHERE id = $1 AND story_id = $2',
      [chapterId, storyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    // Increment views
    await pool.query('UPDATE chapters SET views = views + 1 WHERE id = $1', [chapterId]);

    res.status(200).json({
      success: true,
      chapter: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create chapter
exports.createChapter = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { chapter_number, title, content } = req.body;
    const author_id = req.user.id;

    if (!chapter_number || !title || !content) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Check if user is the author of the story
    const storyCheck = await pool.query('SELECT * FROM stories WHERE id = $1 AND author_id = $2', [storyId, author_id]);
    if (storyCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to add chapters to this story' });
    }

    const result = await pool.query(
      'INSERT INTO chapters (story_id, chapter_number, title, content) VALUES ($1, $2, $3, $4) RETURNING *',
      [storyId, chapter_number, title, content]
    );

    res.status(201).json({
      success: true,
      chapter: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update chapter
exports.updateChapter = async (req, res) => {
  try {
    const { storyId, chapterId } = req.params;
    const { title, content } = req.body;
    const author_id = req.user.id;

    // Check if user is the author of the story
    const storyCheck = await pool.query('SELECT * FROM stories WHERE id = $1 AND author_id = $2', [storyId, author_id]);
    if (storyCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to update this chapter' });
    }

    const result = await pool.query(
      'UPDATE chapters SET title = COALESCE($1, title), content = COALESCE($2, content), updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND story_id = $4 RETURNING *',
      [title, content, chapterId, storyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    res.status(200).json({
      success: true,
      chapter: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete chapter
exports.deleteChapter = async (req, res) => {
  try {
    const { storyId, chapterId } = req.params;
    const author_id = req.user.id;

    // Check if user is the author of the story
    const storyCheck = await pool.query('SELECT * FROM stories WHERE id = $1 AND author_id = $2', [storyId, author_id]);
    if (storyCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to delete this chapter' });
    }

    await pool.query('DELETE FROM chapters WHERE id = $1 AND story_id = $2', [chapterId, storyId]);

    res.status(200).json({
      success: true,
      message: 'Chapter deleted successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

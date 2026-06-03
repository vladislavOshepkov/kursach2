import express from 'express';
const router = express.Router();
import pool from '../config/db.js';

// POST /custom-lessons/
router.post('/', async (req, res) => {
  const { lesson_title, lesson_description, lesson_content, lesson_estimated_time, lesson_created_at, course_id } = req.body;

  if (!course_id) {
    return res.status(400).json({ message: 'course_id обязателен' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO custom_lessons 
         (lesson_title, lesson_description, lesson_content, lesson_estimated_time, lesson_created_at, course_id, lesson_order)
       VALUES ($1, $2, $3, $4, $5, $6, 0)
       RETURNING *`,
      [lesson_title, lesson_description, lesson_content, lesson_estimated_time, lesson_created_at, course_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при создании урока' });
  }
});

// GET /custom-lessons/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM custom_lessons WHERE lesson_id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Урок не найден' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// PUT /custom-lessons/:id
router.put('/:id', async (req, res) => {
  const { lesson_title, lesson_description, lesson_content, lesson_estimated_time } = req.body;
  const lessonId = req.params.id;

  try {
    const result = await pool.query(
      `UPDATE custom_lessons
       SET lesson_title = $1,
           lesson_description = $2,
           lesson_content = $3,
           lesson_estimated_time = $4
       WHERE lesson_id = $5
       RETURNING *`,
      [lesson_title, lesson_description, lesson_content, lesson_estimated_time, lessonId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Урок не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при обновлении урока' });
  }
});
export default router;
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET /api/lesson/5 — получить один урок по lesson_id
router.get('/:lessonId', async (req, res) => {
  const { lessonId } = req.params;

  console.log('🔍 Запрос урока по ID:', lessonId);

  try {
    const result = await pool.query(
      `SELECT 
          lesson_id,
          lesson_title,
          lesson_description,
          lesson_order_num,
          lesson_estimated_time,
          lesson_content
       FROM lessons
       WHERE lesson_id = $1`,
      [lessonId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Урок не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Ошибка загрузки урока:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
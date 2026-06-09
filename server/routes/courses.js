import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        course_id,
        course_title,
        course_description,
        thumbnail_url
      FROM courses
      ORDER BY course_id
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Курсы не найдены' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Ошибка:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;

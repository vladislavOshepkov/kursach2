import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

/**
 * GET /api/languages
 * Возвращает соответствие: course_language → judge0_language_id
 * Пример: { "csharp": 51, "python": 71, "javascript": 63 }
 */
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        course_language,
        judge0_language_id
      FROM courses
      WHERE judge0_language_id IS NOT NULL
      GROUP BY course_id, judge0_language_id
    `);

    if (result.rows.length === 0) {
      return res.status(500).json({ message: 'Нет настроенных языков' });
    }

    // Преобразуем в объект: { csharp: 51, python: 71 }
    const languageMap = result.rows.reduce((acc, row) => {
      acc[row.course_language] = row.judge0_language_id;
      return acc;
    }, {});

    res.json(languageMap);
  } catch (err) {
    console.error('Ошибка /api/languages:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
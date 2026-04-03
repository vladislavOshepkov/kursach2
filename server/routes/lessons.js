import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/:courseId/', async (req, res) => {
  const { courseId } = req.params;

  console.log('🔍 Запрос уроков для course_id:', courseId); // ← Отладка

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
       WHERE course_id = $1
       ORDER BY lesson_order_num`,
      [courseId]
    );

    console.log('✅ Найдено уроков:', result.rows.length); // ← Сколько нашлось?

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Уроки не найдены для этого курса' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Ошибка загрузки уроков:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        lesson_id,
        course_id,
        lesson_title,
        lesson_description,
        lesson_order_num,
        lesson_estimated_time,
        lesson_content
      FROM lessons
      ORDER BY lesson_order_num
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка при загрузке уроков:', err);
    res.status(500).json({ message: 'Не удалось загрузить уроки' });
  }
});
export default router;
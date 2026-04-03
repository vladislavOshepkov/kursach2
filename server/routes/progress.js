import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { user_id, lesson_id, userprogress_is_completed, userprogress_completed_at, userprogress_time_spent } = req.body;

  try {
    await pool.query(
      `INSERT INTO userprogress 
       (user_id, lesson_id, userprogress_is_completed, userprogress_completed_at, userprogress_time_spent)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, lesson_id)
       DO UPDATE SET
         userprogress_is_completed = EXCLUDED.userprogress_is_completed,
         userprogress_completed_at = EXCLUDED.userprogress_completed_at,
         userprogress_time_spent = EXCLUDED.userprogress_time_spent`,
      [user_id, lesson_id, userprogress_is_completed, userprogress_completed_at, userprogress_time_spent]
    );

    res.status(200).json({ message: 'Прогресс сохранён' });
  } catch (error) {
    console.error('Ошибка при сохранении прогресса:', error);
    res.status(500).json({ error: 'Не удалось сохранить прогресс' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT 
         lesson_id, 
         userprogress_is_completed
       FROM userprogress
       WHERE user_id = $1`,
      [userId]
    );

    const progressMap = {};
    result.rows.forEach(row => {
      progressMap[row.lesson_id] = row.userprogress_is_completed;
    });

    res.json(progressMap);
  } catch (err) {
    console.error('Ошибка загрузки прогресса:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
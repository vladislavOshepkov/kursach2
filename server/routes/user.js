// server/routes/user.js
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// ✅ Получить всех пользователей
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id, user_login, user_email FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// ✅ Получить одного пользователя по ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT user_id, user_login FROM users WHERE user_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Важно: возвращаем { login: ... }, чтобы совпадало с ProfilePage
    res.json({ login: result.rows[0].user_login });
  } catch (err) {
    console.error('Ошибка при получении пользователя:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
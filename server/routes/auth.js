import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import dotenv from 'dotenv';
import { JWT_SECRET } from '../config/jwt.js';

dotenv.config();
//const JWT_SECRET = process.env.JWT_SECRET;

const router = express.Router();

router.post('/register', async (req, res) => {
  const { surname, name, patronym, login, email, password, role_id = 1 } = req.body;

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ message: 'Пароль обязателен' });
  }

  if (password.trim().length < 6) {
    return res.status(400).json({ message: 'Пароль должен быть не менее 6 символов' });
  }

  const trimmedPassword = password.trim();

  console.log('✅ Пароль до хеширования:', trimmedPassword);
  try {
    const existing = await pool.query(
      'SELECT * FROM users WHERE user_login = $1 OR user_email = $2',
      [login, email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Логин или email уже заняты' });
    }

    console.log('password:', password); // 🔍 Должно быть: 'apexLegends'
    console.log('typeof password:', typeof password);

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (
        user_surname, user_name, user_patronym, user_login, user_email, user_password_hash, role_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING user_id, user_surname, user_name, user_login, role_id`,
      [surname, name, patronym, login, email, hashedPassword, role_id]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.user_id, role: user.role_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/login', async (req, res) => {
  console.log('🔐 Логин: запрос получен');
  console.log('req.body:', req.body);

  const { login, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT 
         user_id, user_surname, user_name, user_login, role_id, user_password_hash
       FROM users 
       WHERE user_login = $1`,
      [login]
    );

    if (result.rows.length === 0) {
      console.log('❌ Пользователь не найден');
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.user_password_hash);

    if (!isMatch) {
      console.log('❌ Неверный пароль');
      return res.status(400).json({ message: 'Неверный пароль' });
    }

    let token;
    try {
      token = jwt.sign(
        { id: user.user_id, role: user.role_id },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
    } catch (err) {
      console.error('❌ Ошибка JWT:', err);
      return res.status(500).json({ message: 'Ошибка: не удалось создать токен' });
    }

    const { user_password_hash, ...userWithoutPassword } = user;
    console.log('✅ Вход успешен, отправляем токен');

    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('🚨 Ошибка входа:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
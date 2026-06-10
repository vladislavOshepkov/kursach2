// server/middleware/auth.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { JWT_SECRET } from '../config/jwt.js';

dotenv.config();

//const JWT_SECRET = process.env.JWT_SECRET; // ← ДОБАВИТЬ ЭТУ СТРОКУ

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('🔍 [auth.js] Authorization:', authHeader?.substring(0, 15) + '...'); // DEBUG

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('⚠️ [auth.js] Нет Bearer токена');
    return res.status(401).json({ message: 'Токен отсутствует' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET); // ← ИСПОЛЬЗОВАТЬ JWT_SECRET, а не process.env.JWT_SECRET
    console.log('✅ [auth.js] Токен валиден, decoded:', decoded);
    req.user = { user_id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    console.error('❌ [auth.js] JWT ошибка:', err.message); // ← ОШИБКА (например, "jwt expired")
    console.error('🔑 [auth.js] JWT_SECRET:', JWT_SECRET_PIDARAS ? 'Задан' : 'НЕТ!'); // ← ПРОВЕРКА СЕКРЕТА
    console.error('📩 [auth.js] Полученный токен:', token ? token.substring(0, 20) + '...' : 'ПУСТО'); // ← ПРОВЕРКА ТОКЕНА
    res.status(401).json({ message: 'Токен недействителен' });
  }
};
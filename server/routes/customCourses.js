// server/routes/customCourses.js
import express from 'express';
const router = express.Router();
import pool from '../config/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import { verifyToken } from '../middleware/auth.js';

// Секрет для bcrypt (можно вынести в env)
const SALT_ROUNDS = 10;

// --- Создание папки для иконок ---
const uploadDir = path.join(process.cwd(), 'server', 'public', 'uploads', 'icons');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// --- Multer настройка ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `icon-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({ storage });

// --- Получить все курсы (без изменений) ---
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        cc.course_id,
        cc.course_title,
        cc.course_description,
        cc.course_icon_url,
        cc.course_tags,
        cc.course_created_at,
        cc.is_private,
        cc.user_id,
        u.user_login AS author_name
      FROM custom_courses cc
      JOIN users u ON cc.user_id = u.user_id
      ORDER BY cc.course_created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// --- Получить курс по ID (с is_private) ---
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        cc.course_id,
        cc.course_title,
        cc.course_description,
        cc.course_icon_url,
        cc.course_tags,
        cc.course_created_at,
        cc.is_private,
        cc.user_id,
        u.user_login AS author_name
      FROM custom_courses cc
      JOIN users u ON cc.user_id = u.user_id
      WHERE cc.course_id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// --- Получить уроки курса (без изменений) ---
router.get('/:id/lessons', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM custom_lessons 
       WHERE course_id = $1
       ORDER BY lesson_order`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при загрузке уроков' });
  }
});

// --- ЗАПИСЬ НА КУРС ---
router.post('/:id/join', verifyToken, async (req, res) => {
  const { id: courseId } = req.params;
  const { password } = req.body;
  const userId = req.user?.user_id; // Проверка аутентификации на middleware

  if (!userId) {
    return res.status(401).json({ message: 'Необходима авторизация' });
  }

  try {
    // Получаем курс
    const { rows: [course] } = await pool.query(
      'SELECT * FROM custom_courses WHERE course_id = $1',
      [courseId]
    );

    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    // Если закрытый — проверяем пароль
    if (course.is_private) {
      if (!password) {
        return res.status(400).json({ message: 'Для этого курса требуется пароль' });
      }

      const isValid = bcrypt.compareSync(password, course.password_hash);
      if (!isValid) {
        return res.status(401).json({ message: 'Неверный пароль' });
      }
    }

    // Проверяем, не записан ли уже пользователь
    const { rows: [existing] } = await pool.query(
      'SELECT * FROM user_custom_courses WHERE user_id = $1 AND custom_course_id = $2',
      [userId, courseId]
    );

    if (existing) {
      return res.status(400).json({ message: 'Вы уже записаны на этот курс' });
    }

    // Записываем пользователя
    await pool.query(
      'INSERT INTO user_custom_courses (user_id, custom_course_id) VALUES ($1, $2)',
      [userId, courseId]
    );

    res.status(200).json({ message: 'Вы успешно записаны на курс!' });
  } catch (err) {
    console.error('❌ Ошибка записи на курс:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// --- ВЫХОД ИЗ КУРСА (отмена записи) ---
router.delete('/:id/join', verifyToken, async (req, res) => {
  const { id: courseId } = req.params;
  const userId = req.user?.user_id;

  if (!userId) {
    return res.status(401).json({ message: 'Необходима авторизация' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM user_custom_courses WHERE user_id = $1 AND custom_course_id = $2 RETURNING *',
      [userId, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Вы не записаны на этот курс' });
    }

    res.status(200).json({ message: 'Вы успешно покинули курс' });
  } catch (err) {
    console.error('❌ Ошибка выхода из курса:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

  router.get('/:id/join', verifyToken, async (req, res) => {
  const { id: courseId } = req.params;
  const userId = req.user?.user_id;

  if (!userId) {
    return res.status(401).json({ message: 'Необходима авторизация' });
  }

  try {
    const { rows: [existing] } = await pool.query(
      'SELECT * FROM user_custom_courses WHERE user_id = $1 AND custom_course_id = $2',
      [userId, courseId]
    );

    if (existing) {
      res.json({ message: 'Вы записаны на курс', isJoined: true });
    } else {
      res.status(404).json({ message: 'Вы не записаны на курс' });
    }
  } catch (err) {
    console.error('❌ Ошибка проверки записи:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// --- СПИСОК ПОЛЬЗОВАТЕЛЕЙ КУРСА (только автор) ---
router.get('/:id/joined-users', verifyToken,async (req, res) => {
  const { id: courseId } = req.params;
  const userId = req.user?.user_id;

  if (!userId) {
    return res.status(401).json({ message: 'Необходима авторизация' });
  }

  try {
    // Проверяем, что пользователь — автор курса
    const { rows: [course] } = await pool.query(
      'SELECT user_id FROM custom_courses WHERE course_id = $1',
      [courseId]
    );

    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    if (course.user_id !== userId) {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }

    // Получаем пользователей
    const result = await pool.query(
      `SELECT 
        u.user_id,
        u.user_login AS username,
        u.user_email,
        u.user_surname,
        u.user_name,
        u.user_patronym,
        ucc.joined_at
      FROM user_custom_courses ucc
      JOIN users u ON u.user_id = ucc.user_id
      WHERE ucc.custom_course_id = $1
      ORDER BY ucc.joined_at DESC`,
      [courseId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Ошибка получения списка пользователей:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// --- СОЗДАНИЕ КУРСА (с is_private и password_hash) ---
router.post('/', verifyToken, upload.single('course_icon'), async (req, res) => {
  const { course_title, course_description, course_tags, user_id, is_private, password } = req.body;

  // Если закрытый курс — пароль обязателен
  if (is_private === 'true' && !password) {
    return res.status(400).json({ message: 'Пароль обязателен для закрытого курса' });
  }

  // Путь к иконке
  const course_icon_url = req.file
    ? `http://localhost:5000/uploads/icons/${req.file.filename}`
    : 'uploads/icons/course-default.jpg';

  // Хэшируем пароль
  let password_hash = null;
  if (is_private === 'true' && password) {
    password_hash = bcrypt.hashSync(password, SALT_ROUNDS);
  }

  try {
    const result = await pool.query(
      `INSERT INTO custom_courses 
         (course_title, course_description, course_icon_url, course_tags, user_id, is_private, password_hash) 
       VALUES ($1, $2, $3, $4, $5, $6::BOOLEAN, $7) 
       RETURNING course_id`,
      [
        course_title,
        course_description,
        course_icon_url,
        course_tags,
        user_id,
        is_private,
        password_hash
      ]
    );

    res.status(201).json({ course_id: result.rows[0].course_id });
  } catch (err) {
    console.error('❌ Ошибка создания курса:', err);
    res.status(500).json({ message: 'Ошибка при создании курса' });
  }
});

// --- РЕДАКТИРОВАНИЕ КУРСА (с is_private и password_hash) ---
router.put('/:id', upload.single('course_icon'), async (req, res) => {
  const { course_title, course_description, course_tags, is_private, password } = req.body;
  const courseId = req.params.id;

  // Проверка авторства (опционально, но желательно)
  // const userId = req.user?.user_id;

  // Получаем текущие данные
  let currentCourse;
  try {
    const { rows: [course] } = await pool.query(
      'SELECT course_icon_url, is_private, password_hash FROM custom_courses WHERE course_id = $1',
      [courseId]
    );
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }
    currentCourse = course;
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Ошибка при получении данных курса' });
  }

  // Обновляем путь к иконке
  let course_icon_url = currentCourse.course_icon_url;
  if (req.file) {
    const oldIconPath = path.join(process.cwd(), 'server', 'public', currentCourse.course_icon_url);
    if (fs.existsSync(oldIconPath) && !currentCourse.course_icon_url.includes('course-default.jpg')) {
      fs.unlinkSync(oldIconPath);
    }
    course_icon_url = `http://localhost:5000/uploads/icons/${req.file.filename}`;
  }

  // Обновляем пароль, если курс стал закрытым
  let password_hash = currentCourse.password_hash;
  if (is_private === 'true') {
    if (!password && currentCourse.is_private === false) {
      return res.status(400).json({ message: 'Пароль обязателен для закрытого курса' });
    }
    if (password) {
      password_hash = bcrypt.hashSync(password, SALT_ROUNDS);
    }
  } else {
    password_hash = null;
  }

  try {
    const result = await pool.query(
      `UPDATE custom_courses
       SET course_title = $1, 
           course_description = $2, 
           course_icon_url = $3, 
           course_tags = $4,
           is_private = $5::BOOLEAN,
           password_hash = $6
       WHERE course_id = $7
       RETURNING *`,
      [course_title, course_description, course_icon_url, course_tags, is_private, password_hash, courseId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Ошибка обновления курса:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// --- Дополнительно: список курсов пользователя (записанных) ---
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        cc.course_id,
        cc.course_title,
        cc.course_description,
        cc.course_icon_url,
        cc.is_private,
        cc.course_created_at,
        COUNT(uc.user_custom_course_id) AS student_count
      FROM custom_courses cc
      LEFT JOIN user_custom_courses uc ON cc.course_id = uc.custom_course_id
      WHERE uc.user_id = $1
      GROUP BY cc.course_id
      ORDER BY cc.course_created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Ошибка получения курсов пользователя:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// --- СТАТИСТИКА ПОЛЬЗОВАТЕЛЯ ПО КУРСУ ---
router.get('/:id/users/:userId/stats', verifyToken, async (req, res) => {
  const { id: courseId, userId } = req.params;

  try {
    const { rows: [course] } = await pool.query(
      'SELECT user_id FROM custom_courses WHERE course_id = $1',
      [courseId]
    );

    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    const currentUserId = req.user?.user_id;
    if (course.user_id !== currentUserId && parseInt(userId) !== currentUserId) {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }

    const result = await pool.query(
  `SELECT 
    cl.lesson_id,
    cl.lesson_title,
    ucp.completed AS status,
    ucp.score,
    ucp.start_time AS started_at,
    ucp.end_time AS ended_at
  FROM user_custom_progress ucp
  JOIN custom_lessons cl ON ucp.lesson_id = cl.lesson_id
  WHERE ucp.user_id = $1 AND cl.course_id = $2
  ORDER BY ucp.start_time DESC`,
  [userId, courseId]
);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Ошибка получения статистики пользователя:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
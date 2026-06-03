// routes/customCourses.js
import express from 'express';
const router = express.Router();
import pool from '../config/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Получить все пользовательские курсы с данными автора
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

// Создаём папку, если её нет
const uploadDir = path.join(process.cwd(), 'server', 'public', 'uploads', 'icons');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка хранилища
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

// --- Маршрут создания курса (с загрузкой иконки) ---
router.post('/', upload.single('course_icon'), async (req, res) => {
  const { course_title, course_description, course_tags, user_id } = req.body;

  // Путь к иконке (если загружена)
  const course_icon_url = req.file
  ? `http://localhost:5000/uploads/icons/${req.file.filename}`  // относительный путь
  : 'uploads/icons/course-default.jpg';    

  try {
    const result = await pool.query(
      `INSERT INTO custom_courses 
         (course_title, course_description, course_icon_url, course_tags, user_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING course_id`,
      [course_title, course_description, course_icon_url, course_tags, user_id]
    );

    res.status(201).json({ course_id: result.rows[0].course_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при создании курса' });
  }
});

// routes/customCourses.js
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
        cc.user_id,
        u.user_login AS author_name
      FROM custom_courses cc
      JOIN users u ON cc.user_id = u.user_id
      WHERE cc.course_id = $1
      ORDER BY cc.course_created_at DESC`,
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

// --- Маршрут редактирования (с загрузкой иконки) ---
router.put('/:id', upload.single('course_icon'), async (req, res) => {
  const { course_title, course_description, course_tags } = req.body;
  const courseId = req.params.id;

  // Получаем текущие данные курса
  let currentCourse;
  try {
    const result = await pool.query(
      'SELECT course_icon_url FROM custom_courses WHERE course_id = $1',
      [courseId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Курс не найден' });
    }
    currentCourse = result.rows[0];
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Ошибка при получении данных курса' });
  }

  // Новый путь к иконке
  let course_icon_url = currentCourse.course_icon_url;
  if (req.file) {
    // Удаляем старую иконку (опционально)
    const oldIconPath = path.join(process.cwd(), 'server', 'public', currentCourse.course_icon_url);
    if (fs.existsSync(oldIconPath) && !currentCourse.course_icon_url.includes('course-default.jpg')) {
      fs.unlinkSync(oldIconPath);
    }
    course_icon_url = `http://localhost:5000/uploads/icons/${req.file.filename}`;
  }

  try {
    const result = await pool.query(
      `UPDATE custom_courses
       SET course_title = $1, 
           course_description = $2, 
           course_icon_url = $3, 
           course_tags = $4
       WHERE course_id = $5
       RETURNING *`,
      [course_title, course_description, course_icon_url, course_tags, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Курс не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при обновлении курса' });
  }
});

export default router;
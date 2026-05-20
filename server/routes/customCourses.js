// routes/customCourses.js
import express from 'express';
const router = express.Router();
import pool from '../config/db.js';

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

// routes/customCourses.js
router.post('/', async (req, res) => {
  const { course_title, course_description, course_icon_url, course_tags, user_id } = req.body;

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

export default router;
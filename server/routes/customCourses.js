// routes/customCourses.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

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
        u.user_full_name AS author_name
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

module.exports = router;
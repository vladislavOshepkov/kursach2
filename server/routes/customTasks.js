import express from 'express';
const router = express.Router();
import pool from '../config/db.js';

// POST /api/custom-tasks — создание задания
router.post('/', async (req, res) => {
  const {
    lesson_id,
    title,
    description,
    type,
    difficulty,
    attempt_mode = 'unlimited',
    max_attempts,
    options,
    correct_answers,
    answer,
    language,
    base_score = type === 'code' ? 2 : 1
  } = req.body;

  if (!lesson_id) {
    return res.status(400).json({ message: 'lesson_id обязателен' });
  }

  try {
    // 1. Вставляем задание
    const taskResult = await pool.query(
      `INSERT INTO custom_tasks 
         (lesson_id, title, description, type, difficulty, attempt_mode, max_attempts, 
          options, correct_answers, answer, language, base_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING task_id`,
      [
        lesson_id,
        title,
        description,
        type,
        difficulty,
        attempt_mode,
        attempt_mode === 'limited' ? max_attempts : null,
        type === 'single' || type === 'multiple' ? JSON.stringify(options) : null,
        type === 'single'
          ? JSON.stringify([correct_answers])
          : type === 'multiple'
            ? JSON.stringify(correct_answers)
            : null,
        type === 'code' ? answer : null,
        type === 'code' ? language : null,
        base_score
      ]
    );

    const { task_id } = taskResult.rows[0];

    // 2. Создаём связь урок — задание
    await pool.query(
      `INSERT INTO custom_lesson_tasks (lesson_id, task_id)
       VALUES ($1, $2)`,
      [lesson_id, task_id]
    );

    // 3. Возвращаем созданные данные
    const finalResult = await pool.query(
      `SELECT * FROM custom_tasks WHERE task_id = $1`,
      [task_id]
    );

    res.status(201).json(finalResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при создании задания' });
  }
});

// GET /api/custom-tasks?lesson_id=1 — получение заданий урока
router.get('/', async (req, res) => {
  const { lesson_id } = req.query;
  if (!lesson_id) {
    return res.status(400).json({ message: 'lesson_id обязателен' });
  }

  try {
    const result = await pool.query(
      `SELECT ct.*, 
              clt.created_at
       FROM custom_tasks ct
       JOIN custom_lesson_tasks clt ON ct.task_id = clt.task_id
       WHERE clt.lesson_id = $1`,
      [lesson_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при загрузке заданий' });
  }
});

// PUT /api/custom-tasks/:id — обновление
router.put('/:id', async (req, res) => {
  const { id: task_id } = req.params;
  const {
    title, description, type, difficulty,
    attempt_mode, max_attempts, options,
    correct_answers, answer, language, base_score
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE custom_tasks SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         type = COALESCE($3, type),
         difficulty = COALESCE($4, difficulty),
         attempt_mode = COALESCE($5, attempt_mode),
         max_attempts = $6,
         options = $7,
         correct_answers = $8,
         answer = $9,
         language = $10,
         base_score = COALESCE($11, base_score)
       WHERE task_id = $12
       RETURNING *`,
      [
        title, description, type, difficulty,
        attempt_mode,
        attempt_mode === 'limited' ? max_attempts : null,
        options ? JSON.stringify(options) : null,
        correct_answers ? JSON.stringify(correct_answers) : null,
        answer,
        language,
        base_score,
        task_id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Задание не найдено' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при обновлении задания' });
  }
});

export default router;
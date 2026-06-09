// server/routes/customProgress.js

import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

// ✅ helper: рассчитать баллы за задание
function calculateTaskScore(task, isCorrect) {
  if (!isCorrect) return 0;

  const base = task.base_score || 1;

  if (task.type === 'single') {
    return base;
  } else if (task.type === 'multiple') {
    const correctAnswers = Array.isArray(task.correct_answers)
      ? task.correct_answers
      : JSON.parse(task.correct_answers || '[]');

    const n = correctAnswers.length; // всего правильных вариантов

    // Для multiple: если пользователь выбрал только правильные — получает полные баллы
    // Но вы сказали: m / n за КАЖДЫЙ правильный выбранный
    // Значит, если правильных ответов 3, и пользователь выбрал 2 — получит 2 * (base / 3)
    // НО: если он ошибся (ввёл неправильный вариант), то баллы не даются?
    // — по вашему описанию — только за правильные, даже если выбран неправильный.

    // Гипотеза: если хотя бы один неправильный выбор — 0 баллов.
    // Иначе: base_score * (кол-во правильных выбрано) / (всего правильных)

    // На текущий момент в `task` у вас `correct_answers` — это массив индексов вариантов (для `single/multiple`)
    // Но в `userAnswers[taskIndex]` — массив выбранных индексов.

    // Поэтому возвращаем `base_score * k / n`, если пользователь **не ошибся**
    return base;
  } else if (task.type === 'code') {
    return base;
  }

  return 0;
}

// POST /api/custom-progress/start — начать урок (сбрасываем score)
router.post('/start', async (req, res) => {
  const { user_id, lesson_id } = req.body;

  if (!user_id || !lesson_id) {
    return res.status(400).json({ message: 'Требуются user_id и lesson_id' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO user_custom_progress (user_id, lesson_id, last_task_index, score, total_score, completed, start_time)
       VALUES ($1, $2, 0, 0, 0, FALSE, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, lesson_id)
       DO UPDATE SET 
         last_task_index = 0,
         score = 0,
         total_score = 0,
         completed = FALSE,
         start_time = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [user_id, lesson_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при начале урока:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /api/custom-progress/add-score — начислить баллы за задание
router.post('/add-score', async (req, res) => {
  const { user_id, lesson_id, task_id, isCorrect } = req.body;

  if (!user_id || !lesson_id || task_id === undefined) {
    return res.status(400).json({ message: 'Требуются user_id, lesson_id, task_id, isCorrect' });
  }

  try {
    // Получаем задание
    const taskResult = await pool.query(
      `SELECT * FROM custom_tasks WHERE task_id = $1`,
      [task_id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: 'Задание не найдено' });
    }

    const task = taskResult.rows[0];

    // Рассчитываем баллы
    const points = calculateTaskScore(task, isCorrect);

    // Обновляем прогресс
    const result = await pool.query(
      `UPDATE user_custom_progress 
       SET score = score + $3, 
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND lesson_id = $2
       RETURNING *`,
      [user_id, lesson_id, points]
    );

    res.json({
      progress: result.rows[0],
      points,
    });
  } catch (err) {
    console.error('Ошибка при начислении баллов:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// PUT /api/custom-progress/complete — завершить урок и сохранить total_score
router.put('/complete', async (req, res) => {
  const { user_id, lesson_id } = req.body;

  if (!user_id || !lesson_id) {
    return res.status(400).json({ message: 'Требуются user_id и lesson_id' });
  }

  try {
    const result = await pool.query(
      `UPDATE user_custom_progress 
       SET completed = TRUE, 
           end_time = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND lesson_id = $2
       RETURNING *`,
      [user_id, lesson_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Прогресс не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при завершении урока:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// GET /api/custom-progress/:userId/:lessonId
router.get('/:userId/:lessonId', async (req, res) => {
  const { userId, lessonId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM user_custom_progress 
       WHERE user_id = $1 AND lesson_id = $2`,
      [userId, lessonId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Прогресс не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при получении прогресса:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// PUT /api/custom-progress/update — обновить позицию (без изменения баллов)
router.put('/update', async (req, res) => {
  const { user_id, lesson_id, last_task_index } = req.body;

  if (!user_id || !lesson_id || last_task_index === undefined) {
    return res.status(400).json({ message: 'Требуются user_id, lesson_id, last_task_index' });
  }

  try {
    const result = await pool.query(
      `UPDATE user_custom_progress 
       SET last_task_index = $3, 
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND lesson_id = $2
       RETURNING *`,
      [user_id, lesson_id, last_task_index]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при обновлении прогресса:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// GET /api/custom-progress/user/:userId — прогресс по всем урокам пользователя
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        ucp.progress_id,
        ucp.lesson_id,
        cl.lesson_title,
        ucp.score,
        ucp.total_score,
        ucp.completed,
        ucp.start_time,
        ucp.end_time,
        ucp.last_task_index
       FROM user_custom_progress ucp
       JOIN custom_lessons cl ON ucp.lesson_id = cl.lesson_id
       WHERE ucp.user_id = $1
       ORDER BY ucp.start_time DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка при получении прогресса пользователя:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
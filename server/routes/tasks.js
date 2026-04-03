import express from 'express';
import pool from '../config/db.js';
import { compileCode } from '../services/compiler.js';

const router = express.Router();

// --- GET /api/tasks/lesson/:lessonId ---
// Получить задания урока
router.get('/lesson/:lessonId', async (req, res) => {
  const { lessonId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        t.task_id,
        t.task_title,
        t.task_description,
        t.task_difficulty,
        t.task_correct_answer,
        t.task_hints,
        t.task_max_attempts,
        t.task_points,
        t.task_created_at,
        t.task_language,
        lt.lessontask_order_num
      FROM tasks t
      JOIN lessontasks lt ON t.task_id = lt.task_id
      WHERE lt.lesson_id = $1
      ORDER BY lt.lessontask_order_num ASC
    `, [lessonId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Задания не найдены для этого урока' });
    }

    const tasks = result.rows.map(task => ({
      ...task,
      task_correct_answer: task.task_correct_answer?.trim() || '',
      task_hints: Array.isArray(task.task_hints) ? task.hints : []
    }));

    res.json(tasks);
  } catch (err) {
    console.error('❌ Ошибка при загрузке заданий:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// POST /api/tasks/check
router.post('/check', async (req, res) => {
  const { task_id, user_code } = req.body;

  if (!task_id || !user_code) {
    return res.status(400).json({ 
      isCorrect: false, 
      message: 'Требуется task_id и user_code' 
    });
  }

  const normalize = (str) => str?.replace(/[\r\n]+/g, '').trim();

  try {
    const result = await pool.query(
      `SELECT task_correct_answer, task_max_attempts, task_language FROM tasks WHERE task_id = $1`,
      [task_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        isCorrect: false, 
        message: 'Задание не найдено' 
      });
    }

    const { task_correct_answer, task_max_attempts, task_language } = result.rows[0];
    const expectedOutput = normalize(task_correct_answer);

    if (!expectedOutput) {
      return res.status(500).json({
        isCorrect: false,
        message: 'У задания отсутствует ожидаемый ответ'
      });
    }

    const compileResult = await compileCode(user_code.trim(), task_language);

    if (compileResult.error) {
      console.error('❌ Ошибка компиляции:', compileResult.error);
      return res.json({
        isCorrect: false,
        message: `Ошибка компиляции: ${compileResult.error}`
      });
    }

    if (compileResult.stderr) {
      console.error('❌ Ошибка выполнения:', compileResult.stderr);
      return res.json({
        isCorrect: false,
        message: `Ошибка выполнения: ${compileResult.stderr}`
      });
    }

    const actualOutput = normalize(compileResult.stdout);
    const isCorrect = actualOutput === expectedOutput;

    res.json({
      isCorrect,
      message: isCorrect
        ? '✅ Правильно! Вывод совпадает.'
        : `❌ Неверный вывод. Ожидалось: "${expectedOutput}", получено: "${actualOutput}"`
    });

  } catch (err) {
    console.error('❌ Ошибка при проверке задания:', err);
    res.status(500).json({
      isCorrect: false,
      message: 'Ошибка сервера при проверке кода'
    });
  }
});

// POST /api/tasks/compile
router.post('/compile', async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ 
      error: 'Требуются: code, language' 
    });
  }

  try {
    const result = await compileCode(code.trim(), language);
    res.json(result);
  } catch (err) {
    console.error('❌ Ошибка при выполнении кода:', err);
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера при выполнении кода' 
    });
  }
});

export default router;
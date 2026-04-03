import express from 'express';
import { compileCode } from '../services/compiler.js';

const router = express.Router();

router.post('/compile', async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: 'Требуются code и language' });
  }

  const result = await compileCode(code.trim(), language);

  res.json(result);
});

export default router;
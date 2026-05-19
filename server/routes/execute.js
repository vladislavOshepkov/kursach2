import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/run', async (req, res) => {
  const { source_code, language_id } = req.body;

  try {
    const response = await axios.post(
      'https://judge0-ce.p.rapidapi.com/submissions',
      {
        language_id,
        source_code,
        stdin: '',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        },
        params: { base64_encoded: 'false' },
      }
    );

    res.json({ token: response.data.token });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка выполнения' });
  }
});

router.get('/status/:token', async (req, res) => {
  const { token } = req.params;
  const response = await axios.get(`https://judge0-ce.p.rapidapi.com/submissions/${token}`, {
    headers: {
      'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
      'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
    },
    params: { base64_encoded: 'false' },
  });
  res.json(response.data);
});

export default router;
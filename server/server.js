import './config/db.js';

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import userRoutes from './routes/user.js';
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js'
import lessonRoutes from './routes/lessons.js';
import singleLessonRoute from './routes/lesson.js';
import progressRouter from './routes/progress.js';
import languageRoutes from './routes/languages.js';
import taskRoutes from './routes/tasks.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/lesson', singleLessonRoute);
app.use('/api/tasks', taskRoutes);
app.use('/api/progress', progressRouter);
app.use('/api/languages', languageRoutes);

app.get('/', (req, res) => {
  res.send('Сервер работает! 🚀');
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});
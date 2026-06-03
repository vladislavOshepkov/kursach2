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
import customCourses from './routes/customCourses.js';
import customLessons from './routes/customLessons.js';
import customTasks from './routes/customTasks.js';

import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
app.use('/api/custom-courses', customCourses);
app.use('/api/custom-lessons', customLessons);
app.use('/api/custom-tasks', customTasks);
app.use('/uploads', express.static(path.join(__dirname, 'server', 'public', 'uploads')));
app.use('/icons', express.static(path.join(__dirname, 'server', 'public', 'icons')));

app.get('/', (req, res) => {
  res.send('Сервер работает! 🚀');
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import CoursesPage from './pages/CoursesPage';
import LessonsPage from './pages/LessonsPage';
import LessonDetailPage from './pages/LessonDetailPage';
import ProfilePage from './pages/ProfilePage';
import CustomCoursesPage from './pages/CustomCoursesPage';
import CustomCoursePage from './pages/CustomCoursePage';
import CustomLessonPage from './pages/CustomLessonPage';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/course/:courseId/lessons" element={<LessonsPage />} />
        <Route path="/lesson/:lessonId" element={<LessonDetailPage />} />
        <Route path="/custom-courses" element={<CustomCoursesPage />} />
        <Route path="/custom-course/:id" element={<CustomCoursePage />} />
        <Route path="/custom-lessons/:id" element={<CustomLessonPage />} />
      </Routes>
    </BrowserRouter>
  );
}
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const HomeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

export default function LessonsPage() {
  const { courseId } = useParams();
  const location = useLocation();
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState({}); // ← Храним прогресс: { lessonId: true/false }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!courseId) {
      setError('Курс не выбран');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Загружаем уроки курса
        const resLessons = await fetch(`http://localhost:5000/api/lessons/${courseId}`);
        if (!resLessons.ok) throw new Error(`Ошибка загрузки уроков: ${resLessons.status}`);
        const lessonsData = await resLessons.json();
        setLessons(lessonsData);

        const userId = localStorage.getItem('userId');
        if (userId) {
          const resProgress = await fetch(`http://localhost:5000/api/progress/user/${userId}`);
          if (resProgress.ok) {
            const progressData = await resProgress.json(); // { 1: true, 2: false }
            setProgress(progressData);
          }
        }
      } catch (err) {
        console.error('Ошибка при загрузке:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const handleLessonClick = (lessonId) => {
    navigate(`/lesson/${lessonId}`);
  };

  if (loading) return <div className="text-white">Загрузка уроков...</div>;
  if (error) return <div className="text-red-400">Ошибка: {error}</div>;

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Боковая панель */}
{/* Боковая панель */}
<div className="w-20 bg-gray-800 flex flex-col items-center py-6 space-y-8 relative flex-shrink-0">
  {/* Кнопка "Курсы" */}
  <Link to="/courses">
    <div
      className={`p-3 rounded-lg transition-all cursor-pointer ${
        location.pathname === '/courses'
          ? 'bg-purple-600'
          : 'bg-gray-700 hover:bg-gray-600'
      }`}
      title="Курсы"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"
        />
      </svg>
    </div>
  </Link>

  {/* 🔻 НОВАЯ КНОПКА: Пользовательские курсы */}
  <Link to="/custom-courses">
    <div
      className={`p-3 rounded-lg transition-all cursor-pointer ${
        location.pathname === '/custom-courses'
          ? 'bg-purple-600'
          : 'bg-gray-700 hover:bg-gray-600'
      }`}
      title="Пользовательские курсы"
    >
      {/* Иконка: книга с пером (или альтернатива — просто книга) */}
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    </div>
  </Link>

  {/* Кнопка "Профиль" */}
  <Link to="/profile">
    <div
      className={`p-3 rounded-lg transition-all cursor-pointer ${
        location.pathname === '/profile'
          ? 'bg-purple-600'
          : 'bg-gray-700 hover:bg-gray-600'
      }`}
      title="Профиль"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </div>
  </Link>
</div>

      {/* Основная часть */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="p-6 border-b border-gray-700 bg-gray-800">
          <h1 className="text-2xl font-bold">Уроки</h1>
          <p className="text-gray-400">Выберите урок для продолжения</p>
        </header>

        <main className="flex-1 p-6 bg-gray-900 overflow-y-auto">
          <div className="space-y-4">
            {lessons.length === 0 ? (
              <p className="text-gray-400">Нет доступных уроков</p>
            ) : (
              lessons.map((lesson) => (
                <div
                  key={lesson.lesson_id}
                  className="flex items-center justify-between p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition cursor-pointer group"
                  onClick={() => handleLessonClick(lesson.lesson_id)}
                >
                  <div className="flex items-center space-x-4">
                    <span className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
                      {lesson.lesson_order_num}
                    </span>

                    <div>
                      <h3 className="text-lg font-semibold">{lesson.lesson_title}</h3>
                      {lesson.lesson_description && (
                        <p className="text-gray-400 text-sm mt-1">{lesson.lesson_description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-purple-300 text-sm font-medium">
                      {lesson.lesson_estimated_time} мин
                    </span>

                    {progress[lesson.lesson_id] ? (
                      <div className="flex items-center text-green-400 space-x-1">
                        <CheckIcon />
                        <span className="text-sm font-medium">Выполнен</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Не начат</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

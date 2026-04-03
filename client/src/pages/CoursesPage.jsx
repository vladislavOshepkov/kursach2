import { Link, useNavigate } from 'react-router-dom';
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

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/courses');
        if (!res.ok) throw new Error('Не удалось загрузить курсы');
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}/lessons`);
  };

  if (loading) return <div className="text-white">Загрузка курсов...</div>;
  if (error) return <div className="text-red-400">Ошибка: {error}</div>;

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      
      {/* Боковая панель */}
<div className="w-20 bg-gray-800 flex flex-col items-center py-6 space-y-8 relative flex-shrink-0">
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
      {/* Основная область */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Заголовок */}
        <header className="p-6 border-b border-gray-700 bg-gray-800">
          <h1 className="text-2xl font-bold">Выберите курс</h1>
          <p className="text-gray-400">Начните изучение с любого языка</p>
        </header>

        {/* Список курсов — прокручивается */}
        <main className="flex-1 p-6 bg-gray-900 overflow-y-auto">
          <div className="space-y-6">
            {courses.length === 0 ? (
              <p className="text-gray-400">Нет доступных курсов</p>
            ) : (
              courses.map((course) => (
                <div
                  key={course.course_id}
                  className="flex items-center p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition cursor-pointer group"
                  onClick={() => handleCourseClick(course.course_id)}
                >
                  <img
                    src={course.thumbnail_url}
                    alt={`${course.course_title} logo`}
                    className="w-16 h-16 object-contain rounded-lg bg-white p-1"
                  />

                  <div className="ml-6">
                    <h3 className="text-xl font-semibold">{course.course_title}</h3>
                    <p className="text-gray-300 mt-1">{course.course_description}</p>
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

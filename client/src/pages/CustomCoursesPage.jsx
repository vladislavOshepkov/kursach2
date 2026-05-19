import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CustomCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('student'); // Получим из localStorage

  const navigate = useNavigate();

  useEffect(() => {
    // Получаем роль пользователя
    const role = localStorage.getItem('userRole') || 'student';
    setUserRole(role);

    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/custom-courses');
      if (!res.ok) throw new Error('Не удалось загрузить курсы');
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) return <div className="text-white">Загрузка курсов...</div>;

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Боковая панель */}
      <div className="w-20 bg-gray-800 flex flex-col items-center py-6 space-y-8">
        <button
          onClick={() => window.history.back()}
          className="bg-gray-700 hover:bg-gray-600 p-2 rounded transition"
          title="Назад"
        >
          <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Основная часть */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="p-6 border-b border-gray-700 bg-gray-800">
          <h1 className="text-2xl font-bold">Пользовательские курсы</h1>
          <p className="text-gray-400">Курсы, созданные преподавателями сообщества</p>
        </header>

        <main className="flex-1 p-6 bg-gray-900 overflow-y-auto">
          {/* Кнопка "Создать курс" — только для преподавателя */}
          {userRole === 'teacher' && (
            <div className="mb-8">
              <button
                onClick={() => navigate('/create-custom-course')}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-medium shadow-lg transform hover:scale-105 transition"
              >
                ➕ Создать курс
              </button>
            </div>
          )}

          {/* Список курсов */}
          {courses.length === 0 ? (
            <p className="text-gray-500">Пока нет ни одного пользовательского курса.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.course_id}
                  onClick={() => navigate(`/custom-course/${course.course_id}`)}
                  className="bg-gray-800 rounded-xl p-5 cursor-pointer hover:bg-gray-750 transition transform hover:scale-102 shadow-lg"
                >
                  {/* Иконка и заголовок */}
                  <div className="flex items-start space-x-4 mb-4">
                    <img
                      src={course.course_icon_url}
                      alt="Иконка курса"
                      className="w-12 h-12 rounded-lg object-cover border border-gray-600"
                    />
                    <div>
                      <h3 className="font-bold text-lg text-purple-300">{course.course_title}</h3>
                      <p className="text-sm text-gray-400">от {course.author_name}</p>
                    </div>
                  </div>

                  {/* Описание */}
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {course.course_description || 'Описание отсутствует.'}
                  </p>

                  {/* Теги */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {course.course_tags?.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-gray-700 text-xs rounded-full text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Дата создания */}
                  <p className="text-xs text-gray-500">
                    Создан: {formatDate(course.course_created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
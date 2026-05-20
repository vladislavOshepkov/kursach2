import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CustomCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('1');
  const [isModalOpen, setIsModalOpen] = useState(false); // Управление модалкой

  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 
                 localStorage.getItem('role') || 
                 '1';
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

  // --- Модальное окно создания курса ---
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Боковая панель */}
      <div className="w-20 bg-gray-800 flex flex-col items-center py-6 space-y-8">
        <button
          onClick={() => navigate(-1)}
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
          {userRole === '2' && (
            <div className="mb-8">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-medium shadow-lg transform hover:scale-105 transition"
              >
                ➕ Создать курс
              </button>
            </div>
          )}

          {/* Список курсов */}
          {loading ? (
            <p>Загрузка...</p>
          ) : courses.length === 0 ? (
            <p className="text-gray-500">Пока нет ни одного пользовательского курса.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.course_id}
                  onClick={() => navigate(`/custom-course/${course.course_id}`)}
                  className="bg-gray-800 rounded-xl p-5 cursor-pointer hover:bg-gray-750 transition transform hover:scale-102 shadow-lg"
                >
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

                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {course.course_description || 'Описание отсутствует.'}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {course.course_tags?.slice(0, 3).map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-700 text-xs rounded-full text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500">
                    Создан: {formatDate(course.course_created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* 🔹 МОДАЛЬНОЕ ОКНО СОЗДАНИЯ КУРСА */}
      {isModalOpen && <CreateCourseModal onClose={() => setIsModalOpen(false)} onSuccess={fetchCourses} />}
    </div>
  );
}

// --- Внешний компонент модалки ---
function CreateCourseModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    course_title: '',
    course_description: '',
    course_icon_url: '/icons/course-default.svg',
    course_tags: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const tags = formData.course_tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag);

    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('❌ Пользователь не авторизован');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      ...formData,
      course_tags: tags,
      user_id: parseInt(userId, 10),
    };

    try {
      const res = await fetch('http://localhost:5000/api/custom-courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess(); // Обновляем список курсов
        onClose(); // Закрываем модалку
      } else {
        throw new Error(data.message || 'Не удалось создать курс');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-700 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Создать курс</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-900/50 text-red-200 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Название курса</label>
            <input
              type="text"
              name="course_title"
              value={formData.course_title}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
              placeholder="Например: Основы C# для начинающих"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Описание</label>
            <textarea
              name="course_description"
              value={formData.course_description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 resize-none"
              placeholder="Кратко опишите, чему научат участники"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Ссылка на иконку (URL)</label>
            <input
              type="url"
              name="course_icon_url"
              value={formData.course_icon_url}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
              placeholder="https://example.com/icon.png"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Теги (через запятую)</label>
            <input
              type="text"
              name="course_tags"
              value={formData.course_tags}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
              placeholder="C#, ООП, Новичок"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-medium transition"
            >
              {isSubmitting ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
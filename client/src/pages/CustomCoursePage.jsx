import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function CustomCoursePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Получаем ID текущего пользователя
  const userId = localStorage.getItem('userId');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        // Загружаем данные курса
        const resCourse = await fetch(`http://localhost:5000/api/custom-courses/${id}`);
        if (!resCourse.ok) throw new Error('Курс не найден');
        const dataCourse = await resCourse.json();
        setCourse(dataCourse);

        // Загружаем уроки курса
        const resLessons = await fetch(`http://localhost:5000/api/custom-courses/${id}/lessons`);
        if (!resLessons.ok) throw new Error('Не удалось загрузить уроки');
        const dataLessons = await resLessons.json();
        setLessons(dataLessons);
      } catch (err) {
        console.error(err);
        alert('❌ ' + err.message);
        navigate('/custom-courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, navigate]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Проверка: пользователь — автор курса?
  const isAuthor = course && userId === course.user_id?.toString();

  const openEditModal = () => {
    setFormData({
      course_title: course.course_title,
      course_description: course.course_description || '',
      course_icon_url: course.course_icon_url || '/icons/course-default.jpg',
      course_tags: Array.isArray(course.course_tags)
        ? course.course_tags.join(', ')
        : (course.course_tags || ''),
    });
    setIsEditModalOpen(true);
  };

  // --- Модальное окно редактирования ---
  const [formData, setFormData] = useState({
    course_title: '',
    course_description: '',
    course_icon_url: '/icons/course-default.jpg',
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

    const formDataToSend = new FormData();
      formDataToSend.append('course_title', formData.course_title);
      formDataToSend.append('course_description', formData.course_description);
      formDataToSend.append('user_id', userId);
      tags.forEach(tag => {
    formDataToSend.append('course_tags', tag);
  });
      if (fileToUpload) {
        formDataToSend.append('course_icon', fileToUpload);
      }


    try {
      const res = await fetch(`http://localhost:5000/api/custom-courses/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
         body: formDataToSend,
      });

      const data = await res.json();

      if (res.ok) {
        // Обновляем данные курса локально
        setCourse((prev) => ({
          ...prev,
          course_title: data.course_title,
          course_description: data.course_description,
          course_icon_url: data.course_icon_url,
          course_tags: data.course_tags,
        }));
        setIsEditModalOpen(false);
        alert('✅ Курс успешно обновлён!');
      } else {
        throw new Error(data.message || 'Не удалось сохранить изменения');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchLessons = async (courseId) => {
  try {
    const res = await fetch(`http://localhost:5000/api/custom-courses/${courseId}/lessons`);
    if (!res.ok) throw new Error('Не удалось загрузить уроки');
    const data = await res.json();
    setLessons(data); // ✅ обновляем список уроков
  } catch (err) {
    console.error('Ошибка загрузки уроков:', err);
    // Можно добавить alert('❌ ' + err.message);
  }
};

  const closeModal = () => {
    setIsEditModalOpen(false);
    setError('');
  };

  if (loading) return <div className="text-white p-6">Загрузка...</div>;
  if (!course) return <div className="text-white p-6">Курс не найден</div>;

  return (
    <>
      <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
        {/* Боковая панель */}
        <div className="w-20 bg-gray-800 flex flex-col items-center py-6 space-y-8 relative flex-shrink-0">
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
          {/* Заголовок курса */}
          <header className="p-6 border-b border-gray-700 bg-gray-800">
            <h1 className="text-2xl font-bold">{course.course_title}</h1>
            <p className="text-gray-400 mt-1">
              Автор: {course.author_name} • Создан: {formatDate(course.course_created_at)}
            </p>
            <p className="text-gray-300 mt-2 leading-relaxed">
              {course.course_description || 'Описание отсутствует.'}
            </p>
          </header>

          {/* Панель управления */}
          {isAuthor && (
            <div className="p-6 bg-gray-800 border-b border-gray-700 flex gap-4">
              <button
                onClick={openEditModal}
                className="px-5 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium shadow transition"
              >
                📝 Редактировать курс
              </button>
              <button
                onClick={() => setIsLessonModalOpen(true)}
                className="px-5 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium shadow transition"
              >
                ➕ Добавить урок
              </button>
            </div>
          )}

          {/* Модальное окно создания урока */}
{isLessonModalOpen && (
  <CreateLessonModal
    courseId={course.course_id}
    onClose={() => setIsLessonModalOpen(false)}
    onSuccess={() => fetchLessons(course.course_id)} // обновляет список уроков
  />
)}

          {/* Основной контент */}
          <main className="flex-1 p-6 bg-gray-900 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6">Уроки курса</h2>

            {lessons.length === 0 ? (
              <p className="text-gray-500">В этом курсе пока нет уроков. Нажмите «Добавить урок», чтобы начать.</p>
            ) : (
              <div className="space-y-4">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.lesson_id}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition cursor-pointer group"
                    onClick={() => navigate(`/custom-lessons/${lesson.lesson_id}`)}
                  >
                    <div className="flex items-center space-x-4">
                      <span className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
                        {lesson.lesson_order_num || index + 1}
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
                      <span className="text-gray-500 text-sm">Не начат</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 🔹 МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ КУРСА */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-700 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Редактировать курс</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white text-2xl leading-none">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-900/50 text-red-200 text-sm rounded-lg">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Название курса</label>
                <input
                  type="text"
                  name="course_title"
                  value={formData.course_title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
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
              <label className="block text-sm font-medium text-gray-300 mb-1">Иконка курса</label>
              <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const previewUrl = URL.createObjectURL(file);
                  setFormData((prev) => ({ ...prev, course_icon_preview: previewUrl }));
                  setFileToUpload(file); // Сохраняем файл для отправки
                }
            }}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700"
          />
        </div>

        {/* Предпросмотр */}
        {formData.course_icon_preview && (
          <div className="mt-3">
            <p className="text-sm text-gray-400 mb-1">Предпросмотр:</p>
            <img
              src={formData.course_icon_preview}
              alt="Предпросмотр иконки"
              className="w-16 h-16 object-cover rounded-lg border border-gray-600"
            />
          </div>
        )}

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
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg font-medium transition"
                >
                  {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function CreateLessonModal({ courseId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    lesson_title: '',
    lesson_description: '',
    lesson_content: '',
    lesson_estimated_time: '',
    lesson_created_at: new Date().toISOString().slice(0, 16),
    attempt_mode: 'unlimited',
    max_attempts: 1,
    show_count: 0,
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

    const payload = {
      ...formData,
      course_id: courseId,
      lesson_order: 0,
    };

    try {
      const res = await fetch('http://localhost:5000/api/custom-lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        throw new Error(data.message || 'Не удалось создать урок');
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
          <h2 className="text-2xl font-bold text-white">Создать урок</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-900/50 text-red-200 text-sm rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Название урока</label>
            <input
              type="text"
              name="lesson_title"
              value={formData.lesson_title}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
              placeholder="Введение в C#"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Описание</label>
            <textarea
              name="lesson_description"
              value={formData.lesson_description}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 resize-none"
              placeholder="Что будет в уроке"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Содержание урока</label>
            <textarea
              name="lesson_content"
              value={formData.lesson_content}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 resize-none font-mono text-sm"
              placeholder="Markdown или HTML контент..."
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Ориентировочное время (мин)</label>
            <input
              type="number"
              name="lesson_estimated_time"
              value={formData.lesson_estimated_time}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              placeholder="30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Дата создания</label>
            <input
              type="datetime-local"
              name="lesson_created_at"
              value={formData.lesson_created_at.slice(0, 16)}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            />
          </div>

          {/* Режим попыток */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Режим попыток</label>
            <select
              value={formData.attempt_mode}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            >
              <option value="unlimited">Без ограничений</option>
              <option value="limited">Ограниченные попытки</option>
            </select>
          </div>

          {formData.attempt_mode === 'limited' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Макс. попыток</label>
              <input
                type="number"
                min="1"
                value={formData.max_attempts}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Количество заданий в уроке <span className="text-gray-400 text-xs">(0 = все)</span>
            </label>
            <input
              type="number"
              min="0"
              value={formData.show_count}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">
              Если {'>'} 0 — показывается случайное подмножество заданий из всех
            </p>
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
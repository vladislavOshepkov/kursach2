import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function CustomLessonPage() {
  const { id } = useParams(); // lesson_id
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('userId');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        // Загружаем урок
        const resLesson = await fetch(`http://localhost:5000/api/custom-lessons/${id}`);
        if (!resLesson.ok) throw new Error('Урок не найден');
        const dataLesson = await resLesson.json();
        setLesson(dataLesson);

        // Загружаем данные курса
        const resCourse = await fetch(`http://localhost:5000/api/custom-courses/${dataLesson.course_id}`);
        if (!resCourse.ok) throw new Error('Курс не найден');
        const dataCourse = await resCourse.json();
        setCourse(dataCourse);
      } catch (err) {
        console.error(err);
        alert('❌ ' + err.message);
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [id, navigate]);

  const isAuthor = lesson && userId === course?.user_id?.toString();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Модальное окно редактирования урока
  const [editFormData, setEditFormData] = useState({
    lesson_title: '',
    lesson_description: '',
    lesson_content: '',
    lesson_estimated_time: '',
    attempt_mode: 'unlimited',
  max_attempts: 1,
  show_count: 0,
  });

  const [editError, setEditError] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const openEditModal = () => {
    setEditFormData({
      lesson_title: lesson.lesson_title,
      lesson_description: lesson.lesson_description || '',
      lesson_content: lesson.lesson_content || '',
      lesson_estimated_time: lesson.lesson_estimated_time || '',
      attempt_mode: lesson.attempt_mode || 'unlimited',
      max_attempts: lesson.max_attempts || 1,
      show_count: lesson.show_count || 0,
    });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsEditSubmitting(true);
    setEditError('');

    try {
      const res = await fetch(`http://localhost:5000/api/custom-lessons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...editFormData,
          course_id: lesson.course_id,
          lesson_order: lesson.lesson_order,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setLesson((prev) => ({
          ...prev,
          lesson_title: data.lesson_title,
          lesson_description: data.lesson_description,
          lesson_content: data.lesson_content,
          lesson_estimated_time: data.lesson_estimated_time,
          attempt_mode: editFormData.attempt_mode,
          max_attempts: editFormData.attempt_mode === 'limited' 
            ? parseInt(editFormData.max_attempts) 
          : null,
          show_count: parseInt(editFormData.show_count) || 0,
        }));
        setIsEditModalOpen(false);
        alert('✅ Урок успешно обновлён!');
      } else {
        throw new Error(data.message || 'Не удалось сохранить изменения');
      }
    } catch (err) {
      setEditError(err.message);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // --- Компонент модалки добавления задания ---
// --- Компонент модалки добавления задания ---
function CreateTaskModal({ lessonId, onClose, onSuccess }) {
  const [taskType, setTaskType] = useState('single');
  const [difficulty, setDifficulty] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [codeLang, setCodeLang] = useState('python');
  const [baseScore, setBaseScore] = useState(1); // по умолчанию

  const [options, setOptions] = useState([]);
  const [correctOptions, setCorrectOptions] = useState([]);
  const [codeAnswer, setCodeAnswer] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const languages = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'csharp', label: 'C#' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
  ];

  // Обновляем baseScore при смене типа задания
  useEffect(() => {
    if (taskType === 'code') {
      setBaseScore(2);
    } else {
      setBaseScore(1);
    }
  }, [taskType]);

  const handleAddOption = () => {
    const newId = Date.now();
    setOptions(prev => [...prev, { id: newId, text: '' }]);
  };

  const handleOptionChange = (id, value) => {
    setOptions(prev => prev.map(opt => opt.id === id ? { ...opt, text: value } : opt));
  };

  const handleRemoveOption = (id) => {
    setOptions(prev => prev.filter(opt => opt.id !== id));
  };

  const toggleCorrectOption = (id) => {
    setCorrectOptions(prev =>
      prev.includes(id)
        ? prev.filter(optId => optId !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Определяем правильные ответы в зависимости от типа
    let correctAnswersValue;
    if (taskType === 'single') {
      correctAnswersValue = correctOptions[0] !== undefined ? correctOptions[0].toString() : null;
    } else if (taskType === 'multiple') {
      correctAnswersValue = correctOptions.map(String);
    } else {
      correctAnswersValue = null;
    }

    try {
      const res = await fetch('http://localhost:5000/api/custom-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          lesson_id: lessonId,
          title,
          description,
          type: taskType,
          difficulty,
          base_score: baseScore,
          options: taskType === 'single' || taskType === 'multiple' ? options.map(o => o.text) : [],
          correct_answers: correctAnswersValue,
          answer: taskType === 'code' ? codeAnswer : null,
          language: taskType === 'code' ? codeLang : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        throw new Error(data.message || 'Не удалось создать задание');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-700 my-8">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Добавить задание</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-900/50 text-red-200 text-sm rounded-lg">{error}</div>
          )}

          {/* Название, тип и сложность */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Название</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Тип задания</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              >
                <option value="single">Выбор одного ответа</option>
                <option value="multiple">Множественный выбор</option>
                <option value="code">Задача на код</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Сложность (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={difficulty}
                onChange={(e) => setDifficulty(Math.min(5, Math.max(1, +e.target.value)))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              />
            </div>
          </div>

          {/* Базовый балл */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Базовый балл</label>
            <input
              type="number"
              min="1"
              value={baseScore}
              onChange={(e) => setBaseScore(Math.max(1, +e.target.value))}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              disabled={taskType !== 'single' && taskType !== 'multiple' && taskType !== 'code'}
            />
            <p className="text-xs text-gray-400 mt-1">
              {taskType === 'code' ? 'По умолчанию: 2' : 'По умолчанию: 1'}
            </p>
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Описание задания</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white resize-none"
            ></textarea>
          </div>

          {/* Варианты ответов (для single/multiple) */}
          {(taskType === 'single' || taskType === 'multiple') && (
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-300">
                  {taskType === 'single' ? 'Варианты ответа (выберите один правильный)' : 'Варианты ответа (выберите все правильные)' }
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded"
                >
                  + Добавить вариант
                </button>
              </div>

              {options.map((opt) => (
                <div key={opt.id} className="flex items-center space-x-3 mb-2">
                  <input
                    type={taskType === 'single' ? 'radio' : 'checkbox'}
                    name="correctOption"
                    checked={correctOptions.includes(opt.id)}
                    onChange={() => toggleCorrectOption(opt.id)}
                    className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                    placeholder="Текст варианта"
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(opt.id)}
                    className="text-red-400 hover:text-red-300 text-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Для code-задач */}
          {taskType === 'code' && (
            <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Правильный ответ</label>
                <textarea
                  value={codeAnswer}
                  onChange={(e) => setCodeAnswer(e.target.value)}
                  rows={5}
                  placeholder="Ожидаемый код..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Язык программирования</label>
                <select
                  value={codeLang}
                  onChange={(e) => setCodeLang(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                >
                  {languages.map(lang => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
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
  
  if (loading) return <div className="text-white p-6">Загрузка...</div>;
  if (!lesson || !course) return <div className="text-white p-6">Урок не найден</div>;

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
          <button
            onClick={() => navigate(`/custom-course/${course.course_id}`)}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded transition"
            title="К курсу"
          >
            <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 0 1 8 8v2" />
            </svg>
          </button>
        </div>

        {/* Основная часть */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Заголовок урока */}
          <header className="p-6 border-b border-gray-700 bg-gray-800">
            <h1 className="text-2xl font-bold">{lesson.lesson_title}</h1>
            <p className="text-gray-400 mt-1">
              Курс: {course.course_title} • Ориент. время: {lesson.lesson_estimated_time} мин
            </p>
            <p className="text-gray-300 mt-2 leading-relaxed">
              {lesson.lesson_description || 'Описание отсутствует.'}
            </p>
          </header>

          {/* Панель управления */}
          {isAuthor && (
            <div className="p-6 bg-gray-800 border-b border-gray-700 flex gap-4">
              <button
                onClick={openEditModal}
                className="px-5 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium shadow transition"
              >
                📝 Редактировать урок
              </button>
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium shadow transition"
              >
                ➕ Добавить задание
              </button>
            </div>
          )}

          {/* Контент урока */}
          <main className="flex-1 p-6 bg-gray-900 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Содержание</h2>
            <div className="prose max-w-none p-6 bg-gray-800 rounded-xl border border-gray-700 whitespace-pre-wrap">
              {lesson.lesson_content || 'Контент отсутствует.'}
            </div>
          </main>
        </div>
      </div>

      {/* Модальное окно редактирования урока */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-700 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white">Редактировать урок</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white text-2xl leading-none">
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              {editError && (
                <div className="p-3 bg-red-900/50 text-red-200 text-sm rounded-lg">{editError}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Название</label>
                <input
                  type="text"
                  name="lesson_title"
                  value={editFormData.lesson_title}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Описание</label>
                <textarea
                  name="lesson_description"
                  value={editFormData.lesson_description}
                  onChange={handleEditChange}
                  rows="2"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Содержание</label>
                <textarea
                  name="lesson_content"
                  value={editFormData.lesson_content}
                  onChange={handleEditChange}
                  rows="8"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white font-mono text-sm resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Время (мин)</label>
                <input
                  type="number"
                  name="lesson_estimated_time"
                  value={editFormData.lesson_estimated_time}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                />
              </div>

              <div>
  <label className="block text-sm font-medium text-gray-300 mb-1">Режим попыток</label>
  <select
    value={editFormData.attempt_mode}
    onChange={(e) => setEditFormData(prev => ({ ...prev, attempt_mode: e.target.value }))}
    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
  >
    <option value="unlimited">Без ограничений</option>
    <option value="limited">Ограниченные попытки</option>
  </select>
</div>

{editFormData.attempt_mode === 'limited' && (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-1">Макс. попыток</label>
    <input
      type="number"
      min="1"
      value={editFormData.max_attempts}
      onChange={(e) => setEditFormData(prev => ({ ...prev, max_attempts: e.target.value }))}
      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
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
    value={editFormData.show_count}
    onChange={(e) => setEditFormData(prev => ({ ...prev, show_count: e.target.value }))}
    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
  />
  <p className="text-xs text-gray-400 mt-1">
    Если {'>'} 0 — показывается случайное подмножество заданий из всех
  </p>
</div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg font-medium transition"
                >
                  {isEditSubmitting ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно добавления задания (заглушка) */}
      {isTaskModalOpen && (
        <CreateTaskModal
          lessonId={id}
          onClose={() => setIsTaskModalOpen(false)}
          onSuccess={() => alert('✅ Задание добавлено!')}
        />
    )}
    </>
  );
}
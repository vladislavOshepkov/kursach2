import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomTaskRenderer from '../components/CustomTaskRenderer';

export default function CustomLessonPage() {
  const { id } = useParams(); // lesson_id
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTasks, setShowTasks] = useState(false); // ← новое состояние
  const [tasks, setTasks] = useState([]); 
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [attempts, setAttempts] = useState({});
  const [results, setResults] = useState({});

  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const userId = localStorage.getItem('userId');
  const startTime = Date.now();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
  const fetchLesson = async () => {
    try {
      const resLesson = await fetch(`http://localhost:5000/api/custom-lessons/${id}`);
      if (!resLesson.ok) throw new Error('Урок не найден');
      const dataLesson = await resLesson.json();
      setLesson(dataLesson);

      // Загрузка курса
      const resCourse = await fetch(`http://localhost:5000/api/custom-courses/${dataLesson.course_id}`);
      if (!resCourse.ok) throw new Error('Курс не найден');
      const dataCourse = await resCourse.json();
      setCourse(dataCourse);

      // 🔹 Загрузка ВСЕХ заданий и фильтрация по show_count
      const resTasks = await fetch(`http://localhost:5000/api/custom-tasks?lesson_id=${dataLesson.lesson_id}`);
      if (resTasks.ok) {
        const allTasks = await resTasks.json();
        const showCount = dataLesson.show_count || 0;
        const selectedTasks = showCount > 0 && showCount < allTasks.length
          ? allTasks.sort(() => 0.5 - Math.random()).slice(0, showCount)
          : allTasks;
        setTasks(selectedTasks);

        // Инициализация состояний
        const initAnswers = {};
        const initAttempts = {};
        const initResults = {};
        selectedTasks.forEach((task, i) => {
          initAnswers[i] = task.type === 'multiple' ? [] : null;
          initAttempts[i] = 0;
          initResults[i] = null;
        });
        setUserAnswers(initAnswers);
        setAttempts(initAttempts);
        setResults(initResults);
      }

       if (userId && dataLesson.lesson_id) {
        await fetch('http://localhost:5000/api/custom-progress/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, lesson_id: dataLesson.lesson_id }),
        });
      }

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
  const allCompleted = tasks.length > 0 && tasks.every((_, i) => results[i] === 'correct');
const allFinished = tasks.length > 0 && tasks.every((_, i) => 
  results[i] === 'correct' || results[i] === 'failed'
);
const showFailureScreen = allFinished && !allCompleted;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleStartTasks = () => {

    const initAnswers = {};
  const initAttempts = {};
  const initResults = {};
  tasks.forEach((task, i) => {
    initAnswers[i] = task.type === 'multiple' ? [] : null;
    initAttempts[i] = 0;
    initResults[i] = null;
  });
  setUserAnswers(initAnswers);
  setAttempts(initAttempts);
  setResults(initResults);

  setCurrentTaskIndex(0);
  setShowTasks(true);
  setCode('');

  setShowTasks(true);
  setCode('');
};

const handleSubmit = async (taskIndex) => {
  const task = tasks[taskIndex];
  const userAttempts = attempts[taskIndex];

  if (userAttempts >= 3 || results[taskIndex] === 'correct') return;

  let isCorrect = false;

  if (task.type === 'single') {
    const selected = userAnswers[taskIndex];
    const correct = parseInt(task.correct_answers);
    isCorrect = selected === correct;
  } else if (task.type === 'multiple') {
    const selected = [...(userAnswers[taskIndex] || [])].sort();
    const correct = JSON.parse(task.correct_answers || '[]').sort();
    isCorrect = JSON.stringify(selected) === JSON.stringify(correct);
  }

  setAttempts(prev => ({ ...prev, [taskIndex]: prev[taskIndex] + 1 }));

  let newResult;
  if (isCorrect) {
    newResult = 'correct';
  } else if (userAttempts + 1 >= 3) {
    newResult = 'failed';
  } else {
    newResult = 'wrong';
  }

  setResults(prev => ({ ...prev, [taskIndex]: newResult }));
};

const handleCustomTaskSubmit = async (taskIndex) => {
  const task = tasks[taskIndex];
  const currentAttempts = attempts[taskIndex] || 0;

  // Блокируем повторную отправку, если попыток > 3 или результат уже «correct»
  if (currentAttempts >= 3 || results[taskIndex] === 'correct') return;

  let isCorrect = false;

  // 🔁 Универсальная проверка ответов
  if (task.type === 'single') {
    const selected = String(userAnswers[taskIndex]);

    let correctAnswersList;
    if (typeof task.correct_answers === 'string') {
      try {
        correctAnswersList = JSON.parse(task.correct_answers);
        if (!Array.isArray(correctAnswersList)) {
          correctAnswersList = [correctAnswersList];
        }
      } catch {
        correctAnswersList = [task.correct_answers];
      }
    } else if (Array.isArray(task.correct_answers)) {
      correctAnswersList = task.correct_answers;
    } else {
      correctAnswersList = [task.correct_answers];
    }

    const correct = String(correctAnswersList[0]);
    console.log('✅ [single] selected:', selected, '| correct:', correct);
    isCorrect = selected === correct;
  } else if (task.type === 'multiple') {
    const selected = [...(userAnswers[taskIndex] || [])]
      .map(String)
      .sort();
    
    let correctAnswersList;
    if (typeof task.correct_answers === 'string') {
      try {
        correctAnswersList = JSON.parse(task.correct_answers);
      } catch {
        correctAnswersList = [];
      }
    } else if (Array.isArray(task.correct_answers)) {
      correctAnswersList = task.correct_answers;
    } else {
      correctAnswersList = [];
    }

    const correct = correctAnswersList
      .map(String)
      .sort();

    console.log('✅ [multiple] selected:', selected, '| correct:', correct);
    isCorrect = JSON.stringify(selected) === JSON.stringify(correct);
  } else if (task.type === 'code') {
    const userCode = code.trim();
    const correctCode = (task.answer || '').trim();

    try {
      const res = await fetch('http://localhost:5000/api/custom-tasks/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: userCode,
          language: task.language || 'python',
          expected_output: correctCode,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        console.warn('❌ Ошибка компиляции:', data.error);
        setOutput(data.error || '');
      } else {
        setOutput(data.output || '');
      }

      isCorrect = data.isCorrect;
      console.log('✅ [code] isCorrect:', isCorrect);
    } catch (err) {
      console.error('❌ Ошибка сети при компиляции:', err);
      alert('❌ Ошибка соединения с сервером');
      return;
    }
  }

  // ✅ Сохраняем баллы только если верно
  if (isCorrect) {
    try {
      await fetch('http://localhost:5000/api/custom-progress/add-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          lesson_id: lesson.lesson_id,
          task_id: task.task_id,
          isCorrect: true,
        }),
      });
      console.log('✅ Баллы начислены');
    } catch (err) {
      console.warn('⚠️ Не удалось сохранить баллы:', err);
    }
  }

  // Обновляем попытки (даже если неверно)
  setAttempts(prev => ({ ...prev, [taskIndex]: currentAttempts + 1 }));

  // Определяем результат
  const newResult = isCorrect 
    ? 'correct'
    : currentAttempts + 1 >= 3 
      ? 'failed' 
      : 'wrong';

  setResults(prev => ({
    ...prev,
    [taskIndex]: newResult
  }));

  // 🚀 Дальнейшие действия
  if (isCorrect) {
    // Если это **последнее задание**, то завершаем урок
    if (taskIndex === tasks.length - 1) {
      await completeLesson();
      setCurrentTaskIndex(tasks.length); // ← это вызовет рендеринг else-блока { ... } : ( ✅ Все задания пройдены )
      return;
    }

    // Иначе переходим к следующему
    setCurrentTaskIndex(prev => prev + 1);
    setCode('');
  }
};

const nextTask = () => {
  if (currentTaskIndex < tasks.length - 1) {
    setCurrentTaskIndex(prev => prev + 1);
    setCode('');
  }
};

const completeLesson = async () => {
  if (!userId || !lesson?.lesson_id) return;

  try {
    const res = await fetch('http://localhost:5000/api/custom-progress/complete', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        lesson_id: lesson.lesson_id,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('❌ Ошибка завершения урока:', errorData.message);
      alert('❌ Не удалось сохранить завершение урока');
    } 
  } catch (err) {
    console.error('Ошибка сети:', err);
    alert('❌ Ошибка соединения с сервером');
  }
};

const restartLesson = () => {
  // Сбросить всё как при первом старте
  const initAnswers = {};
  const initAttempts = {};
  const initResults = {};

  tasks.forEach((task, i) => {
    initAnswers[i] = task.type === 'multiple' ? [] : null;
    initAttempts[i] = 0;
    initResults[i] = null;
  });

  setUserAnswers(initAnswers);
  setAttempts(initAttempts);
  setResults(initResults);
  setCurrentTaskIndex(0);
  setCode('');
  setOutput('');
  setIsRunning(false);
  setShowTasks(false);
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
  // Найти индекс выбранного варианта
  const correctIndex = options.findIndex(opt => opt.id === correctOptions[0]);
  correctAnswersValue = correctIndex !== -1 ? correctIndex.toString() : null;
} else if (taskType === 'multiple') {
  // Для множественного выбора — массив индексов
  correctAnswersValue = correctOptions
    .map(id => options.findIndex(opt => opt.id === id))
    .filter(idx => idx !== -1)
    .map(String);
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
  {!showTasks ? (
    // 🔸 ТЕКСТ УРОКА
    <div className="max-w-4xl mx-auto px-6">
      <div
        className="prose prose-lg prose-invert max-w-none"
        dangerouslySetInnerHTML={{
          __html: lesson.lesson_content || '<p>Контент отсутствует.</p>'
        }}
      />
      <div className="mt-8 text-center">
        <button
          onClick={handleStartTasks}
          disabled={tasks.length === 0}
          className={`px-6 py-4 rounded-xl font-bold shadow-lg transition
            ${tasks.length === 0
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-105'
            }`}
        >
          🚀 Начать задания
        </button>
        {tasks.length === 0 && (
          <p className="mt-2 text-gray-400 text-sm">Нет заданий для прохождения</p>
        )}
      </div>
    </div>
  ) : (
    // 🔹 РЕНДЕР ОДНОГО ЗАДАНИЯ
    <div className="max-w-4xl mx-auto px-6">
      {currentTaskIndex < tasks.length ? (
        <>
          <h2 className="text-2xl font-bold text-center mb-6">
            Задание {currentTaskIndex + 1} из {tasks.length}
          </h2>

          <CustomTaskRenderer
            key={currentTaskIndex}
            task={tasks[currentTaskIndex]}
            index={currentTaskIndex}
            totalTasks={tasks.length}
            setShowTasks={setShowTasks}
            userAnswers={userAnswers}
            setUserAnswers={setUserAnswers}
            attempts={attempts}
            setAttempts={setAttempts}
            results={results}
            setResults={setResults}
            userCode={code}
            setUserCode={setCode}
            output={output}
            setOutput={setOutput}
            isRunning={isRunning}
            setIsRunning={setIsRunning}
            handleStartTasks={handleStartTasks}
            nextTask={nextTask}
            handleSubmit={handleCustomTaskSubmit}
            restartLesson={restartLesson}
            goToLessons={() => navigate(-1)}
          />
        </>
      ) : (
        // ✅ Все задания пройдены
        <div className="flex gap-6 mt-6">
  <button
    onClick={async () => {
      restartLesson();
    }}
    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
  >
    Пройти заново
  </button>
  <button
    onClick={async () => {
      goToLessons();
    }}
    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
  >
    Вернуться к урокам
  </button>
</div>
      )}
    </div>
  )}
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
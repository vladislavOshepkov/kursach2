import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { compileCode } from '../api/compiler.js';

export default function LessonDetailPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTasks, setShowTasks] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  // Для редактора кода
  const [code, setCode] = useState('');
  const [attempts, setAttempts] = useState({});
  const [results, setResults] = useState({});
  const [output, setOutput] = useState(''); // Вывод программы
  const [isRunning, setIsRunning] = useState(false); // Состояние выполнения

  const startTime = Date.now();

  // --- Загрузка урока и заданий ---
  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/lesson/${lessonId}`);
        if (!res.ok) throw new Error('Урок не найден');
        const data = await res.json();
        setLesson(data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchTasks = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/tasks/lesson/${lessonId}`);
        if (!res.ok) throw new Error('Задания не загружены');
        const data = await res.json();
        setTasks(data);

        const initAttempts = {};
        const initResults = {};

        data.forEach((task, i) => {
          initAttempts[i] = 0;
          initResults[i] = null;
        });

        setAttempts(initAttempts);
        setResults(initResults);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
    fetchTasks();
  }, [lessonId]);

  // --- Сохранение прогресса при успешном прохождении ---
useEffect(() => {
  if (!lessonId || tasks.length === 0) return;

  const allCompleted = tasks.every((_, i) => results[i] === 'correct');

  if (allCompleted) {
    const userId = localStorage.getItem('userId');

    console.log('🔍 userId:', userId);

    if (!userId) {
      console.warn('❌ Пользователь не авторизован. Перенаправление на вход...');
      navigate('/login');
      return;
    }

    const totalTimeSpent = Math.round((Date.now() - startTime) / 1000);

    const saveProgress = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            lesson_id: lessonId,
            userprogress_is_completed: true,
            userprogress_completed_at: new Date().toISOString(),
            userprogress_time_spent: totalTimeSpent,
          }),
        });

        if (!res.ok) throw new Error(`Ошибка ${res.status}: ${res.statusText}`);

        const data = await res.json();
        console.log('✅ Прогресс сохранён:', data);
      } catch (err) {
        console.error('❌ Ошибка:', err.message);
      }
    };

    saveProgress();
  }
}, [results, tasks, lessonId, startTime, navigate]);

  // --- Обработчики ---
  const handleStartTasks = () => {
    setShowTasks(true);
    setCode('');
  };

  const handleSubmit = async (taskIndex) => {
    const task = tasks[taskIndex];
    const userAttempts = attempts[taskIndex];

    if (userAttempts >= 3 || results[taskIndex] === 'correct') return;

    try {
      const res = await fetch('http://localhost:5000/api/tasks/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.task_id,
          user_code: code.trim(),
        }),
      });

      const data = await res.json();

      setAttempts(prev => ({ ...prev, [taskIndex]: prev[taskIndex] + 1 }));

      let newResult;
      if (data.isCorrect) {
        newResult = 'correct';
      } else if (userAttempts + 1 >= 3) {
        newResult = 'failed';
      } else {
        newResult = 'wrong';
      }

      setResults(prev => ({ ...prev, [taskIndex]: newResult }));
    } catch (err) {
      console.error('Ошибка проверки:', err);
    }
  };

  const nextTask = () => {
    if (currentTaskIndex < tasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1);
      setCode('');
    }
  };

  const restartLesson = () => {
    setCurrentTaskIndex(0);
    setCode('');
    setAttempts({});
    setResults({});
    const initAttempts = {};
    const initResults = {};

    tasks.forEach((task, i) => {
      initAttempts[i] = 0;
      initResults[i] = null;
    });

    setAttempts(initAttempts);
    setResults(initResults);
    setShowTasks(false);
  };

  const goToLessons = () => {
    navigate(-1);
  };

  const handleRun = async () => {
  if (!code.trim() || isRunning || result === 'correct' || userAttempts >= 3) return;

  setIsRunning(true);
  setOutput('');
  setResults(prev => ({ ...prev, [currentTaskIndex]: null }));

  try {
    const taskLanguage = currentTask?.task_language;
    const taskId = currentTask?.task_id;

    if (!taskLanguage) {
      setOutput('❌ Ошибка: язык задания не указан');
      return;
    }

    // Выполняем код
    const compileResult = await compileCode(code, taskLanguage);

    let outputText = '';
    if (compileResult.error) {
      outputText = `ОШИБКА: ${compileResult.error}`;
    } else if (compileResult.stderr) {
      outputText = `STDERR: ${compileResult.stderr}`;
    } else {
      outputText = compileResult.stdout || '(пустой вывод)';
    }

    setOutput(outputText);

    // Отправляем на /check
    const checkResponse = await fetch('http://localhost:5000/api/tasks/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: taskId,
        user_code: code.trim(),
      }),
    });

    const checkData = await checkResponse.json();

    // Обновляем попытки
    setAttempts(prev => ({ ...prev, [currentTaskIndex]: prev[currentTaskIndex] + 1 }));

    let newResult;
    if (checkData.isCorrect) {
      newResult = 'correct';
    } else if (userAttempts + 1 >= 3) {
      newResult = 'failed';
    } else {
      newResult = 'wrong';
    }

    setResults(prev => ({ ...prev, [currentTaskIndex]: newResult }));

  } catch (err) {
    console.error('💥 Ошибка:', err);
    setOutput('Ошибка сети');
    setResults(prev => ({ ...prev, [currentTaskIndex]: 'wrong' }));
  } finally {
    setIsRunning(false);
  }
}; // ← Только одна закрывающая скобка и точка с запятой
  if (loading) return <div className="text-white">Загрузка...</div>;
  if (!lesson) return <div className="text-red-400">Урок не найден</div>;

  const currentTask = tasks[currentTaskIndex];
  const userAttempts = attempts[currentTaskIndex] || 0;
  const result = results[currentTaskIndex];

  // Проверяем, завершены ли все задания
  const allFinished = tasks.length > 0 && tasks.every((_, i) => 
    results[i] === 'correct' || results[i] === 'failed'
  );

  const allCompleted = allFinished && tasks.every((_, i) => results[i] === 'correct');
  const showFailureScreen = allFinished && !allCompleted;

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Боковая панель */}
      <div className="w-20 bg-gray-800 flex flex-col items-center py-6 space-y-8 relative">
        <button
          onClick={goToLessons}
          className="bg-gray-700 hover:bg-gray-700 transition"
          title="К урокам"
        >
          <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Основная часть */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="p-6 border-b border-gray-700 bg-gray-800">
          <h1 className="text-2xl font-bold">{lesson.lesson_title}</h1>
          <p className="text-gray-400">{lesson.lesson_description}</p>
        </header>

        <main className="flex-1 p-6 bg-gray-900 overflow-y-auto">
          {!showTasks ? (
            
             // Лекция из БД
  <div className="prose prose-invert max-w-4xl mx-auto">
    {lesson?.lesson_content ? (
      <div
        className="prose prose-lg prose-invert max-w-4xl mx-auto"
        dangerouslySetInnerHTML={{ __html: lesson.lesson_content }}
      />
    ) : (
      <p>Контент урока не найден.</p>
    )}
              <button
                onClick={handleStartTasks}
                className="mt-8 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold shadow-lg transform hover:scale-105 transition"
              >
                🚀 Начать задания
              </button>
            </div>
          ) : allCompleted ? (
            //  Успех
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
              <div className="text-8xl">🏆</div>
              <h2 className="text-4xl font-bold text-green-400">Урок завершён!</h2>
              <p className="text-gray-300 text-lg">Поздравляем, вы успешно прошли все задания.</p>
              <div className="flex gap-6 mt-6">
                <button
                  onClick={restartLesson}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
                >
                  Пройти заново
                </button>
                <button
                  onClick={goToLessons}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
                >
                  Вернуться к урокам
                </button>
              </div>
            </div>
          ) : showFailureScreen ? (
            //  Поражение
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
              <div className="text-8xl">😥</div>
              <h2 className="text-4xl font-bold text-red-400">Урок не пройден</h2>
              <p className="text-gray-300 text-lg">Не расстраивайтесь — попробуйте снова!</p>
              <div className="flex gap-6 mt-6">
                <button
                  onClick={restartLesson}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
                >
                  Пройти заново
                </button>
                <button
                  onClick={goToLessons}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition"
                >
                  Вернуться к урокам
                </button>
              </div>
            </div>
          ) : (
            // Текущее задание
            <div className="space-y-6">
              <h2 className="text-xl font-bold">
                Задание {currentTaskIndex + 1} из {tasks.length}
              </h2>

              {currentTask && (
                <div className="bg-gray-800 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-purple-300">
                    {currentTask.task_title}
                  </h3>
                  <p className="text-gray-300 mt-2 mb-4">
                    {currentTask.task_description}
                  </p>

                 {/* Редактор кода */}
<textarea
  value={code}
  onChange={(e) => setCode(e.target.value)}
  placeholder="// Напишите код на C# здесь"
  className="w-full h-40 bg-gray-700 text-white p-4 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
/>

{/* Кнопка "Выполнить" */}
<button
  onClick={handleRun}
  disabled={isRunning || result === 'correct' || userAttempts >= 3}
  className={`mt-4 px-5 py-2 rounded font-medium transition
    ${isRunning
      ? 'bg-gray-600 cursor-not-allowed'
      : 'bg-blue-600 hover:bg-blue-700'
    } text-white`}
>
  {isRunning ? 'Выполняется...' : '▶ Выполнить'}
</button>

{/* Вывод */}
{output && (
  <div className="mt-4 p-4 bg-gray-700 rounded-lg text-sm font-mono whitespace-pre-wrap">
    <strong>Вывод:</strong>
    <pre className="text-green-300 mt-1">{output}</pre>
  </div>
)}

{/* Результат */}
{/* Результат */}
{result === 'correct' && (
  <div className="mt-4 space-y-3">
    <p className="text-green-400">✅ Правильно! Молодец!</p>
    {currentTaskIndex < tasks.length - 1 ? (
      <button
        onClick={nextTask}
        className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition transform hover:scale-105"
      >
        🚀 Следующее задание
      </button>
    ) : (
      <p className="text-blue-400">🎉 Поздравляем! Вы выполнили все задания.</p>
    )}
  </div>
)}

{result === 'wrong' && (
  <p className="text-yellow-400 mt-2">
    ❌ Неверно. Осталось попыток: {3 - userAttempts}
  </p>
)}

{result === 'failed' && (
  <p className="text-red-400 mt-2">
    ❌ Все попытки исчерпаны.
  </p>
)}
{result === 'wrong' && (
  <p className="text-yellow-400 mt-2">
    ❌ Неверно. Осталось попыток: {3 - userAttempts}
  </p>
)}
{result === 'failed' && (
  <p className="text-red-400 mt-2">
    ❌ Все попытки исчерпаны.
  </p>
)}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
  
}

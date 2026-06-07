// client/src/components/CustomTaskRenderer.jsx
import { useState, useEffect } from 'react';

export default function CustomTaskRenderer({
  task,
  index,
  totalTasks,
  setShowTasks,
  isAuthor,

  // ← новые пропсы из CustomLessonPage
  userAnswers,
  setUserAnswers,
  attempts,
  setAttempts,
  results,
  setResults,
  userCode,
  setUserCode,
  output,
  setOutput,
  isRunning,
  setIsRunning,
  handleSubmit: onCustomSubmit, // ← передаём handleCustomTaskSubmit
  nextTask,
  restartLesson,
  goToLessons,
}) {
  const [localUserAnswer, setLocalUserAnswer] = useState(null);
  const [localCode, setLocalCode] = useState(userCode || '');

  // Синхронизация с родителя
  useEffect(() => {
    setLocalCode(userCode || '');
  }, [userCode]);

  const isSingle = task.type === 'single';
  const isMultiple = task.type === 'multiple';

  const handleSelect = (optIndex) => {
    if (isSingle) {
      setLocalUserAnswer(optIndex);
      setUserAnswers(prev => ({ ...prev, [index]: optIndex }));
    } else if (isMultiple) {
      const current = Array.isArray(localUserAnswer) ? [...localUserAnswer] : [];
      const updated = current.includes(optIndex)
        ? current.filter(i => i !== optIndex)
        : [...current, optIndex];
      setLocalUserAnswer(updated);
      setUserAnswers(prev => ({ ...prev, [index]: updated }));
    }
  };

  const handleSubmitClick = () => {
    console.log('🔥 Вызов onCustomSubmit для задачи', index);
    if (typeof onCustomSubmit === 'function') {
      onCustomSubmit(index);
    } else {
      console.error('❌ onCustomSubmit не передан!');
    }
  };

  const options = Array.isArray(task.options)
    ? task.options
    : task.options ? JSON.parse(task.options) : [];

  // Рендер для кода
  if (task.type === 'code') {
    return (
      <div className="bg-gray-800 p-6 rounded-xl space-y-6">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold text-purple-300">{task.title}</h3>
          <span className="text-sm text-gray-500">
            Сложность: {task.difficulty}/5 • Балл: {task.base_score}
          </span>
        </div>
        <p className="text-gray-300">{task.description}</p>

        <textarea
          value={localCode}
          onChange={(e) => {
            setLocalCode(e.target.value);
            setUserCode(e.target.value);
          }}
          className="w-full h-40 bg-gray-700 text-white p-4 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-purple-500"
          placeholder={`// Напишите код на ${task.language || 'языке'}`}
        />

        <button
          onClick={() => {
            console.log('🔥 Запуск checkCode...');
            if (typeof onCustomSubmit === 'function') {
              onCustomSubmit(index);
            }
          }}
          disabled={isRunning || results[index] === 'correct' || (attempts[index] || 0) >= 3}
          className={`px-5 py-2 rounded font-medium transition
            ${isRunning ? 'bg-gray-600' : results[index] === 'correct' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}
            text-white`}
        >
          {isRunning ? 'Проверка...' : results[index] === 'correct' ? '✅ Проверено' : '▶ Проверить код'}
        </button>

        {output && (
          <div className="p-4 bg-gray-700 rounded-lg text-sm font-mono whitespace-pre-wrap text-green-300">
            {output}
          </div>
        )}

        {results[index] === 'correct' && (
          <div className="mt-4 space-y-3">
            <p className="text-green-400">✅ Правильно! Молодец!</p>
            {index < totalTasks - 1 ? (
              <button
                onClick={nextTask}
                className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition"
              >
                🚀 Следующее задание
              </button>
            ) : (
              <button
                onClick={restartLesson}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                🔄 Повторить урок
              </button>
            )}
          </div>
        )}

        {results[index] === 'wrong' && (
          <p className="text-yellow-400">❌ Неверно. Попробуйте снова.</p>
        )}

        {results[index] === 'failed' && (
          <p className="text-red-400">❌ Исчерпано количество попыток.</p>
        )}

        {isAuthor && (
          <div className="mt-4 border-t border-gray-700 pt-4 text-sm text-gray-400">
            <p>ID: {task.task_id}</p>
            <p>Правильный код: {task.answer || '—'}</p>
          </div>
        )}
      </div>
    );
  }

  // Рендер для single/multiple
  return (
    <div className="bg-gray-800 p-6 rounded-xl space-y-6">
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-semibold text-purple-300">{task.title}</h3>
        <span className="text-sm text-gray-500">
          Сложность: {task.difficulty}/5 • Балл: {task.base_score}
        </span>
      </div>
      <p className="text-gray-300">{task.description}</p>

      {isSingle && (
        <div className="space-y-3">
          {options.map((opt, idx) => (
            <label
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition
                ${userAnswers[index] === idx
                  ? 'border-purple-500 bg-gray-700'
                  : 'border-gray-700 hover:border-gray-600'
                }`}
            >
              <input
                type="radio"
                name={`task-${task.task_id}`}
                className="mr-3"
                checked={userAnswers[index] === idx}
                onChange={() => handleSelect(idx)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )}

      {isMultiple && (
        <div className="space-y-3">
          {options.map((opt, idx) => (
            <label
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition
                ${Array.isArray(userAnswers[index]) && userAnswers[index].includes(idx)
                  ? 'border-purple-500 bg-gray-700'
                  : 'border-gray-700 hover:border-gray-600'
                }`}
            >
              <input
                type="checkbox"
                className="mr-3"
                checked={Array.isArray(userAnswers[index]) && userAnswers[index].includes(idx)}
                onChange={() => {}}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )}

      {/* Кнопка "Проверить" */}
      {results[index] !== 'correct' && (attempts[index] || 0) < 3 && (
        <button
          onClick={handleSubmitClick}
          className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition"
        >
          Проверить
        </button>
      )}

      {/* Результат */}
      {results[index] === 'correct' && (
        <div className="mt-4 space-y-3">
          <p className="text-green-400">✅ Правильно! Молодец!</p>
          {index < totalTasks - 1 ? (
            <button
              onClick={nextTask}
              className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition"
            >
              🚀 Следующее задание
            </button>
          ) : (
            <p className="text-blue-400">🎉 Поздравляем! Вы выполнили все задания.</p>
          )}
        </div>
      )}

      {results[index] === 'wrong' && (
        <p className="text-yellow-400">❌ Неверно. Попробуйте снова.</p>
      )}

      {results[index] === 'failed' && (
        <p className="text-red-400">❌ Исчерпано количество попыток.</p>
      )}

      {isAuthor && (
        <div className="mt-4 border-t border-gray-700 pt-4 text-sm text-gray-400">
          <p>ID: {task.task_id}</p>
          <p>Тип: {task.type.toUpperCase()}</p>
          {task.type === 'single' && <p>Правильный ответ: {task.correct_answers}</p>}
          {task.type === 'multiple' && <p>Правильные: {JSON.parse(task.correct_answers || '[]')}</p>}
        </div>
      )}
    </div>
  );
}
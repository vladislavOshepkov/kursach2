import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function CustomCoursePage() {
  const { id } = useParams();
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  // 🔐 Состояния записи
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinPassword, setJoinPassword] = useState('');
  const [joinedUsers, setJoinedUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);

  // Редактирование
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);

  const [tab, setTab] = useState('overview'); // 'overview' | 'users'
  const [selectedUserStats, setSelectedUserStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const resCourse = await fetch(`http://localhost:5000/api/custom-courses/${id}`);
        if (!resCourse.ok) throw new Error('Курс не найден');
        const dataCourse = await resCourse.json();
        setCourse(dataCourse);
        console.log('📝 Токен:', token);

        const resLessons = await fetch(`http://localhost:5000/api/custom-courses/${id}/lessons`);
        if (!resLessons.ok) throw new Error('Не удалось загрузить уроки');
        const dataLessons = await resLessons.json();
        setLessons(dataLessons);

        // 🔐 Проверка: записан ли пользователь?
        if (userId) {
          const resJoined = await fetch(`http://localhost:5000/api/custom-courses/${id}/join`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resJoined.ok) {
            setIsJoined(true);
          }
        }
      } catch (err) {
        console.error(err);
        alert('❌ ' + err.message);
        navigate('/custom-courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, navigate, userId, token]);

  useEffect(() => {
  const loadProgress = async () => {
    if (!userId || !lessonId) return;

    try {
      // 1. Пытаемся получить существующий прогресс
      const res = await fetch(
        `http://localhost:5000/api/custom-progress/${userId}/${lessonId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        const existing = await res.json();
        setProgress(existing);
        setCurrentTaskIndex(existing.last_task_index);
        setScore(existing.score);
        // Если урок уже завершён – возможно, показать результат
        if (existing.completed) {
          // перенаправить или показать финальный экран
        }
      } else if (res.status === 404) {
        // 2. Прогресса нет – создаём новый через /start
        const startRes = await fetch('http://localhost:5000/api/custom-progress/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ user_id: userId, lesson_id: lessonId })
        });
        if (startRes.ok) {
          const newProgress = await startRes.json();
          setProgress(newProgress);
          setCurrentTaskIndex(0);
          setScore(0);
        }
      } else {
        throw new Error('Не удалось загрузить прогресс');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка загрузки прогресса');
    } finally {
      setLoading(false);
    }
  };

  loadProgress();
}, [lessonId, userId, token]);

  // 🔁 Обновление статуса при изменении курса
  useEffect(() => {
    if (course?.course_id && userId) {
      fetchJoinedStatus();
      if (course.user_id === parseInt(userId)) {
        fetchJoinedUsers(course.course_id);
      }
    }
  }, [course, userId]);

  const fetchJoinedStatus = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/custom-courses/${course.course_id}/join`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setIsJoined(true);
      }
    } catch (err) {
      setIsJoined(false);
    }
  };

  const fetchJoinedUsers = async (courseId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/custom-courses/${courseId}/joined-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setJoinedUsers(await res.json());
      }
    } catch (err) {
      console.error('Ошибка получения списка участников:', err);
    }
  };

  const handleJoinCourse = async () => {
    if (!userId) {
      alert('❌ Сначала авторизуйтесь');
      navigate('/login');
      return;
    }

    if (course.is_private) {
      setShowJoinModal(true);
      return;
    }

    setIsJoining(true);
    try {
      const res = await fetch(`http://localhost:5000/api/custom-courses/${course.course_id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setIsJoined(true);
        alert('✅ Вы успешно записаны на курс!');
        fetchJoinedUsers(course.course_id);
      } else {
        const data = await res.json();
        alert('❌ ' + (data.message || 'Ошибка записи'));
      }
    } catch (err) {
      console.error(err);
      alert('❌ Ошибка сети');
    } finally {
      setIsJoining(false);
    }
  };

  const handleConfirmJoin = async () => {
    setIsJoining(true);
    try {
      const res = await fetch(`http://localhost:5000/api/custom-courses/${course.course_id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: joinPassword }),
      });

      if (res.ok) {
        setIsJoined(true);
        setShowJoinModal(false);
        setJoinPassword('');
        alert('✅ Вы успешно записаны на курс!');
      } else {
        const data = await res.json();
        alert('❌ ' + (data.message || 'Ошибка записи'));
      }
    } catch (err) {
      console.error(err);
      alert('❌ Ошибка сети');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveCourse = async () => {
    if (!userId) return;
    if (!confirm('❌ Вы уверены, что хотите покинуть курс?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/custom-courses/${course.course_id}/join`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setIsJoined(false);
        alert('✅ Вы покинули курс');
      }
    } catch (err) {
      console.error(err);
      alert('❌ Ошибка сети');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isAuthor = course && userId === course.user_id?.toString();

  const openEditModal = () => {
    setFormData({
      course_title: course.course_title,
      course_description: course.course_description || '',
      course_icon_url: course.course_icon_url || '/icons/course-default.jpg',
      course_tags: Array.isArray(course.course_tags)
        ? course.course_tags.join(', ')
        : (course.course_tags || ''),
      is_private: course.is_private || false,
      password: '',
    });
    setIsEditModalOpen(true);
  };

  const [formData, setFormData] = useState({
    course_title: '',
    course_description: '',
    course_icon_url: '/icons/course-default.jpg',
    course_tags: '',
    is_private: false,
    password: '',
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
    tags.forEach(tag => formDataToSend.append('course_tags', tag));

    if (formData.is_private) {
      formDataToSend.append('is_private', 'true');
      if (!formData.password) {
        setError('❌ Пароль обязателен для закрытого курса');
        setIsSubmitting(false);
        return;
      }
      formDataToSend.append('password', formData.password);
    } else {
      formDataToSend.append('is_private', 'false');
    }

    if (fileToUpload) {
      formDataToSend.append('course_icon', fileToUpload);
    }

    try {
      const res = await fetch(`http://localhost:5000/api/custom-courses/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await res.json();

      if (res.ok) {
        setCourse(prev => ({
          ...prev,
          course_title: data.course_title,
          course_description: data.course_description,
          course_icon_url: data.course_icon_url,
          course_tags: data.course_tags,
          is_private: data.is_private,
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
      setLessons(await res.json());
    } catch (err) {
      console.error('Ошибка загрузки уроков:', err);
    }
  };

  const closeModal = () => setIsEditModalOpen(false);

   const fetchUserStats = async (userId) => {
    setLoadingStats(true);
    try {
      const res = await fetch(`http://localhost:5000/api/custom-courses/${id}/users/${userId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const stats = await res.json();
        setSelectedUserStats(prev => ({
          ...prev,
          [userId]: stats
        }));
      } else {
        setSelectedUserStats(prev => ({
          ...prev,
          [userId]: []
        }));
      }
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err);
      setSelectedUserStats(prev => ({
        ...prev,
        [userId]: []
      }));
    } finally {
      setLoadingStats(false);
    }
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
          {/* Заголовок */}
          <header className="p-6 border-b border-gray-700 bg-gray-800">
            <h1 className="text-2xl font-bold">{course.course_title}</h1>
            <p className="text-gray-400 mt-1">
              Автор: {course.author_name} • Создан: {formatDate(course.course_created_at)}
            </p>
            <p className="text-gray-300 mt-2 leading-relaxed">
              {course.course_description || 'Описание отсутствует.'}
            </p>

            {/* 🔐 Метка типа курса и кнопка записи */}
            <div className="mt-3 flex items-center space-x-2">
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                course.is_private ? 'bg-purple-600' : 'bg-green-600'
              }`}>
                {course.is_private ? '🔒 Закрытый' : '🔓 Открытый'}
              </span>

              {isJoined ? (
                <button
                  onClick={handleLeaveCourse}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition"
                >
                  🚪 Покинуть курс
                </button>
              ) : (
                <button
                  onClick={handleJoinCourse}
                  disabled={isJoining}
                  className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition disabled:opacity-50"
                >
                  {isJoining ? 'Запись...' : '📝 Записаться'}
                </button>
              )}
            </div>
          </header>

          {/* Панель управления */}
          {isAuthor && (
            <div className="p-6 bg-gray-800 border-b border-gray-700 flex flex-col gap-4">
              <div className="flex gap-4">
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

              <div className="flex gap-4">
                <button
                  onClick={() => setTab('overview')}
                  className={`px-5 py-2 rounded-lg font-medium transition ${tab === 'overview' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  📋 Обзор
                </button>
                <button
                  onClick={() => setTab('users')}
                  className={`px-5 py-2 rounded-lg font-medium transition ${tab === 'users' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  👥 Участники
                </button>
              </div>
            </div>
          )}

          {/* 🔹 Модальное окно создания урока */}
          {isLessonModalOpen && (
            <CreateLessonModal
              courseId={course.course_id}
              onClose={() => setIsLessonModalOpen(false)}
              onSuccess={() => fetchLessons(course.course_id)}
            />
          )}

          {/* 🔹 КОНТЕНТ КУРСА — только для записанных */}
          <main className="flex-1 p-6 bg-gray-900 overflow-y-auto">
            {!isJoined ? (
              // ❗ ПОКАЗЫВАЕМ ПРЕДЛОЖЕНИЕ ЗАПИСАТЬСЯ
              <div className="flex flex-col items-center justify-center h-96">
                <h2 className="text-2xl font-bold text-gray-300 mb-4">
                  🚫 Содержимое курса недоступно
                </h2>
                <p className="text-gray-400 mb-6 max-w-lg text-center">
                  {course.is_private
                    ? 'Это закрытый курс. Для доступа необходима запись и пароль.'
                    : 'Этот курс доступен только после записи.'}
                </p>
                <button
                  onClick={handleJoinCourse}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium shadow transition"
                >
                  📝 Записаться на курс
                </button>
              </div>
            ) : (
              // ✅ ПОКАЗЫВАЕМ СОДЕРЖИМОЕ
              <>
                {tab === 'overview' ? (
                  // 📋 Вкладка: Обзор — УРОКИ
                  <>
                    <h2 className="text-xl font-semibold mb-6">Уроки курса</h2>

                    {lessons.length === 0 ? (
                      <p className="text-gray-500">
                        В этом курсе пока нет уроков. Нажмите «Добавить урок», чтобы начать.
                      </p>
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
                                {lesson.lesson_order || index + 1}
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
                  </>
                ) : (
                  // 👥 Вкладка: Участники
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">Участники курса</h2>
                    
                    {joinedUsers.length === 0 ? (
                      <p className="text-gray-500">Никто ещё не записался на курс.</p>
                    ) : (
                      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                        {joinedUsers.map(user => (
                          <div
                            key={user.user_id}
                            className={`flex items-center justify-between p-4 border-b border-gray-700 hover:bg-gray-700 transition cursor-pointer ${
                              selectedUserStats[user.user_id] ? 'bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                            }`}
                            onClick={() => {
                              if (selectedUserStats[user.user_id]) {
                                setSelectedUserStats(prev => {
                                  const next = { ...prev };
                                  delete next[user.user_id];
                                  return next;
                                });
                              } else {
                                setSelectedUserStats(prev => ({ ...prev, [user.user_id]: 'loading' }));
                                fetchUserStats(user.user_id);
                              }
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-medium">
                                {user.username[0].toUpperCase()}
                              </div>
                              <div>
                                 <div className="text-sm text-gray-300">
    {[
      user.user_surname,
      user.user_name,
      user.user_patronym && user.user_patronym.trim() ? user.user_patronym : null
    ]
      .filter(Boolean)
      .join(' ')}
  </div>
                                <div className="font-semibold text-white">{user.username}</div>
                                <div className="text-sm text-gray-400">{user.email}</div>
                                <div className="text-xs text-gray-500">
                                  Записан: {new Date(user.joined_at).toLocaleDateString('ru-RU')}
                                </div>
                              </div>
                            </div>
                            
                            {selectedUserStats[user.user_id] === 'loading' ? (
                              <span className="text-xs text-blue-400 animate-pulse">Загрузка...</span>
                            ) : selectedUserStats[user.user_id] ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUserStats(prev => {
                                    const next = { ...prev };
                                    delete next[user.user_id];
                                    return next;
                                  });
                                }}
                                className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-600"
                              >
                                Скрыть
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUserStats(prev => ({ ...prev, [user.user_id]: 'loading' }));
                                  fetchUserStats(user.user_id);
                                }}
                                className="text-xs text-blue-400 hover:text-white px-2 py-1 rounded hover:bg-gray-600"
                              >
                                Подробнее
                              </button>
                            )}
                          </div>
                        ))}

                        {/* 🔍 Детализация статистики участника */}
                        {Object.entries(selectedUserStats)
                          .filter(([uid, stats]) => stats && stats !== 'loading')
                          .map(([uid, stats]) => (
                            <div key={uid} className="bg-gray-800 border-t border-gray-700 p-4 animate-fade-in">
                              <div className="flex justify-between items-center mb-3">
                                <h3 className="text-sm font-semibold text-blue-300">Статистика участника</h3>
                                <button
                                  onClick={() => {
                                    setSelectedUserStats(prev => {
                                      const next = { ...prev };
                                      delete next[uid];
                                      return next;
                                    });
                                  }}
                                  className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-600"
                                >
                                  Скрыть
                                </button>
                              </div>
                              
                              {Array.isArray(stats) && stats.length === 0 ? (
                                <p className="text-xs text-gray-500">Пока нет пройденных уроков</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm text-left text-gray-300 border-collapse">
                                    <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                                      <tr>
                                        <th className="px-3 py-2">Урок</th>
                                        <th className="px-3 py-2">Статус</th>
                                        <th className="px-3 py-2 text-center">Очки</th>
                                        <th className="px-3 py-2 text-center">Начало</th>
                                        <th className="px-3 py-2 text-center">Конец</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                      {stats.map((lessonStat, idx) => (
                                        <tr key={idx} className="hover:bg-gray-700/50">
                                          <td className="px-3 py-2">{lessonStat.lesson_title}</td>
                                          <td className="px-3 py-2">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                              lessonStat.status === 'passed' ? 'bg-green-600' :
                                              lessonStat.status === 'failed' ? 'bg-red-600' :
                                              lessonStat.status === 'in_progress' ? 'bg-yellow-600' :
                                              'bg-gray-600'
                                            }`}>
                                              {lessonStat.status || 'не начат'}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2 text-center font-mono text-blue-300">
                                            {lessonStat.score !== undefined ? lessonStat.score : '-'}
                                          </td>
                                          <td className="px-3 py-2 text-center text-xs text-gray-400">
                                            {lessonStat.started_at ? new Date(lessonStat.started_at).toLocaleString('ru-RU') : '-'}
                                          </td>
                                          <td className="px-3 py-2 text-center text-xs text-gray-400">
                                            {lessonStat.ended_at ? new Date(lessonStat.ended_at).toLocaleString('ru-RU') : '-'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* 🔐 Модальное окно ввода пароля */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">🔒 Вход в закрытый курс</h2>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinPassword('');
                }}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-300">
                Для доступа к этому курсу введите пароль, предоставленный автором.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Пароль</label>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                  placeholder="Введите пароль..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmJoin();
                  }}
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinPassword('');
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-medium transition"
                  disabled={isJoining}
                >
                  Отмена
                </button>
                <button
                  onClick={handleConfirmJoin}
                  disabled={isJoining || !joinPassword.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isJoining ? 'Проверка...' : 'Подтвердить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
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
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white resize-none"
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
                      setFileToUpload(file);
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
                    alt="Предпросмотр"
                    className="w-16 h-16 object-cover rounded-lg border border-gray-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Тип курса</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="privacy"
                      checked={!formData.is_private}
                      onChange={() => setFormData(prev => ({ ...prev, is_private: false }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="ml-2 text-gray-300">Открытый</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="privacy"
                      checked={formData.is_private}
                      onChange={() => setFormData(prev => ({ ...prev, is_private: true }))}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="ml-2 text-gray-300">Закрытый (по паролю)</span>
                  </label>
                </div>
              </div>

              {formData.is_private && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Пароль для доступа</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    placeholder="Введите новый пароль..."
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Пользователи смогут записаться только после ввода пароля.
                  </p>
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

// === CreateLessonModal (без изменений) ===
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
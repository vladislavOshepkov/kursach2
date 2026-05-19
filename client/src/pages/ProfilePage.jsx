import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function ProfilePage() {
  const [user, setUser] = useState({ login: '' });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showChangeLogin, setShowChangeLogin] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [loginForm, setLoginForm] = useState({
    newLogin: '',
    confirmLogin: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const location = useLocation();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
          throw new Error('Требуется авторизация');
        }

        const userRes = await fetch(`http://localhost:5000/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!userRes.ok) throw new Error('Не удалось загрузить профиль');
        const userData = await userRes.json();
        setUser(userData);

        const progressRes = await fetch(`http://localhost:5000/api/progress/user/${userId}`);
        if (!progressRes.ok) {
        const errorText = await progressRes.text();
        throw new Error(`Ошибка прогресса ${progressRes.status}: ${errorText}`);
        }
        const userProgress = await progressRes.json(); // { lesson_id: true/false }

        const coursesRes = await fetch('http://localhost:5000/api/courses');
        if (!coursesRes.ok) throw new Error('Не удалось загрузить курсы');
        const allCourses = await coursesRes.json();

        const lessonsRes = await fetch('http://localhost:5000/api/lessons');
        if (!lessonsRes.ok) {
  const errorText = await lessonsRes.text();
  throw new Error(`Ошибка уроков ${lessonsRes.status}: ${errorText}`);
}
        const allLessons = await lessonsRes.json();

        const lessonsByCourse = {};
        allLessons.forEach(lesson => {
          if (!lessonsByCourse[lesson.course_id]) {
            lessonsByCourse[lesson.course_id] = [];
          }
          lessonsByCourse[lesson.course_id].push(lesson);
        });

        const courseStats = allCourses
          .map(course => {
            const lessons = lessonsByCourse[course.course_id] || [];
            const totalLessons = lessons.length;
            const completedLessons = lessons.filter(lesson =>
              userProgress[lesson.lesson_id]
            ).length;

            return {
              course_id: course.course_id,
              course_title: course.course_title,
              totalLessons,
              completedLessons,
            };
          })
          .filter(stat => stat.completedLessons > 0);

        setCourses(courseStats);
      } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
        setError(err.message);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    if (loginForm.newLogin !== loginForm.confirmLogin) {
      alert('Логины не совпадают');
      return;
    }
    if (loginForm.newLogin.trim().length < 3) {
      alert('Логин должен быть не короче 3 символов');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile/update-login', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newLogin: loginForm.newLogin }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Логин изменён на: ${result.login}`);
        setUser({ ...user, login: result.login });
        setShowChangeLogin(false);
        setLoginForm({ newLogin: '', confirmLogin: '' });
      } else {
        alert(result.message || 'Ошибка при изменении логина');
      }
    } catch (err) {
      console.error('Ошибка запроса:', err);
      alert('Не удалось подключиться к серверу');
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }
    if (passwordForm.newPassword.trim().length < 6) {
      alert('Пароль должен быть не короче 6 символов');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile/update-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: passwordForm.newPassword }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Пароль успешно изменён');
        setShowChangePassword(false);
        setPasswordForm({ newPassword: '', confirmPassword: '' });
      } else {
        alert(result.message || 'Ошибка при изменении пароля');
      }
    } catch (err) {
      console.error('Ошибка запроса:', err);
      alert('Не удалось подключиться к серверу');
    }
  };

  return (
    <div className="absolute inset-0 bg-gray-900 text-white flex">
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

      {/* Основная область */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="p-6 border-b border-gray-700 bg-gray-800">
          <h1 className="text-2xl font-bold">Профиль пользователя</h1>
          <p className="text-gray-300">Добро пожаловать, {user.login || 'загрузка...'}</p>
        </header>

        <main className="flex-1 p-6 bg-gray-900 overflow-y-auto">
          {loading ? (
            <p>Загрузка статистики...</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">Ваш прогресс по курсам</h2>
              {courses.length === 0 ? (
                <p className="text-gray-400">
                  Вы ещё не начали ни один урок.
                </p>
              ) : (
                <div className="space-y-4">
                  {courses.map((course) => {
                    const progress = Math.round((course.completedLessons / course.totalLessons) * 100);
                    return (
                      <div
                        key={course.course_id}
                        className="bg-gray-800 p-4 rounded-lg border border-gray-700"
                      >
                        <h3 className="font-medium">{course.course_title}</h3>
                        <p className="text-sm text-gray-300 mt-1">
                          {course.completedLessons} из {course.totalLessons} уроков
                        </p>
                        <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Действия */}
              <div className="mt-8 space-y-4">
                <button
                  onClick={() => setShowChangeLogin(true)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                >
                  Изменить логин
                </button>
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                >
                  Изменить пароль
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      {showChangeLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl max-w-sm w-full border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Изменить логин</h3>
            <form onSubmit={submitLogin}>
              <div className="space-y-3">
                <input
                  type="text"
                  name="newLogin"
                  placeholder="Новый логин"
                  value={loginForm.newLogin}
                  onChange={handleLoginChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <input
                  type="text"
                  name="confirmLogin"
                  placeholder="Подтвердите логин"
                  value={loginForm.confirmLogin}
                  onChange={handleLoginChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="flex space-x-3 mt-5">
                <button
                  type="button"
                  onClick={() => setShowChangeLogin(false)}
                  className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 rounded transition"
                >
                  Отменить
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 rounded transition"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl max-w-sm w-full border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Изменить пароль</h3>
            <form onSubmit={submitPassword}>
              <div className="space-y-3">
                <input
                  type="password"
                  name="newPassword"
                  placeholder="Новый пароль"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Подтвердите пароль"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="flex space-x-3 mt-5">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(false)}
                  className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 rounded transition"
                >
                  Отменить
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 rounded transition"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
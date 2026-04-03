import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    role: 'student',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  const prepareNameData = () => {
    const parts = formData.fullName.trim().split(' ').filter(Boolean);
    return {
      surname: parts[0] || '',
      name: parts[1] || '',
      patronym: parts[2] || '',
    };
  };

  const url = isLogin
    ? 'http://localhost:5000/api/auth/login'
    : 'http://localhost:5000/api/auth/register';

  const body = isLogin
    ? { login: formData.username, password: formData.password }
    : {
        ...prepareNameData(),
        login: formData.username,
        email: formData.email,
        password: formData.password,
        role_id: formData.role === 'student' ? 1 : 2,
      };

  console.log('formData:', formData)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (res.ok) {
      alert(isLogin ? '✅ Вход выполнен!' : '✅ Регистрация успешна!');
      if (!isLogin) setIsLogin(true);
      if (data.token) localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.user.user_id);
      navigate('/courses');
    } else {
      alert('❌ Ошибка: ' + data.message);
    }
  } catch (err) {
    console.error('Fetch error:', err);
    alert('🌐 Ошибка сети. Проверьте подключение.');
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl bg-white/8 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex">
        
        <div className="w-1/2 bg-gradient-to-b from-purple-700 to-violet-800 text-white p-12 flex flex-col justify-center">
          <h2 className="text-4xl font-bold mb-4">Добро пожаловать</h2>
          <p className="text-lg text-purple-100 leading-relaxed">
            Изучайте языки программирования с нуля.  
            Практикуйтесь в редакторе, решайте задачи, отслеживайте прогресс.
          </p>
          <div className="mt-8 space-y-3">
            <div className="flex items-center text-sm opacity-90">
              📘 Интерактивные уроки
            </div>
            <div className="flex items-center text-sm opacity-90">
              💻 Встроенный редактор кода
            </div>
            <div className="flex items-center text-sm opacity-90">
              📊 Статистика и достижения
            </div>
          </div>
        </div>

        <div className="w-1/2 p-12 bg-white/10 backdrop-blur-md">
          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md
                ${
                  isLogin
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                    : 'bg-white/20 text-gray-300 hover:bg-white/30 hover:text-white'
                }`}
            >
              Вход
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md
                ${
                  !isLogin
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                    : 'bg-white/20 text-gray-300 hover:bg-white/30 hover:text-white'
                }`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    ФИО
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-gray-400"
                    placeholder="Иванов Иван Иванович"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-gray-400"
                    placeholder="example@domain.com"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Логин
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-gray-400"
                placeholder="ivan123"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Пароль
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white placeholder-gray-400"
                placeholder="••••••••"
                required
                minLength="6"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Роль
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-white"
                >
                  <option value="student">Ученик</option>
                  <option value="teacher">Учитель</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 mt-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-white hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105 shadow-lg"
            >
              {isLogin ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-8">
            {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-purple-300 hover:underline font-medium"
            >
              {isLogin ? 'Создать' : 'Войти'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export const checkTask = async (task_id, user_code) => {
  try {
    const response = await fetch('http://localhost:5000/api/tasks/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task_id, user_code }),
    });

    const data = await response.json();
    console.log('✅ Результат проверки:', data);
    return data;
  } catch (error) {
    console.error('❌ Ошибка при проверке задания:', error);
    return { isCorrect: false, message: 'Сетевая ошибка' };
  }
};
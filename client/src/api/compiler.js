export const compileCode = async (code, language) => {
  try {
    const response = await fetch('http://localhost:5000/api/tasks/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, language }),
    });

    const data = await response.json();
    
    // ✅ Логируем результат
    console.log('🔧 Результат выполнения кода:', data);
    
    return data; // возвращаем ответ от сервера
  } catch (error) {
    console.error('❌ Ошибка при выполнении кода:', error);
    return { error: 'Сетевая ошибка' };
  }
};
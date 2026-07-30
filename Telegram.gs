/**
 * ==========================================================
 * WebinarFlow v2.0
 * Telegram.gs
 * Отправка уведомлений в Telegram
 * ==========================================================
 */

const Telegram = (function () {
  
  /**
   * Отправляет сообщение в Telegram
   * @param {string} message текст сообщения
   * @return {boolean} true если отправлено
   */
  function sendMessage(message) {
  if (!Settings.getBoolean('TELEGRAM_ENABLED')) {
    Logger.log("Telegram уведомления отключены в настройках");
    return false;
  }
  
  const botToken = Settings.get('TELEGRAM_BOT_TOKEN');
  const chatId = Settings.get('TELEGRAM_CHAT_ID');
  
  if (!botToken || !chatId) {
    Logger.log("Telegram: не настроен токен или Chat ID");
    return false;
  }
  
  try {
    const url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML"
    };
    
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      Logger.log("Telegram: сообщение отправлено");
      return true;
    } else {
      Logger.log("Telegram ошибка: " + result.description);
      return false;
    }
    
  } catch (e) {
    Logger.log("Telegram: " + e.message);
    return false;
  }
}
  
  /**
   * Отправляет уведомление о новой задаче
   */
  function notifyNewTask(task) {
    const message = `📅 <b>Новая задача</b>\n\n` +
                    `📌 ${task.type}\n` +
                    `🎯 ${task.webinarTitle}\n` +
                    `📆 ${formatDate(task.plannedDate)}\n` +
                    `👤 ${task.owner}`;
    
    sendMessage(message);
  }
  
  /**
   * Отправляет уведомление о задачах на сегодня
   */
  function notifyTodayTasks() {
  const tasks = DataModel.getTasks();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTasks = tasks.filter(task => {
    if (!task.plannedDate) return false;
    const taskDate = new Date(task.plannedDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime() && 
           task.status === CONFIG.TASK_STATUS.PLANNED;
  });
  
  if (todayTasks.length === 0) {
    sendMessage("✅ На сегодня задач нет");
    return;
  }
  
  let message = `📋 <b>Задачи на сегодня (${formatDate(today)})</b>\n\n`;
  
  todayTasks.forEach(task => {
    message += `📌 ${task.type}\n` +
               `   🎯 ${task.webinarTitle}\n` +
               `   👤 ${task.owner || 'Не назначен'}\n\n`;
  });
  
  sendMessage(message);
  }
  
  /**
   * Отправляет уведомление о задачах на завтра
   */
  function notifyTomorrowTasks() {
    const tasks = DataModel.getTasks();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const tomorrowTasks = tasks.filter(task => {
      if (!task.plannedDate) return false;
      const taskDate = new Date(task.plannedDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === tomorrow.getTime() && 
             task.status === CONFIG.TASK_STATUS.PLANNED;
    });
    
    if (tomorrowTasks.length === 0) {
      sendMessage("✅ На завтра задач нет");
      return;
    }
    
    let message = `📋 <b>Задачи на завтра (${formatDate(tomorrow)})</b>\n\n`;
    
    tomorrowTasks.forEach(task => {
      message += `📌 ${task.type}\n` +
                 `   ${task.webinarTitle}\n` +
                 `   👤 ${task.owner}\n\n`;
    });
    
    sendMessage(message);
  }
  
  /**
   * Форматирует дату в dd.mm.yyyy
   */
  function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }
  
  return {
    sendMessage,
    notifyNewTask,
    notifyTodayTasks,
    notifyTomorrowTasks
  };
  
})();

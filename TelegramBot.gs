/**
 * ==========================================================
 * WebinarFlow v2.0
 * TelegramBot.gs
 * Telegram бот с системой подписчиков
 * ==========================================================
 */

const TelegramBot = (function () {
  
  const SHEET_NAME = ' Telegram Подписчики';
  
  // ========================================================
  // ПОЛУЧЕНИЕ ТОКЕНА
  // ========================================================
  
  function getBotToken_() {
    const token = Settings.get('TELEGRAM_BOT_TOKEN');
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN не указан в настройках');
    }
    return token;
  }
  
  // ========================================================
  // УПРАВЛЕНИЕ ЛИСТОМ ПОДПИСЧИКОВ
  // ========================================================
  
  function getSubscribersSheet_() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.getRange(1, 1, 1, 4).setValues([['Chat ID', 'Имя пользователя', 'Дата подписки', 'Активен']]);
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
      sheet.setColumnWidth(1, 150);
      sheet.setColumnWidth(2, 200);
      sheet.setColumnWidth(3, 150);
      sheet.setColumnWidth(4, 100);
      sheet.setFrozenRows(1);
      Logger.log('Лист подписчиков создан');
    }
    
    return sheet;
  }
  
  // ========================================================
  // УПРАВЛЕНИЕ ПОДПИСЧИКАМИ
  // ========================================================
  
  function getActiveSubscribers() {
    const sheet = getSubscribersSheet_();
    const data = sheet.getDataRange().getValues();
    const subscribers = [];
    
    for (let i = 1; i < data.length; i++) {
      const chatId = String(data[i][0] || '').trim();
      const username = String(data[i][1] || '').trim();
      const active = String(data[i][3] || 'true').trim().toLowerCase();
      
      if (chatId && active === 'true') {
        subscribers.push({
          chatId: chatId,
          username: username
        });
      }
    }
    
    Logger.log('Активных подписчиков: ' + subscribers.length);
    return subscribers;
  }
  
  function addSubscriber(chatId, username) {
    const sheet = getSubscribersSheet_();
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(chatId).trim()) {
        sheet.getRange(i + 1, 4).setValue('true');
        Logger.log('Подписчик реактивирован: ' + chatId);
        return;
      }
    }
    
    sheet.appendRow([chatId, username, new Date(), 'true']);
    Logger.log('Новый подписчик добавлен: ' + chatId + ' (' + username + ')');
  }
  
  function removeSubscriber(chatId) {
    const sheet = getSubscribersSheet_();
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(chatId).trim()) {
        sheet.getRange(i + 1, 4).setValue('false');
        Logger.log('Подписчик деактивирован: ' + chatId);
        return;
      }
    }
  }
  
  function isSubscribed(chatId) {
    const sheet = getSubscribersSheet_();
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(chatId).trim()) {
        return String(data[i][3] || 'true').trim().toLowerCase() === 'true';
      }
    }
    
    return false;
  }
  
  // ========================================================
  // ОТПРАВКА СООБЩЕНИЙ
  // ========================================================
  
  function sendMessageToChat(chatId, text, parseMode) {
    try {
      const token = getBotToken_();
      const url = 'https://api.telegram.org/bot' + token + '/sendMessage';
      
      const payload = {
        'chat_id': chatId,
        'text': text,
        'parse_mode': parseMode || 'HTML'
      };
      
      const options = {
        'method': 'post',
        'contentType': 'application/json',
        'payload': JSON.stringify(payload),
        'muteHttpExceptions': true
      };
      
      const response = UrlFetchApp.fetch(url, options);
      const result = JSON.parse(response.getContentText());
      
      if (!result.ok) {
        Logger.log('Ошибка отправки в ' + chatId + ': ' + result.description);
      }
      
      return result.ok;
      
    } catch (e) {
      Logger.log('Ошибка sendMessageToChat: ' + e.message);
      return false;
    }
  }
  
  function broadcastMessage(text, parseMode) {
    const subscribers = getActiveSubscribers();
    let successCount = 0;
    let failCount = 0;
    
    Logger.log('Начинаем рассылку для ' + subscribers.length + ' подписчиков');
    
    subscribers.forEach(function(sub) {
      const sent = sendMessageToChat(sub.chatId, text, parseMode);
      if (sent) {
        successCount++;
      } else {
        failCount++;
      }
      
      Utilities.sleep(50);
    });
    
    Logger.log('Рассылка завершена: успешно=' + successCount + ', ошибок=' + failCount);
    
    return {
      success: successCount,
      failed: failCount,
      total: subscribers.length
    };
  }
  
  // ========================================================
  // ВЕБХУК (ВХОДЯЩИЕ СООБЩЕНИЯ)
  // ========================================================
  
  function processWebhook(e) {
    try {
      const update = JSON.parse(e.postData.contents);
      
      if (!update.message) return;
      
      const chatId = update.message.chat.id;
      const username = update.message.from.username || update.message.from.first_name || 'Unknown';
      const text = update.message.text || '';
      
      Logger.log('Получено сообщение от ' + username + ': ' + text);
      
      if (text === '/start' || text === '/subscribe') {
        addSubscriber(chatId, username);
        sendMessageToChat(chatId, 
          '✅ Вы успешно подписались на уведомления WebinarFlow!\n\n' +
          'Вы будете получать:\n' +
          '• Ежедневные сводки задач\n' +
          '• Напоминания о вебинарах\n\n' +
          'Для отписки используйте /unsubscribe',
          'HTML'
        );
      }
      else if (text === '/unsubscribe') {
        removeSubscriber(chatId);
        sendMessageToChat(chatId, 
          '❌ Вы отписались от уведомлений WebinarFlow.\n\n' +
          'Для подписки используйте /subscribe',
          'HTML'
        );
      }
      else if (text === '/help') {
        sendMessageToChat(chatId,
          '📋 Доступные команды:\n\n' +
          '/subscribe - Подписаться на уведомления\n' +
          '/unsubscribe - Отписаться от уведомлений\n' +
          '/help - Справка\n' +
          '/status - Статус подписки',
          'HTML'
        );
      }
      else if (text === '/status') {
        if (isSubscribed(chatId)) {
          sendMessageToChat(chatId, '✅ Вы подписаны на уведомления', 'HTML');
        } else {
          sendMessageToChat(chatId, '❌ Вы не подписаны. Используйте /subscribe', 'HTML');
        }
      }
      
    } catch (e) {
      Logger.log('Ошибка processWebhook: ' + e.message);
    }
  }
  
  // ========================================================
  // УВЕДОМЛЕНИЯ
  // ========================================================
  
  function notifyTodayTasks() {
    const tasks = DataModel.getTasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTasks = tasks.filter(function(task) {
      if (!task.plannedDate) return false;
      const taskDate = new Date(task.plannedDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime() && 
             task.status === CONFIG.TASK_STATUS.PLANNED;
    });
    
    let message;
    
    if (todayTasks.length === 0) {
      message = '✅ <b>На сегодня задач нет</b>\n\n' +
                ' ' + today.toLocaleDateString('ru-RU', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
    } else {
      message = '📋 <b>Задачи на сегодня</b>\n' +
                '📅 ' + today.toLocaleDateString('ru-RU', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) + '\n\n';
      
      todayTasks.forEach(function(task) {
        message += '📌 <b>' + task.type + '</b>\n' +
                   '   🎯 ' + task.webinarTitle + '\n' +
                   '   👤 ' + (task.owner || 'Не назначен') + '\n\n';
      });
      
      message += '━━━━━━━━━━━━━━━\n' +
                 'Всего задач: ' + todayTasks.length;
    }
    
    const result = broadcastMessage(message, 'HTML');
    Logger.log('Уведомление отправлено: ' + result.success + ' из ' + result.total);
    
    return result;
  }
  
  function notifyTomorrowTasks() {
    const tasks = DataModel.getTasks();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const tomorrowTasks = tasks.filter(function(task) {
      if (!task.plannedDate) return false;
      const taskDate = new Date(task.plannedDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === tomorrow.getTime() && 
             task.status === CONFIG.TASK_STATUS.PLANNED;
    });
    
    let message;
    
    if (tomorrowTasks.length === 0) {
      message = '✅ <b>На завтра задач нет</b>\n\n' +
                '📅 ' + tomorrow.toLocaleDateString('ru-RU', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
    } else {
      message = '📋 <b>Задачи на завтра</b>\n' +
                '📅 ' + tomorrow.toLocaleDateString('ru-RU', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) + '\n\n';
      
      tomorrowTasks.forEach(function(task) {
        message += '📌 <b>' + task.type + '</b>\n' +
                   '   🎯 ' + task.webinarTitle + '\n' +
                   '   👤 ' + (task.owner || 'Не назначен') + '\n\n';
      });
      
      message += '━━━━━━━━━━━━━━━\n' +
                 'Всего задач: ' + tomorrowTasks.length;
    }
    
    const result = broadcastMessage(message, 'HTML');
    Logger.log('Уведомление на завтра отправлено: ' + result.success + ' из ' + result.total);
    
    return result;
  }
  
  function testBroadcast() {
    const result = broadcastMessage('📢 <b>Тестовое сообщение</b>\n\nЕсли вы видите это сообщение - бот работает корректно!', 'HTML');
    return result;
  }
  
  return {
    getActiveSubscribers: getActiveSubscribers,
    addSubscriber: addSubscriber,
    removeSubscriber: removeSubscriber,
    isSubscribed: isSubscribed,
    sendMessageToChat: sendMessageToChat,
    broadcastMessage: broadcastMessage,
    processWebhook: processWebhook,
    notifyTodayTasks: notifyTodayTasks,
    notifyTomorrowTasks: notifyTomorrowTasks,
    testBroadcast: testBroadcast
  };
  
})();

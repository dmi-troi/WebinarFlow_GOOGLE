/**
 * ==========================================================
 * Telegram Webhook Handler
 * Обработка webhook от Telegram
 * ==========================================================
 */

/**
 * POST запрос - обработка webhook от Telegram
 */
function doPost(e) {
  try {
    Logger.log('=== doPost вызван ===');
    
    if (!e || !e.postData || !e.postData.contents) {
      Logger.log('Нет данных в запросе');
      return ContentService.createTextOutput('{"ok":true}')
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    Logger.log('Получены данные: ' + e.postData.contents.substring(0, 150));
    
    // Обрабатываем сообщение
    handleTelegramMessage_(e);
    
    Logger.log('Webhook обработан успешно');
    
    return ContentService.createTextOutput('{"ok":true}')
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    Logger.log('doPost error: ' + err.message);
    Logger.log(err.stack);
    return ContentService.createTextOutput('{"ok":true}')
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Обработка сообщения от Telegram
 */
function handleTelegramMessage_(e) {
  try {
    const update = JSON.parse(e.postData.contents);
    
    if (!update.message) {
      Logger.log('Нет message в update');
      return;
    }
    
    const chatId = update.message.chat.id;
    const username = update.message.from.username || update.message.from.first_name || 'User';
    const text = update.message.text || '';
    
    Logger.log('Сообщение от: ' + username + ' (' + chatId + ') - ' + text);
    
    // Получаем токен
    const token = getTelegramToken_();
    if (!token) {
      Logger.log('Токен не найден!');
      return;
    }
    
    // Получаем или создаём лист подписчиков
    const sheet = getSubscribersSheet_();
    Logger.log('Лист подписчиков: ' + (sheet ? 'найден' : 'НЕ найден'));
    
    // Обрабатываем команды
    if (text === '/start' || text === '/subscribe') {
      Logger.log('Добавляем подписчика: ' + chatId);
      const added = addSubscriber_(chatId, username, sheet);
      Logger.log('Результат добавления: ' + (added ? 'успех' : 'ошибка'));
      
      if (added) {
        sendTelegramMessage(token, chatId, 
          '✅ <b>Вы подписались!</b>\n\n' +
          'Теперь вы будете получать уведомления о задачах.\n\n' +
          'Для отписки: /unsubscribe'
        );
        Logger.log('✅ Подписчик добавлен: ' + chatId);
      } else {
        Logger.log('❌ Ошибка добавления подписчика');
      }
    }
    else if (text === '/unsubscribe') {
      Logger.log('Удаляем подписчика: ' + chatId);
      removeSubscriber_(chatId, sheet);
      sendTelegramMessage(token, chatId, 
        '❌ Вы отписались от уведомлений.\n\nДля подписки: /subscribe'
      );
    }
    else if (text === '/help') {
      sendTelegramMessage(token, chatId,
        '<b>Доступные команды:</b>\n\n' +
        '/subscribe - Подписаться\n' +
        '/unsubscribe - Отписаться\n' +
        '/status - Статус\n' +
        '/help - Справка'
      );
    }
    else if (text === '/status') {
      const isSubscribed = checkSubscriber_(chatId, sheet);
      sendTelegramMessage(token, chatId, 
        isSubscribed ? '✅ Вы подписаны' : '❌ Не подписаны\nИспользуйте /subscribe'
      );
    }
    
  } catch (err) {
    Logger.log('handleTelegramMessage_ error: ' + err.message);
    Logger.log(err.stack);
  }
}

// ========================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ========================================================

function getTelegramToken_() {
  try {
    const token = Settings.get('TELEGRAM_BOT_TOKEN');
    Logger.log('Получен токен: ' + (token ? token.substring(0, 10) + '...' : 'НЕТ'));
    return token;
  } catch (e) {
    Logger.log('getTelegramToken_ error: ' + e.message);
    return null;
  }
}

function getSubscribersSheet_() {
  try {
    const SHEET_NAME = '📱 Telegram Подписчики';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      Logger.log('Лист не найден, создаём...');
      sheet = ss.insertSheet(SHEET_NAME);
      
      // Создаём заголовки
      sheet.getRange(1, 1, 1, 4).setValues([['Chat ID', 'Username', 'Дата подписки', 'Active']]);
      sheet.getRange(1, 1, 1, 4)
        .setFontWeight('bold')
        .setBackground('#4285f4')
        .setFontColor('#ffffff');
      sheet.setColumnWidth(1, 200);
      sheet.setColumnWidth(2, 200);
      sheet.setColumnWidth(3, 150);
      sheet.setColumnWidth(4, 100);
      
      Logger.log('✅ Лист подписчиков создан');
    } else {
      Logger.log('✅ Лист подписчиков найден');
    }
    
    return sheet;
    
  } catch (e) {
    Logger.log('getSubscribersSheet_ error: ' + e.message);
    return null;
  }
}

function addSubscriber_(chatId, username, sheet) {
  try {
    if (!sheet) {
      Logger.log('addSubscriber_: лист не передан');
      sheet = getSubscribersSheet_();
    }
    
    if (!sheet) {
      Logger.log('addSubscriber_: не удалось получить лист');
      return false;
    }
    
    Logger.log('addSubscriber_: chatId=' + chatId + ', username=' + username);
    
    const data = sheet.getDataRange().getValues();
    Logger.log('Всего строк в листе: ' + data.length);
    
    // Проверяем, есть ли уже такой подписчик
    for (let i = 1; i < data.length; i++) {
      const rowChatId = String(data[i][0] || '').trim();
      Logger.log('Проверяем строку ' + i + ': ' + rowChatId);
      
      if (rowChatId === String(chatId).trim()) {
        // Реактивируем
        Logger.log('Подписчик найден, реактивируем строку ' + (i + 1));
        sheet.getRange(i + 1, 4).setValue('TRUE');
        Logger.log('✅ Подписчик реактивирован');
        return true;
      }
    }
    
    // Добавляем нового подписчика
    Logger.log('Добавляем новую строку: [' + chatId + ', ' + username + ', ' + new Date() + ', TRUE]');
    
    try {
      sheet.appendRow([chatId, username, new Date(), 'TRUE']);
      Logger.log('✅ Подписчик добавлен в таблицу');
      
      // Принудительно сохраняем
      SpreadsheetApp.flush();
      Logger.log('Данные сохранены');
      
      return true;
      
    } catch (appendError) {
      Logger.log('Ошибка appendRow: ' + appendError.message);
      return false;
    }
    
  } catch (e) {
    Logger.log('addSubscriber_ error: ' + e.message);
    Logger.log(e.stack);
    return false;
  }
}

function removeSubscriber_(chatId, sheet) {
  try {
    if (!sheet) sheet = getSubscribersSheet_();
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(chatId).trim()) {
        sheet.getRange(i + 1, 4).setValue('FALSE');
        Logger.log('Подписчик деактивирован: ' + chatId);
        return true;
      }
    }
    
    return false;
  } catch (e) {
    Logger.log('removeSubscriber_ error: ' + e.message);
    return false;
  }
}

function checkSubscriber_(chatId, sheet) {
  try {
    if (!sheet) sheet = getSubscribersSheet_();
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(chatId).trim()) {
        const isActive = String(data[i][3]).trim().toUpperCase() === 'TRUE';
        return isActive;
      }
    }
    
    return false;
  } catch (e) {
    Logger.log('checkSubscriber_ error: ' + e.message);
    return false;
  }
}

function sendTelegramMessage(token, chatId, text) {
  try {
    const url = 'https://api.telegram.org/bot' + token + '/sendMessage';
    
    const response = UrlFetchApp.fetch(url, {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify({
        'chat_id': chatId,
        'text': text,
        'parse_mode': 'HTML'
      }),
      'muteHttpExceptions': true
    });
    
    const result = JSON.parse(response.getContentText());
    Logger.log('sendTelegramMessage result: ' + JSON.stringify(result));
    
    return result.ok;
  } catch (e) {
    Logger.log('sendTelegramMessage error: ' + e.message);
    return false;
  }
}

/**
 * Функция для настройки вебхука
 */
function setupWebhookForThisFile() {
  const ui = SpreadsheetApp.getUi();
  
  const token = Settings.get('TELEGRAM_BOT_TOKEN');
  if (!token) {
    ui.alert('❌ TELEGRAM_BOT_TOKEN не указан');
    return;
  }
  
  const scriptUrl = ScriptApp.getService().getUrl();
  
  if (!scriptUrl) {
    ui.alert(
      '⚠️ Веб-приложение не развёрнуто\n\n' +
      '1. Нажмите "Развернуть → Новое развёртывание"\n' +
      '2. Тип: Веб-приложение\n' +
      '3. Доступ: Все\n' +
      '4. Нажмите "Развернуть"\n' +
      '5. Запустите эту функцию снова'
    );
    return;
  }
  
  const webhookUrl = 'https://api.telegram.org/bot' + token + '/setWebhook?url=' + encodeURIComponent(scriptUrl);
  
  try {
    const response = UrlFetchApp.fetch(webhookUrl);
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      ui.alert(
        '✅ Вебхук настроен!\n\n' +
        'URL: ' + scriptUrl + '\n\n' +
        'Теперь напишите боту /subscribe'
      );
    } else {
      ui.alert('❌ Ошибка: ' + result.description);
    }
  } catch (e) {
    ui.alert('❌ Ошибка: ' + e.message);
  }
}

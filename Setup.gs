/**
 * ==========================================================
 * WebinarFlow v2.0
 * Setup.gs
 * Настройка таблицы (выпадающие списки и т.д.)
 * ==========================================================
 */

/**
 * Установить выпадающие списки ответственных на листе "Задачи"
 */
function setupTaskResponsiblesDropdown() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(CONFIG.SHEETS.TASKS);
    
    if (!sheet) {
      throw new Error('Лист "Задачи" не найден');
    }
    
    const responsibles = Responsibles.getActive();
    
    if (responsibles.length === 0) {
      throw new Error('Нет активных ответственных. Добавьте их на лист "👥 Ответственные"');
    }
    
    const names = responsibles.map(function(r) { return r.name; });
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    let ownerCol = -1;
    
    for (let i = 0; i < headers.length; i++) {
      if (String(headers[i]).trim() === 'Ответственный') {
        ownerCol = i + 1;
        break;
      }
    }
    
    if (ownerCol === -1) {
      throw new Error('Колонка "Ответственный" не найдена на листе "Задачи"');
    }
    
    const lastRow = sheet.getLastRow();
    
    if (lastRow < 2) {
      ui.alert('ℹ️ Лист "Задачи" пустой', 'Сначала создайте задачи через "🔄 Пересчитать систему"', ui.ButtonSet.OK);
      return;
    }
    
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(names, true)
      .setAllowInvalid(false)
      .build();
    
    sheet.getRange(2, ownerCol, lastRow - 1, 1).setDataValidation(rule);
    sheet.setColumnWidth(ownerCol, 180);
    
    ui.alert('✅ Готово', 
      'Выпадающий список ответственных установлен для ' + (lastRow - 1) + ' задач.\n\n' +
      'Список: ' + names.join(', '), 
      ui.ButtonSet.OK);
    
    Logger.log('Выпадающий список установлен для ' + (lastRow - 1) + ' задач');
    
  } catch (e) {
    ui.alert('❌ Ошибка', e.message, ui.ButtonSet.OK);
    Logger.log('Ошибка setupTaskResponsiblesDropdown: ' + e.stack);
  }
}

/**
 * Синхронизировать ответственных в задачах с вебинарами
 */
function syncTaskOwnersFromWebinars() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    'Синхронизация ответственных',
    'Ответственные во всех задачах будут заменены на ответственных из соответствующих вебинаров.\n\n' +
    'Это перезапишет ваш ручной выбор!\n\nПродолжить?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) return;
  
  try {
    const webinars = DataModel.getWebinars();
    const webinarMap = {};
    
    webinars.forEach(function(w) {
      webinarMap[w.id] = w.owner;
    });
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(CONFIG.SHEETS.TASKS);
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    let webinarIdCol = -1;
    let ownerCol = -1;
    
    for (let i = 0; i < headers.length; i++) {
      if (String(headers[i]).trim() === 'Вебинар ID') webinarIdCol = i;
      if (String(headers[i]).trim() === 'Ответственный') ownerCol = i;
    }
    
    if (webinarIdCol === -1 || ownerCol === -1) {
      throw new Error('Не найдены колонки "Вебинар ID" или "Ответственный"');
    }
    
    let updated = 0;
    
    for (let i = 1; i < data.length; i++) {
      const webinarId = String(data[i][webinarIdCol] || '').trim();
      if (webinarId && webinarMap[webinarId]) {
        sheet.getRange(i + 1, ownerCol + 1).setValue(webinarMap[webinarId]);
        updated++;
      }
    }
    
    ui.alert('✅ Готово', 'Обновлено ответственных: ' + updated, ui.ButtonSet.OK);
    
  } catch (e) {
    ui.alert('❌ Ошибка', e.message, ui.ButtonSet.OK);
  }
}/**
 * ==========================================================
 * WebinarFlow v2.0
 * Setup.gs
 * Настройка вебхука Telegram
 * ==========================================================
 */

/**
 * Настроить вебхук для Telegram бота
 */
function setupTelegramWebhook() {
  const ui = SpreadsheetApp.getUi();
  
  // Получаем токен бота
  const token = Settings.get('TELEGRAM_BOT_TOKEN');
  if (!token) {
    ui.alert('❌ Ошибка', 'TELEGRAM_BOT_TOKEN не указан в настройках', ui.ButtonSet.OK);
    return;
  }
  
  // Получаем URL веб-приложения
  const scriptUrl = ScriptApp.getService().getUrl();
  if (!scriptUrl || scriptUrl === '') {
    ui.alert(
      '❌ Веб-приложение не настроено',
      'Чтобы настроить вебхук:\n\n' +
      '1. Нажмите "Развернуть → Новое развёртывание"\n' +
      '2. Тип: Веб-приложение\n' +
      '3. Доступ: Все\n' +
      '4. Нажмите "Развернуть"\n' +
      '5. Запустите эту функцию снова',
      ui.ButtonSet.OK
    );
    return;
  }
  
  // Настраиваем вебхук
  const webhookUrl = 'https://api.telegram.org/bot' + token + '/setWebhook?url=' + encodeURIComponent(scriptUrl);
  
  try {
    const response = UrlFetchApp.fetch(webhookUrl);
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      ui.alert(
        '✅ Вебхук настроен!',
        'URL: ' + scriptUrl + '\n\n' +
        'Теперь бот будет получать команды:\n' +
        '• /subscribe - подписка\n' +
        '• /unsubscribe - отписка\n' +
        '• /help - справка\n' +
        '• /status - статус подписки',
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        '❌ Ошибка настройки',
        'Telegram ответил:\n' + result.description,
        ui.ButtonSet.OK
      );
    }
  } catch (e) {
    ui.alert('❌ Ошибка', e.message, ui.ButtonSet.OK);
  }
}

/**
 * Проверить статус вебхука
 */
function checkTelegramWebhook() {
  const ui = SpreadsheetApp.getUi();
  
  const token = Settings.get('TELEGRAM_BOT_TOKEN');
  if (!token) {
    ui.alert('❌ Ошибка', 'TELEGRAM_BOT_TOKEN не указан', ui.ButtonSet.OK);
    return;
  }
  
  const url = 'https://api.telegram.org/bot' + token + '/getWebhookInfo';
  
  try {
    const response = UrlFetchApp.fetch(url);
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      const info = result.result;
      let message = '📡 Статус вебхука:\n\n';
      
      if (info.url) {
        message += '✅ URL: ' + info.url + '\n';
        message += '📊 Ожидающих обновлений: ' + (info.pending_update_count || 0) + '\n';
        message += '❌ Ошибок: ' + (info.last_error_message || 'нет') + '\n';
        message += '📅 Последняя ошибка: ' + (info.last_error_date ? new Date(info.last_error_date * 1000).toLocaleString() : 'нет');
      } else {
        message += '❌ Вебхук не настроен\n\n';
        message += 'Нажмите меню:\n' +
                   '📱 Telegram → Настроить вебхук';
      }
      
      ui.alert(message, ui.ButtonSet.OK);
    } else {
      ui.alert('❌ Ошибка', result.description, ui.ButtonSet.OK);
    }
  } catch (e) {
    ui.alert('❌ Ошибка', e.message, ui.ButtonSet.OK);
  }
}

/**
 * Удалить вебхук (вернуть к polling)
 */
function deleteTelegramWebhook() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    'Удалить вебхук?',
    'После удаления бот перестанет принимать команды /subscribe.\n\nПродолжить?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) return;
  
  const token = Settings.get('TELEGRAM_BOT_TOKEN');
  if (!token) {
    ui.alert('❌ Ошибка', 'TELEGRAM_BOT_TOKEN не указан', ui.ButtonSet.OK);
    return;
  }
  
  const url = 'https://api.telegram.org/bot' + token + '/deleteWebhook';
  
  try {
    const response = UrlFetchApp.fetch(url);
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      ui.alert('✅ Вебхук удалён', ui.ButtonSet.OK);
    } else {
      ui.alert('❌ Ошибка', result.description, ui.ButtonSet.OK);
    }
  } catch (e) {
    ui.alert('❌ Ошибка', e.message, ui.ButtonSet.OK);
  }
}

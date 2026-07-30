/**
 * ==========================================================
 * WebinarFlow v2.0
 * Main.gs
 * Главный файл: меню, инициализация, общие функции
 * ==========================================================
 */

/**
 * Инициализация при открытии таблицы
 */
function onOpen() {
  try {
    createApplicationMenu_();
    Logger.log('✅ Меню WebinarFlow создано');
  } catch (e) {
    Logger.log('❌ Ошибка создания меню: ' + e.message);
  }
}

/**
 * Создание меню приложения
 */
function createApplicationMenu_() {
  SpreadsheetApp.getUi()
    .createMenu("📅 WebinarFlow")
    .addItem("➕ Новый вебинар", "openNewWebinarForm")
    .addItem("️ Редактировать вебинар", "showEditWebinarDialog")
    .addItem("🗑️ Удалить вебинар", "showDeleteWebinarDialog")
    .addSeparator()
    .addItem("📅 Вебинары", "goToWebinars")
    .addItem("📨 Задачи", "goToTasks")
    .addItem(" Календарь", "goToCalendar")
    .addItem("👥 Ответственные", "goToResponsibles")
    .addItem(" Dashboard", "goToDashboard")
    .addItem("📦 Архив", "goToArchive")
    .addSeparator()
    .addItem("🔄 Пересчитать систему", "recalculateSystem")
    .addItem("🔄 Переключить автопересчёт", "toggleAutoRecalculate")
    .addItem("📊 Обновить Dashboard", "updateDashboard")
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu("📨 Задачи")
        .addItem("👥 Установить списки ответственных", "setupTaskResponsiblesDropdown")
        .addItem("🔄 Синхронизировать с вебинарами", "syncTaskOwnersFromWebinars")
    )
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu("📆 Календарь")
        .addItem("📅 Текущий месяц", "showCalendarCurrentMonth")
        .addItem("⏭️ Следующий месяц", "showCalendarNextMonth")
        .addItem("⏮️ Предыдущий месяц", "showCalendarPreviousMonth")
    )
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu("👥 Ответственные")
        .addItem(" Добавить", "showAddResponsibleDialog")
        .addItem("📋 Список", "goToResponsibles")
    )
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu(" Архив")
        .addItem(" Архивировать", "archiveWebinars")
        .addItem("🗑️ Очистить", "clearArchive")
        .addItem(" Просмотр", "goToArchive")
    )
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu("🎉 Праздники")
        .addItem("📥 Импортировать (текущий год)", "importHolidaysForCurrentYear")
        .addItem("📥 Импортировать (следующий год)", "importHolidaysForNextYear")
        .addItem("📋 Открыть лист", "goToHolidays")
    )
    .addSubMenu(
  SpreadsheetApp.getUi().createMenu("📱 Telegram")
    .addItem("📤 Задачи на сегодня (всем)", "sendTodayTasks")
    .addItem("📤 Задачи на завтра (всем)", "sendTomorrowTasks")
    .addItem("🧪 Тестовая рассылка", "testTelegramBroadcast")
    .addSeparator()
    .addItem("🔧 Настроить вебхук", "setupTelegramWebhook")
    .addItem("📡 Проверить вебхук", "checkTelegramWebhook")
    .addItem("🗑️ Удалить вебхук", "deleteTelegramWebhook")
    .addSeparator()
    .addItem("📋 Список подписчиков", "showSubscribersList")
    )
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu("🎨 Оформление")
        .addItem("📊 Обновить Dashboard", "updateDashboardUI")
        .addItem("🎨 Форматировать вебинары", "formatWebinarsSheet")
    )
    .addSeparator()
    .addSubMenu(
  SpreadsheetApp.getUi()
    .createMenu("🤖 AI")
    .addItem("⚙ Настройки AI", "openAISettings")
    .addSeparator()
    .addItem("🔍 Анализ кода", "openAIReview")
    .addItem("🚨 Анализ ошибок", "openAIErrorDialog")
    .addSeparator()
    .addItem("🧪 Проверить подключение", "testAI")
    )
    .addSeparator()
    .addItem("⚙ Настройки", "showSettingsDialog")
    .addItem("📝 Журнал", "goToLog")
    .addSeparator()
    .addItem("🧹 Проверить систему", "checkSystem")
    .addItem("ℹ О программе", "showAbout")
    .addToUi();
}

// ========================================================
// НАВИГАЦИЯ ПО ЛИСТАМ
// ========================================================

function goToWebinars() {
  openSheet_(CONFIG.SHEETS.WEBINARS);
}

function goToTasks() {
  openSheet_(CONFIG.SHEETS.TASKS);
}

function goToCalendar() {
  openSheet_(CONFIG.SHEETS.CALENDAR || '📆 Календарь');
}

function goToResponsibles() {
  openSheet_(CONFIG.SHEETS.RESPONSIBLES);
}

function goToDashboard() {
  openSheet_(CONFIG.SHEETS.DASHBOARD);
}

function goToArchive() {
  openSheet_(CONFIG.SHEETS.ARCHIVE);
}

function goToHolidays() {
  openSheet_(CONFIG.SHEETS.HOLIDAYS);
}

function goToLog() {
  openSheet_(CONFIG.SHEETS.LOG || '📝 Журнал');
}

function openSheet_(sheetName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      ss.setActiveSheet(sheet);
    } else {
      SpreadsheetApp.getUi().alert('Лист "' + sheetName + '" не найден');
    }
  } catch (e) {
    Logger.log('Ошибка навигации: ' + e.message);
  }
}

// ========================================================
// ПЕРЕСЧЁТ СИСТЕМЫ
// ========================================================

function recalculateSystem() {
  try {
    Logger.log('=== recalculateSystem START ===');
    
    // 1. Пересчитываем задачи
    Logger.log('1. Пересчёт задач...');
    Planner.planAllWebinars();
    
    // 2. Синхронизация календаря
    Logger.log('2. Синхронизация календаря...');
    if (typeof CalendarSync !== 'undefined') {
      try { CalendarSync.syncCalendar(); } catch (e) {
        Logger.log('CalendarSync недоступен: ' + e.message);
      }
    }
    
    // 3. Обновление Dashboard
    Logger.log('3. Обновление Dashboard...');
    try {
      if (typeof Dashboard !== 'undefined') {
        Dashboard.updateDashboard();
      }
    } catch (e) {
      Logger.log('Dashboard недоступен: ' + e.message);
    }
    
    Logger.log('=== recalculateSystem END ===');
    SpreadsheetApp.getUi().alert('✅ Система пересчитана');
    
  } catch (e) {
    Logger.log('❌ Ошибка recalculateSystem: ' + e.message);
    SpreadsheetApp.getUi().alert('Ошибка: ' + e.message);
  }
}

// ========================================================
// УДАЛЕНИЕ ВЕБИНАРА (КАСКАДНОЕ)
// ========================================================

function cascadeDeleteWebinar(webinarId) {
  if (!webinarId) {
    throw new Error('Не указан ID вебинара');
  }
  
  Logger.log('=== cascadeDeleteWebinar START: ' + webinarId + ' ===');
  
  // 1. Получаем все задачи этого вебинара
  const tasks = DataModel.getTasks();
  const webinarTasks = tasks.filter(function(t) {
    return t.webinarId === webinarId;
  });
  
  Logger.log('Найдено задач для удаления: ' + webinarTasks.length);
  
  // 2. Удаляем события из календаря
  let eventsDeleted = 0;
  
  try {
    var calendar;
    if (CONFIG.CALENDAR.ID) {
      calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR.ID);
    } else {
      calendar = CalendarApp.getDefaultCalendar();
    }
    
    webinarTasks.forEach(function(task) {
      if (task.eventId) {
        try {
          var event = calendar.getEventById(task.eventId);
          if (event) {
            event.deleteEvent();
            eventsDeleted++;
            Logger.log('✅ Удалено событие: ' + task.eventId);
          }
        } catch (e) {
          Logger.log('⚠️ Ошибка удаления события: ' + e.message);
        }
      }
    });
    
  } catch (e) {
    Logger.log('❌ Ошибка доступа к календарю: ' + e.message);
  }
  
  Logger.log('Удалено событий из календаря: ' + eventsDeleted);
  
  // 3. Удаляем задачи из листа
  const tasksSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(CONFIG.SHEETS.TASKS);
  
  let tasksDeleted = 0;
  if (tasksSheet) {
    const data = tasksSheet.getDataRange().getValues();
    const headers = data[0];
    
    let webinarIdCol = -1;
    for (let i = 0; i < headers.length; i++) {
      if (String(headers[i]).trim() === 'Вебинар ID') {
        webinarIdCol = i;
        break;
      }
    }
    
    if (webinarIdCol !== -1) {
      for (let i = data.length - 1; i >= 1; i--) {
        const rowWebinarId = String(data[i][webinarIdCol] || '').trim();
        if (rowWebinarId === webinarId) {
          tasksSheet.deleteRow(i + 1);
          tasksDeleted++;
        }
      }
    }
    Logger.log('Удалено задач из листа: ' + tasksDeleted);
  }
  
  // 4. Удаляем сам вебинар
  const result = DataModel.deleteWebinar(webinarId);
  
  if (!result) {
    throw new Error('Не удалось удалить вебинар');
  }
  
  Logger.log('=== cascadeDeleteWebinar END ===');
  
  return {
    eventsDeleted: eventsDeleted,
    tasksDeleted: tasksDeleted,
    webinarDeleted: result
  };
}

function deleteWebinarFromDialog(id) {
  if (!id) {
    throw new Error('Не указан ID вебинара');
  }
  
  const result = cascadeDeleteWebinar(id);
  Logger.log('Удалено событий: ' + result.eventsDeleted);
  
  return true;
}

function showDeleteWebinarDialog() {
  const ui = SpreadsheetApp.getUi();
  const webinars = DataModel.getWebinars();
  
  if (webinars.length === 0) {
    ui.alert('Нет вебинаров для удаления');
    return;
  }
  
  try {
    const html = HtmlService.createHtmlOutputFromFile('DeleteWebinar')
      .setWidth(400)
      .setHeight(300);
    ui.showModalDialog(html, '🗑️ Удалить вебинар');
  } catch (e) {
    // Если файла нет - используем простой диалог
    const webinarNames = webinars.map(function(w, i) { return (i + 1) + '. ' + w.title; }).join('\n');
    const response = ui.prompt(
      '🗑️ Удалить вебинар',
      'Введите номер вебинара для удаления:\n\n' + webinarNames,
      ui.ButtonSet.OK_CANCEL
    );
    
    if (response.getSelectedButton() === ui.Button.OK) {
      const index = parseInt(response.getResponseText()) - 1;
      if (index >= 0 && index < webinars.length) {
        cascadeDeleteWebinar(webinars[index].id);
        ui.alert('✅ Вебинар удалён');
      }
    }
  }
}

// ========================================================
// ФОРМЫ ДИАЛОГОВ
// ========================================================

function openNewWebinarForm() {
  try {
    const html = HtmlService.createHtmlOutputFromFile('NewWebinar')
      .setWidth(500)
      .setHeight(600);
    SpreadsheetApp.getUi().showModalDialog(html, '➕ Новый вебинар');
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Форма не найдена: ' + e.message);
  }
}

function showEditWebinarDialog() {
  try {
    const html = HtmlService.createHtmlOutputFromFile('EditWebinar')
      .setWidth(500)
      .setHeight(600);
    SpreadsheetApp.getUi().showModalDialog(html, '️ Редактировать вебинар');
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Форма не найдена: ' + e.message);
  }
}

function showAddResponsibleDialog() {
  try {
    const html = HtmlService.createHtmlOutputFromFile('AddResponsible')
      .setWidth(400)
      .setHeight(400);
    SpreadsheetApp.getUi().showModalDialog(html, '➕ Добавить ответственного');
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Форма не найдена: ' + e.message);
  }
}

function showSettingsDialog() {
  try {
    const html = HtmlService.createHtmlOutputFromFile('Settings')
      .setWidth(600)
      .setHeight(500);
    SpreadsheetApp.getUi().showModalDialog(html, '⚙ Настройки');
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Форма не найдена: ' + e.message);
  }
}

function showAbout() {
  SpreadsheetApp.getUi().alert(
    'WebinarFlow v2.0\n\n' +
    'Система управления вебинарами\n' +
    'Eurokappa Academy\n\n' +
    'Функции:\n' +
    '• Планирование вебинаров\n' +
    '• Автоматический расчёт задач\n' +
    '• Синхронизация с Google Calendar\n' +
    '• Уведомления в Telegram\n' +
    '• Dashboard со статистикой'
  );
}

function checkSystem() {
  const ui = SpreadsheetApp.getUi();
  let report = '🔍 Проверка системы:\n\n';
  
  const requiredSheets = [
    CONFIG.SHEETS.WEBINARS,
    CONFIG.SHEETS.TASKS,
    CONFIG.SHEETS.HOLIDAYS,
    CONFIG.SHEETS.SETTINGS,
    CONFIG.SHEETS.RESPONSIBLES
  ];
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  requiredSheets.forEach(function(name) {
    const sheet = ss.getSheetByName(name);
    if (sheet) {
      report += '✅ ' + name + '\n';
    } else {
      report += '❌ ' + name + ' - НЕ НАЙДЕН\n';
    }
  });
  
  report += '\n📊 Статистика:\n';
  try {
    report += '• Вебинаров: ' + DataModel.getWebinars().length + '\n';
    report += '• Задач: ' + DataModel.getTasks().length + '\n';
  } catch (e) {
    report += '• Ошибка получения данных: ' + e.message + '\n';
  }
  
  const botToken = Settings.get('TELEGRAM_BOT_TOKEN');
  if (botToken) {
    report += '✅ Telegram бот настроен\n';
  } else {
    report += '⚠️ Telegram бот не настроен\n';
  }
  
  ui.alert(report);
}

// ========================================================
// TELEGRAM (уведомления)
// ========================================================

/**
 * Отправить уведомления о задачах на сегодня (БЕЗОПАСНО ДЛЯ ТРИГГЕРОВ)
 */
function sendTodayTasks() {
  try {
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
    
    Logger.log('Найдено задач на сегодня: ' + todayTasks.length);
    
    let message;
    if (todayTasks.length === 0) {
      message = '✅ <b>На сегодня задач нет</b>\n\n📅 ' + today.toLocaleDateString('ru-RU', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
    } else {
      message = '📋 <b>Задачи на сегодня</b>\n📅 ' + today.toLocaleDateString('ru-RU', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      }) + '\n\n';
      todayTasks.forEach(function(task) {
        message += '📌 <b>' + task.type + '</b>\n' +
                   '   🎯 ' + task.webinarTitle + '\n' +
                   '   👤 ' + (task.owner || 'Не назначен') + '\n\n';
      });
      message += '━━━━━━━━━━━━━━━\nВсего задач: ' + todayTasks.length;
    }
    
    const token = Settings.get('TELEGRAM_BOT_TOKEN');
    if (!token) {
      Logger.log('❌ TELEGRAM_BOT_TOKEN не указан');
      return;
    }
    
    let sentCount = 0;
    let failCount = 0;
    
    const chatId = Settings.get('TELEGRAM_CHAT_ID');
    if (chatId) {
      if (sendMessageToTelegram_(token, chatId, message)) sentCount++; else failCount++;
    }
    
    try {
      const subscribers = getSubscribersList_();
      subscribers.forEach(function(sub) {
        if (sub.chatId !== chatId) {
          if (sendMessageToTelegram_(token, sub.chatId, message)) sentCount++; else failCount++;
          Utilities.sleep(50);
        }
      });
    } catch (e) {
      Logger.log('Лист подписчиков не найден: ' + e.message);
    }
    
    const resultMessage = '✅ Уведомление отправлено\nУспешно: ' + sentCount + '\nОшибок: ' + failCount;
    Logger.log(resultMessage);
    
    // БЕЗОПАСНЫЙ ВЫЗОВ UI: сработает в меню, но не сломает триггер
    try {
      SpreadsheetApp.getUi().alert(resultMessage);
    } catch (uiError) {
      Logger.log('UI Alert пропущен (функция запущена триггером): ' + uiError.message);
    }
    
  } catch (e) {
    Logger.log('❌ Критическая ошибка sendTodayTasks: ' + e.message);
    try { SpreadsheetApp.getUi().alert('❌ Ошибка: ' + e.message); } catch (err) {}
  }
}

/**
 * Отправить уведомления о задачах на завтра (БЕЗОПАСНО ДЛЯ ТРИГГЕРОВ)
 */
function sendTomorrowTasks() {
  try {
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
    
    Logger.log('Найдено задач на завтра: ' + tomorrowTasks.length);
    
    let message;
    if (tomorrowTasks.length === 0) {
      message = '✅ <b>На завтра задач нет</b>\n\n📅 ' + tomorrow.toLocaleDateString('ru-RU', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
    } else {
      message = '📋 <b>Задачи на завтра</b>\n📅 ' + tomorrow.toLocaleDateString('ru-RU', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      }) + '\n\n';
      tomorrowTasks.forEach(function(task) {
        message += '📌 <b>' + task.type + '</b>\n' +
                   '   🎯 ' + task.webinarTitle + '\n' +
                   '   👤 ' + (task.owner || 'Не назначен') + '\n\n';
      });
      message += '━━━━━━━━━━━━━━━\nВсего задач: ' + tomorrowTasks.length;
    }
    
    const token = Settings.get('TELEGRAM_BOT_TOKEN');
    if (!token) {
      Logger.log('❌ TELEGRAM_BOT_TOKEN не указан');
      return;
    }
    
    let sentCount = 0;
    let failCount = 0;
    
    const chatId = Settings.get('TELEGRAM_CHAT_ID');
    if (chatId) {
      if (sendMessageToTelegram_(token, chatId, message)) sentCount++; else failCount++;
    }
    
    try {
      const subscribers = getSubscribersList_();
      subscribers.forEach(function(sub) {
        if (sub.chatId !== chatId) {
          if (sendMessageToTelegram_(token, sub.chatId, message)) sentCount++; else failCount++;
          Utilities.sleep(50);
        }
      });
    } catch (e) {
      Logger.log('Лист подписчиков не найден: ' + e.message);
    }
    
    const resultMessage = '✅ Уведомление отправлено\nУспешно: ' + sentCount + '\nОшибок: ' + failCount;
    Logger.log(resultMessage);
    
    try {
      SpreadsheetApp.getUi().alert(resultMessage);
    } catch (uiError) {
      Logger.log('UI Alert пропущен (функция запущена триггером): ' + uiError.message);
    }
    
  } catch (e) {
    Logger.log('❌ Критическая ошибка sendTomorrowTasks: ' + e.message);
    try { SpreadsheetApp.getUi().alert('❌ Ошибка: ' + e.message); } catch (err) {}
  }
}

/**
 * Тестовая рассылка
 */
function testTelegramBroadcast() {
  try {
    const token = Settings.get('TELEGRAM_BOT_TOKEN');
    if (!token) {
      throw new Error('TELEGRAM_BOT_TOKEN не указан');
    }
    
    const message = '🧪 <b>Тестовое сообщение</b>\n\nЕсли вы видите это сообщение - бот работает!';
    
    let sentCount = 0;
    let failCount = 0;
    let totalSubscribers = 0;
    
    const chatId = Settings.get('TELEGRAM_CHAT_ID');
    if (chatId) {
      const sent = sendMessageToTelegram_(token, chatId, message);
      if (sent) sentCount++;
      else failCount++;
    }
    
    try {
      const subscribers = getSubscribersList_();
      totalSubscribers = subscribers.length;
      subscribers.forEach(function(sub) {
        if (sub.chatId !== chatId) {
          const sent = sendMessageToTelegram_(token, sub.chatId, message);
          if (sent) sentCount++;
          else failCount++;
          Utilities.sleep(50);
        }
      });
    } catch (e) {
      Logger.log('Лист подписчиков не найден');
    }
    
    SpreadsheetApp.getUi().alert(
      ' Тестовая рассылка\n\n' +
      'Успешно: ' + sentCount + '\n' +
      'Ошибок: ' + failCount + '\n' +
      'Подписчиков: ' + totalSubscribers
    );
    
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Ошибка: ' + e.message);
  }
}

/**
 * Показать список подписчиков
 */
function showSubscribersList() {
  try {
    const subscribers = getSubscribersList_();
    const chatId = Settings.get('TELEGRAM_CHAT_ID');
    
    let message = '📱 Telegram уведомления\n\n';
    message += 'Chat ID из настроек: ' + (chatId || 'не указан') + '\n\n';
    message += 'Подписчиков: ' + subscribers.length + '\n\n';
    
    if (subscribers.length > 0) {
      subscribers.forEach(function(sub, index) {
        const isMain = (sub.chatId === chatId) ? ' (основной)' : '';
        message += (index + 1) + '. ' + sub.username + isMain + '\n';
      });
    } else {
      message += 'Нет подписчиков.\n\n' +
                 'Чтобы подписаться, напишите боту:\n' +
                 '/subscribe';
    }
    
    SpreadsheetApp.getUi().alert(message);
    
  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ Ошибка: ' + e.message);
  }
}

// ========================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ TELEGRAM
// ========================================================

function sendMessageToTelegram_(token, chatId, text) {
  try {
    const url = 'https://api.telegram.org/bot' + token + '/sendMessage';
    const payload = {
      'chat_id': chatId,
      'text': text,
      'parse_mode': 'HTML'
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
      return false;
    }
    
    return true;
    
  } catch (e) {
    Logger.log('Ошибка sendMessageToTelegram_: ' + e.message);
    return false;
  }
}

function getSubscribersList_() {
  const SHEET_NAME = '📱 Telegram Подписчики';
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    return [];
  }
  
  const data = sheet.getDataRange().getValues();
  const subscribers = [];
  
  for (let i =1; i < data.length; i++) {
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
  
  return subscribers;
}

// ========================================================
// ЗАДАЧИ: ВЫПАДАЮЩИЕ СПИСКИ ОТВЕТСТВЕННЫХ
// ========================================================

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
    
    const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
    let ownerCol = -1;
    
    for (let i = 0; i < headers.length; i++) {
      if (String(headers[i]).trim() === 'Ответственный') {
        ownerCol = i + 1;
        break;
      }
    }
    
    if (ownerCol === -1) {
      throw new Error('Колонка "Ответственный" не найдена');
    }
    
    const lastRow = sheet.getLastRow();
    
    if (lastRow < 2) {
      ui.alert('ℹ️ Лист пустой', 'Сначала создайте задачи через " Пересчитать систему"', ui.ButtonSet.OK);
      return;
    }
    
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(names, true)
      .setAllowInvalid(false)
      .build();
    
    sheet.getRange(2, ownerCol, lastRow - 1, 1).setDataValidation(rule);
    sheet.setColumnWidth(ownerCol, 180);
    
    ui.alert('✅ Готово', 
      'Выпадающий список установлен для ' + (lastRow - 1) + ' задач.\n\n' +
      'Список: ' + names.join(', '), 
      ui.ButtonSet.OK);
    
  } catch (e) {
    ui.alert('❌ Ошибка', e.message, ui.ButtonSet.OK);
  }
}

function syncTaskOwnersFromWebinars() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    'Синхронизация ответственных',
    'Ответственные во всех задачах будут заменены на ответственных из вебинаров.\n\n' +
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
      throw new Error('Не найдены нужные колонки');
    }
    
    let updated = 0;
    
    for (let i = 1; i < data.length; i++) {
      const webinarId = String(data[i][webinarIdCol] || '').trim();
      if (webinarId && webinarMap[webinarId]) {
        sheet.getRange(i + 1, ownerCol + 1).setValue(webinarMap[webinarId]);
        updated++;
      }
    }
    
    ui.alert('✅ Готово', 'Обновлено: ' + updated, ui.ButtonSet.OK);
    
  } catch (e) {
    ui.alert('❌ Ошибка', e.message, ui.ButtonSet.OK);
  }
}

// ========================================================
// ОФОРМЛЕНИЕ
// ========================================================

function formatWebinarsSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(CONFIG.SHEETS.WEBINARS);
  
  if (!sheet) return;
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  let statusCol = -1;
  
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim() === 'Статус') {
      statusCol = i + 1;
      break;
    }
  }
  
  if (statusCol === -1) return;
  
  sheet.setConditionalFormatRules([]);
  const colLetter = getColumnName(statusCol);
  const rule1 = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$' + colLetter + '2="Планируется"')
    .setBackground('#d2e3fc')
    .setRanges([sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn())])
    .build();
  
  const rule2 = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$' + colLetter + '2="Подготовка"')
    .setBackground('#fff2cc')
    .setRanges([sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn())])
    .build();
  
  const rule3 = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$' + colLetter + '2="Проведён"')
    .setBackground('#d9ead3')
    .setRanges([sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn())])
    .build();
  
  const rule4 = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$' + colLetter + '2="Отменён"')
    .setBackground('#f4cccc')
    .setRanges([sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn())])
    .build();
  
  sheet.setConditionalFormatRules([rule1, rule2, rule3, rule4]);
  sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .setBackground('#1a73e8')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 300);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(5, 200);
  sheet.setColumnWidth(6, 120);
  SpreadsheetApp.getUi().alert('✅ Форматирование применено');
}

function getColumnName(colIndex) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let name = '';
  let n = colIndex - 1;
  while (n >= 0) {
    name = letters[n % 26] + name;
    n = Math.floor(n / 26) - 1;
  }
  return name;
}

function updateDashboardUI() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    if (typeof DashboardUI !== 'undefined') {
      DashboardUI.updateDashboard();
      ui.alert('✅ Dashboard обновлён');
      goToDashboard();
    } else {
      updateDashboard();
      ui.alert('✅ Dashboard обновлён');
    }
  } catch (e) {
    ui.alert('❌ Ошибка: ' + e.message);
  }
}

// ========================================================
// АВТОПЕРЕСЧЁТ
// ========================================================

function toggleAutoRecalculate() {
  const current = Settings.getBoolean('AUTO_RECALCULATE');
  const newValue = !current;
  
  Settings.set('AUTO_RECALCULATE', String(newValue));
  
  const message = newValue 
    ? '✅ Автопересчёт ВКЛЮЧЁН\n\nТеперь при изменении вебинаров система будет автоматически пересчитывать задачи.'
    : '⚠️ Автопересчёт ОТКЛЮЧЁН\n\nТеперь пересчёт нужно запускать вручную.';
  SpreadsheetApp.getUi().alert(message);
}

// ========================================================
// АРХИВИРОВАНИЕ
// ========================================================

function archiveWebinars() {
  const ui = SpreadsheetApp.getUi();
  const webinars = DataModel.getWebinars();
  const doneWebinars = webinars.filter(function(w) {
    return w.status === CONFIG.STATUS.DONE;
  });
  
  if (doneWebinars.length === 0) {
    ui.alert('Нет проведённых вебинаров для архивации');
    return;
  }
  
  const response = ui.alert(
    'Архивация вебинаров',
    'Будет архивировано ' + doneWebinars.length + ' вебинаров.\n\nПродолжить?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) return;
  
  const archiveSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(CONFIG.SHEETS.ARCHIVE);
  if (!archiveSheet) {
    ui.alert('❌ Лист "Архив" не найден');
    return;
  }
  
  let archived = 0;
  doneWebinars.forEach(function(w) {
    const row = [w.id, w.title, w.date, w.owner, w.email, w.status, w.notes, new Date()];
    archiveSheet.appendRow(row);
    DataModel.deleteWebinar(w.id);
    archived++;
  });
  ui.alert('✅ Архивировано: ' + archived);
}

function clearArchive() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Очистка архива',
    'Все данные архива будут удалены.\n\nПродолжить?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) return;
  
  const archiveSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(CONFIG.SHEETS.ARCHIVE);
  if (archiveSheet && archiveSheet.getLastRow() > 1) {
    archiveSheet.getRange(2, 1, archiveSheet.getLastRow() - 1, archiveSheet.getLastColumn()).clearContent();
    ui.alert('✅ Архив очищен');
  } else {
    ui.alert('Архив уже пуст');
  }
}

// ========================================================
// КАЛЕНДАРЬ
// ========================================================

function showCalendarCurrentMonth() {
  goToCalendar();
}

function showCalendarNextMonth() {
  goToCalendar();
}

function showCalendarPreviousMonth() {
  goToCalendar();
}

// ========================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ДИАЛОГОВ
// ========================================================

function getResponsiblesList() {
  return Responsibles.getActive();
}

function addResponsibleFromDialog(name, email, position, phone) {
  if (!name || !email) {
    throw new Error('Имя и email обязательны');
  }
  return Responsibles.add(name, email, position, phone);
}

function createWebinar(data) {
  if (!data || !data.title) {
    throw new Error('Название обязательно');
  }
  return DataModel.addWebinar(data);
}

function updateDashboard() {
  try {
    if (typeof Dashboard !== 'undefined') {
      Dashboard.updateDashboard();
    }
    Logger.log('Dashboard обновлён');
  } catch (e) {
    Logger.log('Ошибка обновления Dashboard: ' + e.message);
  }
}
function goToAIReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("🤖 AI");
  if (!sheet) {
    sheet = ss.insertSheet("🤖 AI");
    sheet.appendRow([
      "Дата",
      "Файл",
      "Отчет"
    ]);
  }
  ss.setActiveSheet(sheet);
}
/**
 * Проверить и отправить напоминания о задачах
 * Запускается триггером каждые 15 минут
 */
function checkTaskReminders() {
  Logger.log('=== checkTaskReminders START ===');
  
  try {
    const tasks = DataModel.getTasksWithReminders();
    Logger.log('Найдено задач с напоминаниями: ' + tasks.length);
    
    if (tasks.length === 0) {
      Logger.log('Нет задач для напоминания');
      return;
    }
    
    const token = Settings.get('TELEGRAM_BOT_TOKEN');
    if (!token) {
      Logger.log('❌ TELEGRAM_BOT_TOKEN не указан');
      return;
    }
    
    tasks.forEach(function(task) {
      const message = 
        '⏰ <b>Напоминание о задаче</b>\n\n' +
        '📌 <b>' + task.type + '</b>\n' +
        (task.webinarTitle ? ' ' + task.webinarTitle + '\n' : '') +
        '📅 ' + task.plannedDate.toLocaleDateString('ru-RU') + ' в ' + task.reminderTime + '\n' +
        '👤 ' + (task.owner || 'Не назначен') + '\n\n' +
        '━━━━━━━━━━━━━━━\n' +
        'Не забудьте выполнить задачу!';
      
      // Отправляем основному Chat ID
      const chatId = Settings.get('TELEGRAM_CHAT_ID');
      if (chatId) {
        sendMessageToTelegram_(token, chatId, message);
      }
      
      // Отправляем всем подписчикам
      try {
        const subscribers = getSubscribersList_();
        subscribers.forEach(function(sub) {
          if (sub.chatId !== chatId) {
            sendMessageToTelegram_(token, sub.chatId, message);
            Utilities.sleep(50);
          }
        });
      } catch (e) {
        Logger.log('Лист подписчиков не найден: ' + e.message);
      }
      
      Logger.log('✅ Напоминание отправлено: ' + task.type);
    });
    
  } catch (e) {
    Logger.log('❌ Ошибка checkTaskReminders: ' + e.message);
  }
  
  Logger.log('=== checkTaskReminders END ===');
}

/**
 * Обновить время напоминания для задачи
 */
function apiUpdateTaskReminderTime(taskId, reminderTime) {
  try {
    Logger.log('apiUpdateTaskReminderTime: taskId=' + taskId + ', time=' + reminderTime);
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.TASKS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    let idCol = -1, reminderCol = -1;
    
    for (let i = 0; i < headers.length; i++) {
      if (String(headers[i]).trim() === 'ID') idCol = i;
      if (String(headers[i]).trim() === 'Время напоминания') reminderCol = i;
    }
    
    if (idCol === -1) {
      throw new Error('Колонка ID не найдена');
    }
    
    if (reminderCol === -1) {
      // Добавляем колонку если её нет
      reminderCol = headers.length;
      sheet.getRange(1, reminderCol + 1).setValue('Время напоминания');
      Logger.log('Колонка "Время напоминания" добавлена');
    }
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]).trim() === String(taskId).trim()) {
        sheet.getRange(i + 1, reminderCol + 1).setValue(reminderTime);
        Logger.log('✅ Время напоминания обновлено');
        return { success: true };
      }
    }
    
    throw new Error('Задача не найдена');
  } catch (e) {
    Logger.log('apiUpdateTaskReminderTime error: ' + e.message);
    return { error: e.message };
  }
}

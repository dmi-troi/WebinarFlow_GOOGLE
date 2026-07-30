/**
 * ==========================================================
 * WebinarFlow v2.0
 * AutoRecalculate.gs
 * Автоматический пересчёт при изменении вебинаров
 * ==========================================================
 */

// Глобальная переменная для хранения таймера
var recalculateTimer = null;

/**
 * Триггер onEdit - срабатывает при любом изменении в таблице
 */
function onEdit(e) {
  // Проверяем что автопересчёт включён
  if (!Settings.getBoolean('AUTO_RECALCULATE')) {
    return;
  }
  
  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();
  
  // Реагируем только на изменения в листе "Вебинары"
  if (sheetName !== CONFIG.SHEETS.WEBINARS) {
    return;
  }
  
  const range = e.range;
  const row = range.getRow();
  const col = range.getColumn();
  
  // Пропускаем заголовок (1-я строка)
  if (row === 1) {
    return;
  }
  
  // Проверяем что изменилась важная колонка
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const changedHeader = String(headers[col - 1] || '').trim();
  
  // Важные колонки для пересчёта
  const importantColumns = ['Название', 'Дата', 'Ответственный', 'Email', 'Статус'];
  
  if (importantColumns.indexOf(changedHeader) === -1) {
    return; // Изменение неважной колонки - игнорируем
  }
  
  Logger.log('Изменена важная колонка: ' + changedHeader + ' в строке ' + row);
  
  // Запускаем пересчёт с задержкой 5 секунд
  // Это нужно чтобы не срабатывать на каждое изменение ячейки
  // если пользователь редактирует несколько ячеек подряд
  scheduleRecalculate_();
}

/**
 * Планирует пересчёт с задержкой
 */
function scheduleRecalculate_() {
  // Отменяем предыдущий таймер если есть
  if (recalculateTimer) {
    ScriptApp.deleteTrigger(recalculateTimer);
  }
  
  // Создаём новый триггер который сработает через 5 секунд
  recalculateTimer = ScriptApp.newTrigger('executeRecalculate_')
    .timeBased()
    .after(5000) // 5 секунд
    .create();
  
  Logger.log('Запланирован пересчёт через 5 секунд');
}

/**
 * Выполняет пересчёт (вызывается триггером)
 */
function executeRecalculate_() {
  try {
    Logger.log('=== Автопересчёт START ===');
    
    // 1. Пересчитываем задачи
    Planner.planAllWebinars();
    
    // 2. Синхронизируем календарь если включено
    if (Settings.getBoolean('AUTO_SYNC_CALENDAR')) {
      Logger.log('Синхронизация календаря...');
      CalendarSync.syncCalendar();
    }
    
    // 3. Обновляем Dashboard если включено
    if (Settings.getBoolean('DASHBOARD_AUTO_UPDATE')) {
      Logger.log('Обновление Dashboard...');
      Dashboard.updateDashboard();
    }
    
    Logger.log('=== Автопересчёт END ===');
    
  } catch (error) {
    Logger.log('❌ Ошибка автопересчёта: ' + error.message);
    Logger.log(error.stack);
  }
  
  // Очищаем таймер
  recalculateTimer = null;
}

/**
 * Ручное включение/отключение автопересчёта
 */
function toggleAutoRecalculate() {
  const current = Settings.getBoolean('AUTO_RECALCULATE');
  const newValue = !current;
  
  Settings.set('AUTO_RECALCULATE', String(newValue));
  
  const message = newValue 
    ? '✅ Автопересчёт ВКЛЮЧЁН\n\nТеперь при изменении вебинаров система будет автоматически пересчитывать задачи.'
    : '️ Автопересчёт ОТКЛЮЧЁН\n\nТеперь пересчёт нужно запускать вручную через меню "🔄 Пересчитать систему".';
  
  SpreadsheetApp.getUi().alert(message);
  
  Logger.log('Автопересчёт: ' + (newValue ? 'включён' : 'отключён'));
}

/**
 * Проверка статуса автопересчёта
 */
function checkAutoRecalculateStatus() {
  const enabled = Settings.getBoolean('AUTO_RECALCULATE');
  const syncCalendar = Settings.getBoolean('AUTO_SYNC_CALENDAR');
  const updateDashboard = Settings.getBoolean('DASHBOARD_AUTO_UPDATE');
  
  const message = ' Статус автопересчёта:\n\n' +
    'Автопересчёт: ' + (enabled ? '✅ Включён' : '❌ Отключён') + '\n' +
    'Синхронизация календаря: ' + (syncCalendar ? '✅ Включена' : ' Отключена') + '\n' +
    'Обновление Dashboard: ' + (updateDashboard ? '✅ Включено' : '❌ Отключено') + '\n\n' +
    'Для изменения используйте меню ⚙ Настройки или "🔄 Переключить автопересчёт"';
  
  SpreadsheetApp.getUi().alert(message);
}

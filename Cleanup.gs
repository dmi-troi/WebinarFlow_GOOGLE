/**
 * ==========================================================
 * WebinarFlow v2.0
 * Cleanup.gs
 * Очистка orphaned данных (события без вебинаров)
 * ==========================================================
 */

/**
 * Удаляет события из календаря, которые не связаны с существующими задачами
 */
function cleanupOrphanedCalendarEvents() {
  Logger.log('=== cleanupOrphanedCalendarEvents START ===');
  
  // Получаем все текущие задачи
  const tasks = DataModel.getTasks();
  const validEventIds = {};
  
  tasks.forEach(function(task) {
    if (task.eventId) {
      validEventIds[task.eventId] = true;
    }
  });
  
  Logger.log('Активных EventID в задачах: ' + Object.keys(validEventIds).length);
  
  // Получаем календарь
  var calendar;
  try {
    if (CONFIG.CALENDAR.ID) {
      calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR.ID);
    } else {
      calendar = CalendarApp.getDefaultCalendar();
    }
  } catch (e) {
    throw new Error('Не удалось получить доступ к календарю: ' + e.message);
  }
  
  // Получаем все события за последние 30 дней и следующие 90 дней
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90);
  
  Logger.log('Ищем события с ' + startDate + ' по ' + endDate);
  
  const events = calendar.getEvents(startDate, endDate);
  Logger.log('Всего событий найдено: ' + events.length);
  
  let deletedCount = 0;
  let skippedCount = 0;
  
  // Проверяем каждое событие
  events.forEach(function(event) {
    const eventId = event.getId();
    const eventTitle = event.getTitle();
    
    // Проверяем, есть ли это событие в активных задачах
    if (!validEventIds[eventId]) {
      // Это orphaned событие — удаляем
      try {
        event.deleteEvent();
        deletedCount++;
        Logger.log('✅ Удалено orphaned событие: ' + eventTitle + ' (' + eventId + ')');
      } catch (e) {
        Logger.log('❌ Не удалось удалить: ' + eventTitle + ' - ' + e.message);
      }
    } else {
      skippedCount++;
      Logger.log('⏭️ Пропущено (активное): ' + eventTitle);
    }
  });
  
  Logger.log('=== cleanupOrphanedCalendarEvents END ===');
  Logger.log('Удалено orphaned событий: ' + deletedCount);
  Logger.log('Пропущено активных событий: ' + skippedCount);
  
  return {
    deleted: deletedCount,
    skipped: skippedCount
  };
}

/**
 * Полная очистка календаря (УДАЛЯЕТ ВСЕ события в диапазоне дат)
 * ⚠️ ОПАСНАЯ ФУНКЦИЯ — используйте с осторожностью!
 */
function clearAllCalendarEvents() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    '⚠️ ВНИМАНИЕ: Полная очистка календаря',
    'Это удалит ВСЕ события из календаря за выбранный период.\n\nЭто действие НЕЛЬЗЯ отменить!\n\nПродолжить?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    return;
  }
  
  // Получаем календарь
  var calendar;
  try {
    if (CONFIG.CALENDAR.ID) {
      calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR.ID);
    } else {
      calendar = CalendarApp.getDefaultCalendar();
    }
  } catch (e) {
    ui.alert('Ошибка', 'Не удалось получить доступ к календарю: ' + e.message, ui.ButtonSet.OK);
    return;
  }
  
  // Диапазон: последние 30 дней + следующие 90 дней
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90);
  
  const events = calendar.getEvents(startDate, endDate);
  
  if (events.length === 0) {
    ui.alert('ℹ️ Календарь уже пуст', 'Событий не найдено в выбранном диапазоне.', ui.ButtonSet.OK);
    return;
  }
  
  ui.alert('Найдено событий: ' + events.length, 'Начинаю удаление...', ui.ButtonSet.OK);
  
  let deletedCount = 0;
  
  events.forEach(function(event) {
    try {
      event.deleteEvent();
      deletedCount++;
    } catch (e) {
      Logger.log('Не удалось удалить: ' + event.getTitle());
    }
  });
  
  ui.alert('✅ Готово', 'Удалено событий: ' + deletedCount, ui.ButtonSet.OK);
}

/**
 * Очистка календаря по названию (удаляет события содержащие определённый текст)
 */
function cleanupCalendarByTitle() {
  const ui = SpreadsheetApp.getUi();
  
  // Спрашиваем текст для поиска
  const searchResult = ui.prompt(
    'Очистка событий по названию',
    'Введите текст для поиска в названиях событий (например: "Юнисендер" или "МТС"):\n\nОставьте пустым для удаления ВСЕХ событий WebinarFlow',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (searchResult.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  
  const searchText = searchResult.getResponseText().trim();
  
  // Получаем календарь
  var calendar;
  try {
    if (CONFIG.CALENDAR.ID) {
      calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR.ID);
    } else {
      calendar = CalendarApp.getDefaultCalendar();
    }
  } catch (e) {
    ui.alert('Ошибка', 'Не удалось получить доступ к календарю: ' + e.message, ui.ButtonSet.OK);
    return;
  }
  
  // Диапазон дат
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 90);
  
  const events = calendar.getEvents(startDate, endDate);
  
  let deletedCount = 0;
  
  events.forEach(function(event) {
    const title = event.getTitle();
    
    // Если searchText пустой — удаляем события WebinarFlow
    // Иначе — удаляем события содержащие searchText
    const shouldDelete = searchText === '' 
      ? (title.indexOf('Юнисендер') !== -1 || 
         title.indexOf('МТС Link') !== -1 || 
         title.indexOf('Напоминание') !== -1 ||
         title.indexOf('День мероприятия') !== -1)
      : title.indexOf(searchText) !== -1;
    
    if (shouldDelete) {
      try {
        event.deleteEvent();
        deletedCount++;
        Logger.log('✅ Удалено: ' + title);
      } catch (e) {
        Logger.log('❌ Не удалось удалить: ' + title);
      }
    }
  });
  
  ui.alert('✅ Готово', 'Удалено событий: ' + deletedCount, ui.ButtonSet.OK);
}

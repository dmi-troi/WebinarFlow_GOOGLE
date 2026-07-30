/**
 * ==========================================================
 * WebinarFlow v2.0
 * Calendar.gs
 * Синхронизация с календарем (использует глобальный CONFIG)
 * ==========================================================
 */

const CalendarSync = (function () {
  function syncCalendar() {
    Logger.log('Синхронизация...');
    const tasks = DataModel.getTasks();
    if (!tasks || tasks.length === 0) return;

    const calendar = getCalendar_();
    let created = 0, updated = 0, deleted = 0;

    tasks.forEach(task => {
      try {
        const result = processTask_(task, calendar);
        if (result === 'created') created++;
        else if (result === 'updated') updated++;
        else if (result === 'deleted') deleted++;
      } catch (e) {
        Logger.log(`Ошибка задачи "${task.type}": ${e.message}`);
      }
    });
    Logger.log(`Готово. Создано: ${created}, обновлено: ${updated}, удалено: ${deleted}`);
  }

  function processTask_(task, calendar) {
    const isCanceled = (task.status === CONFIG.TASK_STATUS.CANCELLED || task.status === CONFIG.TASK_STATUS.DONE);

    if (isCanceled) {
      if (task.eventId) {
        deleteEvent_(calendar, task.eventId);
        DataModel.updateTaskEventId(task.id, '');
        return 'deleted';
      }
      return 'skipped';
    }

    if (!task.eventId) {
      const eventId = createEvent_(calendar, task);
      if (eventId) {
        DataModel.updateTaskEventId(task.id, eventId);
        return 'created';
      }
      return 'skipped';
    }

    if (checkNeedsUpdate_(calendar, task)) {
      updateEvent_(calendar, task);
      return 'updated';
    }
    return 'skipped';
  }

  function createEvent_(calendar, task) {
    if (!task.plannedDate) return null;
    const date = DataModel.normalizeDate(task.plannedDate);
    const title = `${task.type}: ${task.webinarTitle}`;
    const desc = `Вебинар: ${task.webinarTitle}\nТип: ${task.type}\nОтветственный: ${task.owner}\nEmail: ${task.email}`;
    
    const event = calendar.createAllDayEvent(title, date, { description: desc });
    setEventColor_(event, task.type);
    return event.getId();
  }

  function checkNeedsUpdate_(calendar, task) {
    try {
      const event = calendar.getEventById(task.eventId);
      if (!event) return true;
      const currentStart = event.getAllDayStartDate();
      const expectedStart = DataModel.normalizeDate(task.plannedDate);
      return DataModel.formatDateKey(currentStart) !== DataModel.formatDateKey(expectedStart) || 
             event.getTitle() !== `${task.type}: ${task.webinarTitle}`;
    } catch (e) { return true; }
  }

  function updateEvent_(calendar, task) {
    try {
      const event = calendar.getEventById(task.eventId);
      if (!event) {
        const newId = createEvent_(calendar, task);
        if (newId) DataModel.updateTaskEventId(task.id, newId);
        return;
      }
      const date = DataModel.normalizeDate(task.plannedDate);
      event.setAllDayDate(date);
      event.setTitle(`${task.type}: ${task.webinarTitle}`);
      setEventColor_(event, task.type);
    } catch (e) { Logger.log(e.message); }
  }

  function deleteEvent_(calendar, eventId) {
    try {
      const event = calendar.getEventById(eventId);
      if (event) event.deleteEvent();
    } catch (e) { Logger.log(e.message); }
  }

  function getCalendar_() {
    if (CONFIG.CALENDAR.ID) return CalendarApp.getCalendarById(CONFIG.CALENDAR.ID);
    return CalendarApp.getDefaultCalendar();
  }

  function setEventColor_(event, type) {
    const colorId = CONFIG.CALENDAR.COLORS[type];
    if (colorId) {
      try { event.setColor(colorId); } catch (e) {}
    }
  }

  return { syncCalendar };
})();

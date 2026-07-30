/**
 * ==========================================================
 * WebinarFlow v2.0
 * Planner.gs
 * Логика планирования задач
 * ==========================================================
 */

const Planner = (function () {

  function getRules_() {
    try {
      const typeUnisender = Settings.get('TASK_TYPE_UNISENDER') || 'Юнисендер';
      const typeMtslink = Settings.get('TASK_TYPE_MTSLINK') || 'МТС Link';
      const typeReminder = Settings.get('TASK_TYPE_REMINDER') || 'Напоминание';
      const typeEvent = Settings.get('TASK_TYPE_EVENT') || 'День мероприятия';
      return [
        { type: typeUnisender, daysBefore: Settings.getNumber('DAYS_BEFORE_UNISENDER') || 14 },
        { type: typeMtslink, daysBefore: Settings.getNumber('DAYS_BEFORE_MTSLINK') || 7 },
        { type: typeReminder, daysBefore: Settings.getNumber('DAYS_BEFORE_REMINDER') || 3 },
        { type: typeEvent, daysBefore: Settings.getNumber('DAYS_BEFORE_EVENT') || 0 }
      ];
    } catch (e) {
      Logger.log('Planner: Settings недоступен, используются значения по умолчанию');
      return [
        { type: 'Юнисендер', daysBefore: 14 },
        { type: 'МТС Link', daysBefore: 7 },
        { type: 'Напоминание', daysBefore: 3 },
        { type: 'День мероприятия', daysBefore: 0 }
      ];
    }
  }

  function planAllWebinars() {
    Logger.log('=== planAllWebinars START ===');
    const webinars = DataModel.getWebinars();
    Logger.log('Вебинаров найдено: ' + webinars.length);
    if (!webinars || webinars.length === 0) {
      Logger.log('Нет вебинаров для планирования.');
      DataModel.replaceAllTasks([]);
      CalendarView.updateCalendarView();
      Logger.log('=== planAllWebinars END (empty) ===');
      return;
    }
    const newTasks = [];
    webinars.forEach(function (webinar) {
      if (webinar.status === CONFIG.STATUS.CANCELLED || webinar.status === CONFIG.STATUS.DONE) {
        Logger.log('Пропущен вебинар (статус): ' + webinar.title);
        return;
      }
      if (!webinar.date) {
        Logger.log('Пропущен вебинар (нет даты): ' + webinar.title);
        return;
      }
      if (!webinar.id) {
        Logger.log('⚠️ Вебинар без ID: ' + webinar.title);
      }
      var tasks = calculateWebinarTasks_(webinar);
      Logger.log('Вебинар "' + webinar.title + '": ' + tasks.length + ' задач');
      for (var i = 0; i < tasks.length; i++) {
        newTasks.push(tasks[i]);
      }
    });
    Logger.log('Всего задач: ' + newTasks.length);
    DataModel.replaceAllTasks(newTasks);
    CalendarView.updateCalendarView();
    Logger.log('=== planAllWebinars END ===');
  }

  function calculateWebinarTasks_(webinar) {
    var eventDate = DataModel.normalizeDate(webinar.date);
    if (!eventDate) return [];
    var localOccupied = {};
    var tasks = [];
    var rules = getRules_();
    rules.forEach(function (rule) {
      var targetDate = new Date(eventDate);
      targetDate.setDate(targetDate.getDate() - rule.daysBefore);
      Logger.log('  Задача "' + rule.type + '": исходная дата ' + formatDateForLog_(targetDate));
      targetDate = findFreeWorkingDay_(targetDate, localOccupied);
      Logger.log('  Задача "' + rule.type + '": итоговая дата ' + formatDateForLog_(targetDate));
      var dateKey = DataModel.formatDateKey(targetDate);
      localOccupied[dateKey] = (localOccupied[dateKey] || 0) + 1;
      tasks.push({
        id: Utilities.getUuid(),
        webinarId: webinar.id,
        webinarTitle: webinar.title,
        type: rule.type,
        plannedDate: targetDate,
        owner: webinar.owner,
        email: webinar.email,
        status: CONFIG.TASK_STATUS.PLANNED,
        eventId: ''
      });
    });
    return tasks;
  }

  function findFreeWorkingDay_(date, occupiedDates) {
    var d = DataModel.normalizeDate(date);
    if (!d) return date;
    var shiftDirection = Settings.get('SHIFT_DIRECTION') || 'backward';
    var shiftWeekends = Settings.getBoolean('SHIFT_WEEKENDS');
    var shiftHolidays = Settings.getBoolean('SHIFT_HOLIDAYS');
    var maxShiftDays = Settings.getNumber('MAX_SHIFT_DAYS') || 14;
    var iterations = 0;
    while (iterations < maxShiftDays) {
      var dateKey = DataModel.formatDateKey(d);
      var dayOfWeek = d.getDay();
      var isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
      var isHoliday = DataModel.isHoliday(d);
      var isOccupied = (occupiedDates[dateKey] || 0) >= 1;
      var shouldShift = false;
      if (shiftWeekends && isWeekend) shouldShift = true;
      if (shiftHolidays && isHoliday) shouldShift = true;
      if (isOccupied) shouldShift = true;
      if (!shouldShift) {
        return d;
      }
      if (shiftDirection === 'forward') {
        d.setDate(d.getDate() + 1);
      } else {
        d.setDate(d.getDate() - 1);
      }
      iterations++;
    }
    Logger.log('findFreeWorkingDay: превышен лимит итераций для даты ' + date);
    return DataModel.normalizeDate(date);
  }

  function formatDateForLog_(date) {
    var d = new Date(date);
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    var dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return day + '.' + month + '.' + year + ' (' + dayNames[d.getDay()] + ')';
  }

  return {
    planAllWebinars: planAllWebinars
  };
})();

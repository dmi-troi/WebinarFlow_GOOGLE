/**
 * ==========================================================
 * WebinarFlow v2.0
 * Config.gs
 * Глобальная конфигурация
 * ==========================================================
 */

const CONFIG = {
  // Названия листов
  SHEETS: {
    WEBINARS: '📅 Вебинары',
    TASKS: '📨 Задачи',
    CALENDAR: '📅 Календарь',
    HOLIDAYS: '🎉 Праздники',
    SETTINGS: '⚙ Настройки',
    RESPONSIBLES: '👥 Ответственные',
    DASHBOARD: '📊 Dashboard',
    ARCHIVE: '📦 Архив',
    LOG: '📝 Журнал'
  },

  // Статусы вебинаров
  STATUS: {
    PLANNED: 'Планируется',
    ACTIVE: 'Активен',
    DONE: 'Проведён',
    CANCELLED: 'Отменён'
  },

  // Статусы задач
  TASK_STATUS: {
    PLANNED: 'Запланировано',
    DONE: 'Выполнено',
    CANCELLED: 'Отменено'
  },

  // Типы задач
  TASK_TYPES: {
    UNISENDER: 'Юнисендер',
    MTSLINK: 'МТС Link',
    REMINDER: 'Напоминание',
    EVENT: 'День мероприятия'
  },

  // Настройки календаря
  CALENDAR: {
    ID: '', // ID Google Calendar (оставьте пустым, чтобы использовать по умолчанию)
    COLORS: {
      'Юнисендер': CalendarApp.EventColor.GREEN,
      'МТС Link': CalendarApp.EventColor.YELLOW,
      'Напоминание': CalendarApp.EventColor.RED,
      'День мероприятия': CalendarApp.EventColor.BLUE
    }
  },

  // Настройки планирования
  PLANNING: {
    SHIFT_DIRECTION: 'backward', // 'backward' или 'forward'
    MAX_SHIFT_DAYS: 14,
    HOLIDAYS_AFFECT_SHIFT: true,
    WEEKENDS_AFFECT_SHIFT: true
  }
}

/**
 * Инициализация CONFIG из настроек (вызывается при загрузке)
 */
function initConfigFromSettings() {
  try {
    if (typeof Settings !== 'undefined') {
      const typeUnisender = Settings.get('TASK_TYPE_UNISENDER');
      const typeMtslink = Settings.get('TASK_TYPE_MTSLINK');
      const typeReminder = Settings.get('TASK_TYPE_REMINDER');
      const typeEvent = Settings.get('TASK_TYPE_EVENT');
      
      if (typeUnisender) CONFIG.TASK_TYPES.UNISENDER = typeUnisender;
      if (typeMtslink) CONFIG.TASK_TYPES.MTSLINK = typeMtslink;
      if (typeReminder) CONFIG.TASK_TYPES.REMINDER = typeReminder;
      if (typeEvent) CONFIG.TASK_TYPES.EVENT = typeEvent;
      
      Logger.log('CONFIG инициализирован из Settings');
    }
  } catch (e) {
    Logger.log('initConfigFromSettings: ' + e.message);
  }
}

/**
 * ==========================================================
 * WebinarFlow v2.0
 * Settings.gs
 * Управление настройками системы
 * ==========================================================
 */

const Settings = (function () {

  const DEFAULT_SETTINGS = {
    // ========================================================
    // TELEGRAM
    // ========================================================
    'TELEGRAM_ENABLED': { value: 'true', description: '[✅] Включить Telegram-уведомления (true/false)' },
    'TELEGRAM_BOT_TOKEN': { value: '', description: '[✅] Токен бота Telegram' },
    'TELEGRAM_CHAT_ID': { value: '', description: '[✅] Chat ID для уведомлений' },
    'TELEGRAM_NOTIFICATION_TIME': { value: '9', description: '[⚠️] Час отправки (0-23). Триггер настраивается вручную' },
    'TEMPLATE_TELEGRAM_TASK': { value: '📌 {type}\n    {webinarTitle}\n   👤 {owner}\n   📆 {date}', description: '[📋] Шаблон Telegram-уведомления (в разработке)' },
    'TEMPLATE_TELEGRAM_DAILY': { value: ' <b>Задачи на {date}</b>\n\n{tasks}', description: '[📋] Шаблон ежедневной сводки (в разработке)' },

    // ========================================================
    // EMAIL
    // ========================================================
    'EMAIL_ENABLED': { value: 'false', description: '[📋] Включить email-уведомления (в разработке)' },
    'EMAIL_SMTP_HOST': { value: 'smtp.gmail.com', description: '[📋] SMTP сервер (в разработке)' },
    'EMAIL_SMTP_PORT': { value: '587', description: '[📋] Порт SMTP (в разработке)' },
    'EMAIL_USERNAME': { value: '', description: '[📋] Логин SMTP (в разработке)' },
    'EMAIL_PASSWORD': { value: '', description: '[📋] Пароль SMTP (в разработке)' },
    'EMAIL_FROM': { value: '', description: '[📋] Email отправителя (в разработке)' },
    'EMAIL_TEMPLATE_TASK': { value: 'Новая задача: {type}\nВебинар: {webinarTitle}\nДата: {date}\nОтветственный: {owner}', description: '[📋] Шаблон email о задаче (в разработке)' },
    'EMAIL_TEMPLATE_REMINDER': { value: 'Напоминание: {type}\nВебинар: {webinarTitle}\nДата: {date}', description: '[] Шаблон напоминания (в разработке)' },

    // ========================================================
    // РАСЧЁТ ДАТ РАССЫЛОК
    // ========================================================
    'DAYS_BEFORE_UNISENDER': { value: '14', description: '[✅] Дней до вебинара для Юнисендер' },
    'DAYS_BEFORE_MTSLINK': { value: '7', description: '[✅] Дней до вебинара для МТС Link' },
    'DAYS_BEFORE_REMINDER': { value: '3', description: '[✅] Дней до вебинара для напоминания' },
    'DAYS_BEFORE_EVENT': { value: '0', description: '[✅] Дней до вебинара для дня мероприятия' },

    // ========================================================
    // НАЗВАНИЯ ТИПОВ ЗАДАЧ
    // ========================================================
    'TASK_TYPE_UNISENDER': { value: 'Юнисендер', description: '[✅] Название первого типа задачи' },
    'TASK_TYPE_MTSLINK': { value: 'МТС Link', description: '[✅] Название второго типа задачи' },
    'TASK_TYPE_REMINDER': { value: 'Напоминание', description: '[✅] Название третьего типа задачи' },
    'TASK_TYPE_EVENT': { value: 'День мероприятия', description: '[✅] Название четвёртого типа задачи' },

    // ========================================================
    // ПРАВИЛА ПЕРЕНОСА ДАТ
    // ========================================================
    'SHIFT_DIRECTION': { value: 'backward', description: '[✅] Направление переноса (backward/forward)' },
    'SHIFT_WEEKENDS': { value: 'true', description: '[✅] Переносить выходные (true/false)' },
    'SHIFT_HOLIDAYS': { value: 'true', description: '[✅] Переносить праздники (true/false)' },
    'MAX_SHIFT_DAYS': { value: '14', description: '[✅] Максимальный сдвиг в днях' },
    'WORK_DAYS_ONLY': { value: 'true', description: '[⚠️] Только рабочие дни (в разработке)' },

    // ========================================================
    // АВТОМАТИЗАЦИЯ
    // ========================================================
    'AUTO_RECALCULATE': { value: 'false', description: '[✅] Автопересчёт при добавлении вебинара (true/false)' },
    'AUTO_SYNC_CALENDAR': { value: 'true', description: '[✅] Автосинхронизация календаря (true/false)' },
    'AUTO_ARCHIVE_DAYS': { value: '30', description: '[📋] Через сколько дней архивировать (в разработке)' },
    'AUTO_ARCHIVE_ENABLED': { value: 'false', description: '[] Автоматическая архивация (в разработке)' },
    'AUTO_CLEANUP_ORPHANED': { value: 'false', description: '[] Автоочистка orphaned событий (в разработке)' },

    // ========================================================
    // УВЕДОМЛЕНИЯ
    // ========================================================
    'NOTIFY_HOURS_BEFORE': { value: '24', description: '[📋] За сколько часов напоминать (в разработке)' },
    'NOTIFY_RESPONSIBLE': { value: 'true', description: '[📋] Уведомлять ответственного (в разработке)' },
    'NOTIFY_OWNER': { value: 'true', description: '[] Уведомлять владельца вебинара (в разработке)' },
    'NOTIFY_TELEGRAM': { value: 'true', description: '[] Telegram-уведомления (в разработке)' },
    'NOTIFY_EMAIL': { value: 'false', description: '[📋] Email-уведомления (в разработке)' },
    'NOTIFY_DAILY_SUMMARY': { value: 'true', description: '[📋] Ежедневная сводка (в разработке)' },
    'NOTIFY_WEEKLY_REPORT': { value: 'false', description: '[📋] Еженедельный отчёт (в разработке)' },

    // ========================================================
    // ОТЧЁТЫ И СТАТИСТИКА
    // ========================================================
    'REPORT_FREQUENCY': { value: 'weekly', description: '[📋] Частота отчётов (в разработке)' },
    'REPORT_RECIPIENTS': { value: '', description: '[📋] Email получателей отчётов (в разработке)' },
    'DASHBOARD_AUTO_UPDATE': { value: 'true', description: '[] Автообновление Dashboard (в разработке)' },
    'EXPORT_FORMAT': { value: 'csv', description: '[📋] Формат экспорта (в разработке)' },

    // ========================================================
    // ОФОРМЛЕНИЕ
    // ========================================================
    'COLOR_UNISENDER': { value: '#90ee90', description: '[] Цвет для Юнисендер (в разработке)' },
    'COLOR_MTSLINK': { value: '#fffacd', description: '[📋] Цвет для МТС Link (в разработке)' },
    'COLOR_REMINDER': { value: '#ffd700', description: '[📋] Цвет для напоминания (в разработке)' },
    'COLOR_EVENT': { value: '#ff6b6b', description: '[📋] Цвет для дня мероприятия (в разработке)' },
    'THEME': { value: 'light', description: '[📋] Тема оформления (в разработке)' },

    // ========================================================
    // БЕЗОПАСНОСТЬ И ДОСТУП
    // ========================================================
    'ALLOW_EDIT': { value: 'all', description: '[📋] Кто может редактировать (в разработке)' },
    'ALLOW_DELETE': { value: 'all', description: '[📋] Кто может удалять (в разработке)' },
    'LOG_LEVEL': { value: 'info', description: '[📋] Уровень логирования (в разработке)' },
    'BACKUP_ENABLED': { value: 'false', description: '[✅] Авто резервное копирование (true/false)' },
    'BACKUP_FREQUENCY': { value: 'daily', description: '[📋] Частота бэкапов (в разработке)' },

    // ========================================================
    // ИНТЕГРАЦИИ
    // ========================================================
    'UNISENDER_API_KEY': { value: '', description: '[📋] API ключ Юнисендер (в разработке)' },
    'UNISENDER_LIST_ID': { value: '', description: '[📋] ID списка рассылки Юнисендер (в разработке)' },
    'MTSLINK_API_KEY': { value: '', description: '[] API ключ МТС Link (в разработке)' },
    'ZOOM_API_KEY': { value: '', description: '[📋] API ключ Zoom (в разработке)' },
    'GOOGLE_MEET_ENABLED': { value: 'true', description: '[📋] Использовать Google Meet (в разработке)' },

    // ========================================================
    // ПРАЗДНИКИ
    // ========================================================
    'HOLIDAYS_COUNTRY': { value: 'RU', description: '[📋] Страна для автозагрузки праздников (в разработке)' },
    'HOLIDAYS_AUTO_IMPORT': { value: 'false', description: '[📋] Автоимпорт праздников (в разработке)' },
    'HOLIDAYS_INCLUDE_WEEKENDS': { value: 'false', description: '[📋] Включать выходные в праздники (в разработке)' },

    // ========================================================
    // ОТВЕТСТВЕННЫЕ ПО УМОЛЧАНИЮ
    // ========================================================
    'DEFAULT_OWNER': { value: '', description: '[📋] Ответственный по умолчанию (в разработке)' },
    'DEFAULT_EMAIL': { value: '', description: '[📋] Email по умолчанию (в разработке)' },
    'AUTO_ASSIGN_OWNER': { value: 'false', description: '[📋] Автоназначение ответственного (в разработке)' },

    // ========================================================
    // РАБОЧЕЕ ВРЕМЯ
    // ========================================================
    'WORK_DAY_START': { value: '9', description: '[] Начало рабочего дня (в разработке)' },
    'WORK_DAY_END': { value: '18', description: '[📋] Конец рабочего дня (в разработке)' },
    'TIMEZONE': { value: 'Europe/Moscow', description: '[✅] Часовой пояс' },
    'DATE_FORMAT': { value: 'dd.mm.yyyy', description: '[✅] Формат даты' },
    'LANGUAGE': { value: 'ru', description: '[] Язык интерфейса (в разработке)' }
  };

  function getSheet_() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(CONFIG.SHEETS.SETTINGS);
    
    if (!sheet) {
      throw new Error('Лист "' + CONFIG.SHEETS.SETTINGS + '" не найден');
    }
    return sheet;
  }

  function initializeDefaults_() {
    const sheet = getSheet_();
    
    if (sheet.getLastRow() > 1) return;
    
    sheet.getRange(1, 1, 1, 3).setValues([['Параметр', 'Значение', 'Описание']]);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
    
    const data = [];
    for (const key in DEFAULT_SETTINGS) {
      data.push([key, DEFAULT_SETTINGS[key].value, DEFAULT_SETTINGS[key].description]);
    }
    
    if (data.length > 0) {
      sheet.getRange(2, 1, data.length, 3).setValues(data);
    }
    
    sheet.setColumnWidth(1, 250);
    sheet.setColumnWidth(2, 150);
    sheet.setColumnWidth(3, 450);
    
    sheet.setFrozenRows(1);
  }

  function getAll() {
    initializeDefaults_();
    
    const sheet = getSheet_();
    const values = sheet.getDataRange().getValues();
    const settings = {};
    
    for (let i = 1; i < values.length; i++) {
      const key = String(values[i][0] || '').trim();
      const value = String(values[i][1] || '').trim();
      const description = String(values[i][2] || '').trim();
      
      if (key) {
        settings[key] = {
          value: value,
          description: description
        };
      }
    }
    
    return settings;
  }

  function get(key) {
    const settings = getAll();
    return settings[key] ? settings[key].value : '';
  }

  function getBoolean(key) {
    const value = get(key).toLowerCase();
    return value === 'true' || value === '1' || value === 'yes';
  }

  function getNumber(key) {
    const value = get(key);
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  function set(key, value) {
    initializeDefaults_();
    
    const sheet = getSheet_();
    const values = sheet.getDataRange().getValues();
    
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim() === key) {
        sheet.getRange(i + 1, 2).setValue(value);
        return true;
      }
    }
    
    sheet.appendRow([key, value, '']);
    return true;
  }

  function setMultiple(updates) {
    for (const key in updates) {
      set(key, updates[key]);
    }
    return true;
  }

  function resetToDefaults() {
    const sheet = getSheet_();
    
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }
    
    const data = [];
    for (const key in DEFAULT_SETTINGS) {
      data.push([key, DEFAULT_SETTINGS[key].value, DEFAULT_SETTINGS[key].description]);
    }
    
    if (data.length > 0) {
      sheet.getRange(2, 1, data.length, 3).setValues(data);
    }
    
    return true;
  }

  function getForUI() {
    const settings = getAll();
    const result = [];
    
    const categories = {
      'Telegram': ['TELEGRAM_ENABLED', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'TELEGRAM_NOTIFICATION_TIME', 'TEMPLATE_TELEGRAM_TASK', 'TEMPLATE_TELEGRAM_DAILY'],
      'Email': ['EMAIL_ENABLED', 'EMAIL_SMTP_HOST', 'EMAIL_SMTP_PORT', 'EMAIL_USERNAME', 'EMAIL_PASSWORD', 'EMAIL_FROM', 'EMAIL_TEMPLATE_TASK', 'EMAIL_TEMPLATE_REMINDER'],
      'Расчёт дат': ['DAYS_BEFORE_UNISENDER', 'DAYS_BEFORE_MTSLINK', 'DAYS_BEFORE_REMINDER', 'DAYS_BEFORE_EVENT'],
      'Названия типов': ['TASK_TYPE_UNISENDER', 'TASK_TYPE_MTSLINK', 'TASK_TYPE_REMINDER', 'TASK_TYPE_EVENT'],
      'Правила переноса': ['SHIFT_DIRECTION', 'SHIFT_WEEKENDS', 'SHIFT_HOLIDAYS', 'MAX_SHIFT_DAYS', 'WORK_DAYS_ONLY'],
      'Автоматизация': ['AUTO_RECALCULATE', 'AUTO_SYNC_CALENDAR', 'AUTO_ARCHIVE_DAYS', 'AUTO_ARCHIVE_ENABLED', 'AUTO_CLEANUP_ORPHANED'],
      'Уведомления': ['NOTIFY_HOURS_BEFORE', 'NOTIFY_RESPONSIBLE', 'NOTIFY_OWNER', 'NOTIFY_TELEGRAM', 'NOTIFY_EMAIL', 'NOTIFY_DAILY_SUMMARY', 'NOTIFY_WEEKLY_REPORT'],
      'Отчёты': ['REPORT_FREQUENCY', 'REPORT_RECIPIENTS', 'DASHBOARD_AUTO_UPDATE', 'EXPORT_FORMAT'],
      'Оформление': ['COLOR_UNISENDER', 'COLOR_MTSLINK', 'COLOR_REMINDER', 'COLOR_EVENT', 'THEME'],
      'Безопасность': ['ALLOW_EDIT', 'ALLOW_DELETE', 'LOG_LEVEL', 'BACKUP_ENABLED', 'BACKUP_FREQUENCY'],
      'Интеграции': ['UNISENDER_API_KEY', 'UNISENDER_LIST_ID', 'MTSLINK_API_KEY', 'ZOOM_API_KEY', 'GOOGLE_MEET_ENABLED'],
      'Праздники': ['HOLIDAYS_COUNTRY', 'HOLIDAYS_AUTO_IMPORT', 'HOLIDAYS_INCLUDE_WEEKENDS'],
      'Ответственные': ['DEFAULT_OWNER', 'DEFAULT_EMAIL', 'AUTO_ASSIGN_OWNER'],
      'Рабочее время': ['WORK_DAY_START', 'WORK_DAY_END', 'TIMEZONE', 'DATE_FORMAT', 'LANGUAGE']
    };
    
    for (const category in categories) {
      categories[category].forEach(function(key) {
        if (settings[key]) {
          result.push({
            category: category,
            key: key,
            value: settings[key].value,
            description: settings[key].description
          });
        }
      });
    }
    
    return result;
  }

  return {
    getAll: getAll,
    get: get,
    getBoolean: getBoolean,
    getNumber: getNumber,
    set: set,
    setMultiple: setMultiple,
    resetToDefaults: resetToDefaults,
    getForUI: getForUI
  };

})();

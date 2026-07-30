/**
 * Добавить все новые настройки на существующий лист
 */
function addNewSettings() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(CONFIG.SHEETS.SETTINGS);
  
  if (!sheet) {
    throw new Error('Лист "Настройки" не найден');
  }
  
  // Все настройки из Settings.gs
  const allSettings = {
    'TELEGRAM_ENABLED': { value: 'true', description: 'Включить Telegram-уведомления (true/false)' },
    'TELEGRAM_BOT_TOKEN': { value: '', description: 'Токен бота Telegram' },
    'TELEGRAM_CHAT_ID': { value: '', description: 'Chat ID для уведомлений' },
    'TELEGRAM_NOTIFICATION_TIME': { value: '9', description: 'Час отправки уведомлений (0-23)' },
    'TEMPLATE_TELEGRAM_TASK': { value: '📌 {type}\n    {webinarTitle}\n   👤 {owner}\n   📆 {date}', description: 'Шаблон Telegram-уведомления' },
    'TEMPLATE_TELEGRAM_DAILY': { value: '📋 <b>Задачи на {date}</b>\n\n{tasks}', description: 'Шаблон ежедневной сводки' },
    'EMAIL_ENABLED': { value: 'false', description: 'Включить email-уведомления (true/false)' },
    'EMAIL_SMTP_HOST': { value: 'smtp.gmail.com', description: 'SMTP сервер' },
    'EMAIL_SMTP_PORT': { value: '587', description: 'Порт SMTP' },
    'EMAIL_USERNAME': { value: '', description: 'Логин SMTP' },
    'EMAIL_PASSWORD': { value: '', description: 'Пароль SMTP' },
    'EMAIL_FROM': { value: '', description: 'Email отправителя' },
    'EMAIL_TEMPLATE_TASK': { value: 'Новая задача: {type}\nВебинар: {webinarTitle}\nДата: {date}\nОтветственный: {owner}', description: 'Шаблон email о задаче' },
    'EMAIL_TEMPLATE_REMINDER': { value: 'Напоминание: {type}\nВебинар: {webinarTitle}\nДата: {date}', description: 'Шаблон напоминания' },
    'DAYS_BEFORE_UNISENDER': { value: '14', description: 'Дней до вебинара для Юнисендер' },
    'DAYS_BEFORE_MTSLINK': { value: '7', description: 'Дней до вебинара для МТС Link' },
    'DAYS_BEFORE_REMINDER': { value: '3', description: 'Дней до вебинара для напоминания' },
    'DAYS_BEFORE_EVENT': { value: '0', description: 'Дней до вебинара для дня мероприятия' },
    'SHIFT_DIRECTION': { value: 'backward', description: 'Направление переноса (backward/forward)' },
    'SHIFT_WEEKENDS': { value: 'true', description: 'Переносить выходные (true/false)' },
    'SHIFT_HOLIDAYS': { value: 'true', description: 'Переносить праздники (true/false)' },
    'MAX_SHIFT_DAYS': { value: '14', description: 'Максимальный сдвиг в днях' },
    'WORK_DAYS_ONLY': { value: 'true', description: 'Только рабочие дни (true/false)' },
    'AUTO_RECALCULATE': { value: 'false', description: 'Автопересчёт при добавлении вебинара (true/false)' },
    'AUTO_SYNC_CALENDAR': { value: 'true', description: 'Автосинхронизация календаря (true/false)' },
    'AUTO_ARCHIVE_DAYS': { value: '30', description: 'Через сколько дней архивировать проведённые вебинары' },
    'AUTO_ARCHIVE_ENABLED': { value: 'false', description: 'Автоматическая архивация (true/false)' },
    'AUTO_CLEANUP_ORPHANED': { value: 'false', description: 'Автоочистка orphaned событий (true/false)' },
    'NOTIFY_HOURS_BEFORE': { value: '24', description: 'За сколько часов напоминать' },
    'NOTIFY_RESPONSIBLE': { value: 'true', description: 'Уведомлять ответственного (true/false)' },
    'NOTIFY_OWNER': { value: 'true', description: 'Уведомлять владельца вебинара (true/false)' },
    'NOTIFY_TELEGRAM': { value: 'true', description: 'Telegram-уведомления (true/false)' },
    'NOTIFY_EMAIL': { value: 'false', description: 'Email-уведомления (true/false)' },
    'NOTIFY_DAILY_SUMMARY': { value: 'true', description: 'Ежедневная сводка (true/false)' },
    'NOTIFY_WEEKLY_REPORT': { value: 'false', description: 'Еженедельный отчёт (true/false)' },
    'REPORT_FREQUENCY': { value: 'weekly', description: 'Частота отчётов (daily/weekly/monthly)' },
    'REPORT_RECIPIENTS': { value: '', description: 'Email получателей отчётов (через запятую)' },
    'DASHBOARD_AUTO_UPDATE': { value: 'true', description: 'Автообновление Dashboard (true/false)' },
    'EXPORT_FORMAT': { value: 'csv', description: 'Формат экспорта (csv/pdf/excel)' },
    'COLOR_UNISENDER': { value: '#90ee90', description: 'Цвет для Юнисендер' },
    'COLOR_MTSLINK': { value: '#fffacd', description: 'Цвет для МТС Link' },
    'COLOR_REMINDER': { value: '#ffd700', description: 'Цвет для напоминания' },
    'COLOR_EVENT': { value: '#ff6b6b', description: 'Цвет для дня мероприятия' },
    'THEME': { value: 'light', description: 'Тема оформления (light/dark)' },
    'ALLOW_EDIT': { value: 'all', description: 'Кто может редактировать (all/owner)' },
    'ALLOW_DELETE': { value: 'all', description: 'Кто может удалять (all/owner)' },
    'LOG_LEVEL': { value: 'info', description: 'Уровень логирования (info/warn/error)' },
    'BACKUP_ENABLED': { value: 'false', description: 'Авто резервное копирование (true/false)' },
    'BACKUP_FREQUENCY': { value: 'daily', description: 'Частота бэкапов (daily/weekly/monthly)' },
    'UNISENDER_API_KEY': { value: '', description: 'API ключ Юнисендер' },
    'UNISENDER_LIST_ID': { value: '', description: 'ID списка рассылки Юнисендер' },
    'MTSLINK_API_KEY': { value: '', description: 'API ключ МТС Link' },
    'ZOOM_API_KEY': { value: '', description: 'API ключ Zoom' },
    'GOOGLE_MEET_ENABLED': { value: 'true', description: 'Использовать Google Meet (true/false)' },
    'HOLIDAYS_COUNTRY': { value: 'RU', description: 'Страна для автозагрузки праздников (RU/US/etc)' },
    'HOLIDAYS_AUTO_IMPORT': { value: 'false', description: 'Автоимпорт праздников (true/false)' },
    'HOLIDAYS_INCLUDE_WEEKENDS': { value: 'false', description: 'Включать выходные в праздники (true/false)' },
    'DEFAULT_OWNER': { value: '', description: 'Ответственный по умолчанию' },
    'DEFAULT_EMAIL': { value: '', description: 'Email по умолчанию' },
    'AUTO_ASSIGN_OWNER': { value: 'false', description: 'Автоназначение ответственного (true/false)' },
    'WORK_DAY_START': { value: '9', description: 'Начало рабочего дня (час)' },
    'WORK_DAY_END': { value: '18', description: 'Конец рабочего дня (час)' },
    'TIMEZONE': { value: 'Europe/Moscow', description: 'Часовой пояс' },
    'DATE_FORMAT': { value: 'dd.mm.yyyy', description: 'Формат даты' },
    'LANGUAGE': { value: 'ru', description: 'Язык интерфейса (ru/en)' }
  };
  
  // Получаем существующие настройки
  const data = sheet.getDataRange().getValues();
  const existingKeys = {};
  
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0] || '').trim();
    if (key) {
      existingKeys[key] = true;
    }
  }
  
  // Добавляем только недостающие
  let added = 0;
  const newRows = [];
  
  for (const key in allSettings) {
    if (!existingKeys[key]) {
      newRows.push([key, allSettings[key].value, allSettings[key].description]);
      added++;
    }
  }
  
  // Записываем новые настройки
  if (newRows.length > 0) {
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, newRows.length, 3).setValues(newRows);
  }
  
  // Сортируем по категориям (опционально)
  sheet.getRange(1, 1, sheet.getLastRow(), 3).sort({column: 1, ascending: true});
  
  SpreadsheetApp.getUi().alert(
    '✅ Настройки обновлены!\n\n' +
    'Добавлено новых: ' + added + '\n' +
    'Всего настроек: ' + Object.keys(allSettings).length
  );
  
  Logger.log('Добавлено настроек: ' + added);
}

function addReminderTimeColumn() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Задачи');
  
  if (!sheet) {
    Logger.log('Лист "Задачи" не найден');
    return;
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Проверяем есть ли уже колонка
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim() === 'Время напоминания') {
      Logger.log('Колонка уже существует');
      return;
    }
  }
  
  // Добавляем колонку
  const newCol = sheet.getLastColumn() + 1;
  sheet.getRange(1, newCol).setValue('Время напоминания');
  sheet.getRange(1, newCol).setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  
  Logger.log('✅ Колонка "Время напоминания" добавлена в колонку ' + newCol);
}

function testDateDebug() {
  const now = new Date();
  
  Logger.log('=== ТЕКУЩЕЕ ВРЕМЯ ===');
  Logger.log('new Date(): ' + now);
  Logger.log('getFullYear(): ' + now.getFullYear());
  Logger.log('getMonth(): ' + (now.getMonth() + 1) + ' (0-indexed: ' + now.getMonth() + ')');
  Logger.log('getDate(): ' + now.getDate());
  Logger.log('getHours(): ' + now.getHours());
  Logger.log('getMinutes(): ' + now.getMinutes());
  
  // Формат даты как в скрипте
  const todayStr = now.getFullYear() + '-' + 
                   String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(now.getDate()).padStart(2, '0');
  Logger.log('todayStr: ' + todayStr);
  
  // Читаем дату из таблицы
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('📨 Задачи');
  const data = sheet.getDataRange().getValues();
  
  Logger.log('\n=== ДАННЫЕ ИЗ ТАБЛИЦЫ ===');
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const type = row[3];
    const dateCell = row[4];
    const reminderTime = row[9];
    
    if (reminderTime) {
      Logger.log('Задача: ' + type);
      Logger.log('  Дата из ячейки: ' + dateCell + ' (тип: ' + typeof dateCell + ')');
      
      // Преобразуем дату
      const d = new Date(dateCell);
      Logger.log('  new Date(dateCell): ' + d);
      Logger.log('  getFullYear(): ' + d.getFullYear());
      Logger.log('  getMonth(): ' + (d.getMonth() + 1));
      Logger.log('  getDate(): ' + d.getDate());
      
      const dateStr = d.getFullYear() + '-' + 
                      String(d.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(d.getDate()).padStart(2, '0');
      Logger.log('  dateStr: ' + dateStr);
      Logger.log('  Время напоминания: ' + reminderTime);
      Logger.log('  Совпадает с todayStr? ' + (dateStr === todayStr));
    }
  }
}

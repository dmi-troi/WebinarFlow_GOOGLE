/**
 * ==========================================================
 * WebinarFlow v2.0
 * Validation.gs
 * Проверка данных
 * ==========================================================
 *
 * Модуль валидации данных перед записью в таблицу.
 * Отвечает за:
 *  - проверку обязательных полей вебинара;
 *  - проверку корректности email;
 *  - проверку даты (не в прошлом);
 *  - поиск дубликатов (по названию + дате);
 *  - проверку структуры проекта (наличие всех листов);
 *  - вспомогательные функции проверки.
 */

// ========================================================
// ГЛАВНАЯ ФУНКЦИЯ ПРОВЕРКИ ВЕБИНАРА
// ========================================================

/**
 * Проверяет данные вебинара перед сохранением.
 *
 * @param {Object} data объект с полями:
 *   - title    {string} название вебинара
 *   - date     {string|Date} дата мероприятия (yyyy-MM-dd или Date)
 *   - time     {string} время (опционально)
 *   - owner    {string} ответственный
 *   - email    {string} email ответственного
 *
 * @return {Object} { success: boolean, errors: string[] }
 */
function validateWebinar(data) {
  const errors = [];

  if (!data) {
    return { success: false, errors: ["Не переданы данные вебинара."] };
  }

  // -------------------------
  // Обязательные поля
  // -------------------------
  if (isEmpty_(data.title))  errors.push("Не указано название вебинара.");
  if (isEmpty_(data.date))   errors.push("Не указана дата мероприятия.");
  if (isEmpty_(data.owner))  errors.push("Не выбран ответственный.");
  if (isEmpty_(data.email))  errors.push("Не указан Email.");

  // -------------------------
  // Email (только если указан)
  // -------------------------
  if (!isEmpty_(data.email) && !isValidEmail_(data.email)) {
    errors.push("Некорректный Email.");
  }

  // -------------------------
  // Дата (не в прошлом)
  // -------------------------
  if (!isEmpty_(data.date)) {
    try {
      const webinarDate = new Date(data.date);
      webinarDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (webinarDate < today) {
        errors.push("Дата мероприятия уже прошла.");
      }
    } catch (e) {
      errors.push("Некорректный формат даты.");
    }
  }

  // -------------------------
  // Дубликаты
  // -------------------------
  if (isDuplicateWebinar_(data)) {
    errors.push("Такой вебинар уже существует (совпадает название и дата).");
  }

  return {
    success: errors.length === 0,
    errors: errors
  };
}

// ========================================================
// ПРОВЕРКА EMAIL
// ========================================================

/**
 * Проверка корректности email по регулярному выражению.
 * @param {string} email
 * @return {boolean}
 */
function isValidEmail_(email) {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(String(email).trim());
}

// ========================================================
// ПРОВЕРКА ПУСТОТЫ
// ========================================================

/**
 * Проверка, что значение пустое (null, undefined или пустая строка).
 * @param {*} value
 * @return {boolean}
 */
function isEmpty_(value) {
  return value === null ||
         value === undefined ||
         String(value).trim() === "";
}

// ========================================================
// ПРОВЕРКА ДУБЛИКАТОВ
// ========================================================

/**
 * Проверяет, существует ли уже вебинар с таким названием и датой.
 *
 * Структура листа "📅 Вебинары":
 *   A (0): ID
 *   B (1): Название
 *   C (2): Дата
 *   D (3): Ответственный
 *   E (4): Email
 *   F (5): Статус
 *   G (6): Примечание
 *
 * @param {Object} data объект с полями title и date
 * @return {boolean} true если дубликат найден
 */
function isDuplicateWebinar_(data) {
  if (!data || isEmpty_(data.title) || isEmpty_(data.date)) {
    return false;
  }

  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(CONFIG.SHEETS.WEBINARS);

  if (!sheet) return false;

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return false;

  // Нормализуем искомую дату к формату yyyy-MM-dd
  const searchTitle = String(data.title).trim().toLowerCase();
  const searchDate = normalizeDateToString_(data.date);

  if (!searchDate) return false;

  for (let i = 1; i < values.length; i++) {
    const row = values[i];

    // Пропускаем пустые строки
    if (!row[0] && !row[1]) continue;

    const title = String(row[1] || "").trim().toLowerCase();
    const dateVal = row[2]; // Колонка C — Дата (индекс 2)

    const rowDate = normalizeDateToString_(dateVal);
    if (!rowDate) continue;

    if (title === searchTitle && rowDate === searchDate) {
      return true;
    }
  }

  return false;
}

/**
 * Универсальная нормализация даты к строке yyyy-MM-dd.
 * Работает с Date, строкой, числом.
 * @param {*} value
 * @return {string|null}
 */
function normalizeDateToString_(value) {
  if (!value) return null;

  try {
    let d;
    if (value instanceof Date) {
      d = value;
    } else {
      d = new Date(value);
    }

    if (isNaN(d.getTime())) return null;

    return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
  } catch (e) {
    return null;
  }
}

// ========================================================
// ПРОВЕРКА СУЩЕСТВОВАНИЯ ЛИСТА
// ========================================================

/**
 * Проверка, существует ли лист с указанным именем.
 * @param {string} sheetName
 * @return {boolean}
 */
function sheetExists_(sheetName) {
  if (!sheetName) return false;
  return SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(sheetName) !== null;
}

// ========================================================
// ПРОВЕРКА СТРУКТУРЫ ПРОЕКТА
// ========================================================

/**
 * Проверяет, что все листы из CONFIG.SHEETS существуют в таблице.
 *
 * @return {Object} { success: boolean, errors: string[] }
 *   errors содержит список отсутствующих листов
 */
function validateProjectStructure() {
  const errors = [];

  Object.values(CONFIG.SHEETS).forEach(function (sheetName) {
    if (!sheetExists_(sheetName)) {
      errors.push(sheetName);
    }
  });

  return {
    success: errors.length === 0,
    errors: errors
  };
}

// ========================================================
// ПРОВЕРКА КАЛЕНДАРЯ (заглушка для будущего использования)
// ========================================================

/**
 * Проверка доступности Google-календаря.
 * @return {boolean}
 */
function validateCalendar() {
  try {
    const calendar = CONFIG.CALENDAR.ID
      ? CalendarApp.getCalendarById(CONFIG.CALENDAR.ID)
      : CalendarApp.getDefaultCalendar();
    return calendar !== null;
  } catch (e) {
    Logger.log("validateCalendar: " + e.message);
    return false;
  }
}

// ========================================================
// ПРОВЕРКА НАСТРОЕК (заглушка для будущего использования)
// ========================================================

/**
 * Проверка корректности настроек.
 * @return {boolean}
 */
function validateSettings() {
  return true;
}

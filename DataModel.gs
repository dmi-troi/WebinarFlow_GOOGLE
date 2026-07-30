/**
 * ==========================================================
 * WebinarFlow v2.0
 * DataModel.gs
 * Слой доступа к данным (использует глобальный CONFIG)
 * ==========================================================
 */

const DataModel = (function () {
  
  let holidaysCache = null;
  let holidaysCacheTime = 0;
  const CACHE_TTL = 60000;

  function getSheet_(sheetName) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('Лист "' + sheetName + '" не найден. Проверьте Config.gs и названия листов в таблице.');
    }
    return sheet;
  }

  function buildColumnMap_(headers) {
    const map = {};
    headers.forEach(function(h, i) {
      const key = String(h).trim();
      if (key && !map[key]) map[key] = i;
    });
    return map;
  }

  function readSheetAsObjects_(sheetName) {
    const sheet = getSheet_(sheetName);
    if (sheet.getLastRow() < 2) return [];
    
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return [];

    const headers = values[0];
    const map = buildColumnMap_(headers);
    const result = [];

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row.every(function(cell) { return cell === '' || cell == null; })) continue;
      const obj = { _rowIndex: i + 1 };
      headers.forEach(function(h, idx) {
        obj[String(h).trim()] = row[idx];
      });
      result.push(obj);
    }
    return result;
  }

  function normalizeDate_(value) {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function formatDateKey_(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  // --- ВЕБИНАРЫ ---

  function getWebinars() {
    const rows = readSheetAsObjects_(CONFIG.SHEETS.WEBINARS);
    return rows.map(function(r) {
      return {
        id:     String(r['ID'] || '').trim(),
        title:  String(r['Название'] || '').trim(),
        date:   normalizeDate_(r['Дата']),
        owner:  String(r['Ответственный'] || '').trim(),
        email:  String(r['Email'] || '').trim(),
        status: String(r['Статус'] || CONFIG.STATUS.PLANNED).trim(),
        notes:  String(r['Примечание'] || '').trim(),
        _row:   r._rowIndex
      };
    }).filter(function(w) { return w.id || w.title; });
  }

  function getWebinarById(id) {
    return getWebinars().find(function(w) { return w.id === String(id).trim(); }) || null;
  }

  function addWebinar(data) {
    if (!data || !data.title) {
      throw new Error('Название вебинара обязательно');
    }
    
    const sheet = getSheet_(CONFIG.SHEETS.WEBINARS);
    if (sheet.getLastColumn() === 0) {
      throw new Error('Лист "Вебинары" пустой — добавьте заголовки');
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const map = buildColumnMap_(headers);
    
    const id = data.id || Utilities.getUuid();
    
    const row = new Array(headers.length).fill('');
    
    if (map['ID'] !== undefined) row[map['ID']] = id;
    if (map['Название'] !== undefined) row[map['Название']] = data.title;
    if (map['Дата'] !== undefined) row[map['Дата']] = data.date || '';
    if (map['Ответственный'] !== undefined) row[map['Ответственный']] = data.owner || '';
    if (map['Email'] !== undefined) row[map['Email']] = data.email || '';
    if (map['Статус'] !== undefined) row[map['Статус']] = data.status || CONFIG.STATUS.PLANNED;
    if (map['Примечание'] !== undefined) row[map['Примечание']] = data.notes || '';
    
    sheet.appendRow(row);
    
    if (map['Дата'] !== undefined && data.date) {
      sheet.getRange(sheet.getLastRow(), map['Дата'] + 1)
           .setNumberFormat('dd.mm.yyyy');
    }
    
    Logger.log('✅ Вебинар добавлен: ' + id);
    return id;
  }

  function updateWebinar(id, updates) {
    if (!id || !updates) return false;
    const sheet = getSheet_(CONFIG.SHEETS.WEBINARS);
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return false;
    const map = buildColumnMap_(data[0]);

    if (map['ID'] === undefined) return false;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][map['ID']]).trim() === String(id).trim()) {
        for (const key in updates) {
          if (map[key] !== undefined) {
            let value = updates[key];
            if (key === 'Дата' && value) value = normalizeDate_(value);
            sheet.getRange(i + 1, map[key] + 1).setValue(value);
          }
        }
        return true;
      }
    }
    return false;
  }

  function deleteWebinar(id) {
    if (!id) {
      Logger.log('deleteWebinar: ID не указан');
      return false;
    }
    
    try {
      const sheet = getSheet_(CONFIG.SHEETS.WEBINARS);
      const data = sheet.getDataRange().getValues();
      const map = buildColumnMap_(data[0]);
      
      if (map['ID'] === undefined) {
        Logger.log('deleteWebinar: колонка ID не найдена');
        return false;
      }
      
      for (let i = 1; i < data.length; i++) {
        const rowId = String(data[i][map['ID']]).trim();
        if (rowId === String(id).trim()) {
          sheet.deleteRow(i + 1);
          Logger.log('✅ Вебинар удалён: ' + id);
          return true;
        }
      }
      
      Logger.log('⚠️ Вебинар не найден: ' + id);
      return false;
      
    } catch (e) {
      Logger.log('❌ Ошибка deleteWebinar: ' + e.message);
      throw e;
    }
  }

  // --- ЗАДАЧИ ---

  function getTasks() {
    const rows = readSheetAsObjects_(CONFIG.SHEETS.TASKS);
    return rows.map(function(r) {
      return {
        id:            String(r['ID'] || '').trim(),
        webinarId:     String(r['Вебинар ID'] || '').trim(),
        webinarTitle:  String(r['Вебинар'] || '').trim(),
        type:          String(r['Тип'] || '').trim(),
        plannedDate:   normalizeDate_(r['Дата']),
        owner:         String(r['Ответственный'] || '').trim(),
        email:         String(r['Email'] || '').trim(),
        status:        String(r['Статус'] || CONFIG.TASK_STATUS.PLANNED).trim(),
        eventId:       String(r['EventID'] || '').trim(),
        reminderTime:  formatTime_(r['Время напоминания']),  // ← ИСПРАВЛЕНО
        notes:         String(r['Примечание'] || '').trim(),
        _row:          r._rowIndex
      };
    }).filter(function(t) { return t.id || t.webinarId; });
  }

  // НОВАЯ ФУНКЦИЯ для форматирования времени
  function formatTime_(value) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return hours + ':' + minutes;
  }

  function replaceAllTasks(newTasks) {
    Logger.log('=== replaceAllTasks START ===');
    Logger.log('newTasks: ' + (newTasks ? newTasks.length : 'null'));
    
    const sheet = getSheet_(CONFIG.SHEETS.TASKS);
    
    const lastCol = sheet.getLastColumn();
    Logger.log('lastCol: ' + lastCol);
    
    if (lastCol === 0) {
      throw new Error('Лист "Задачи" пустой — добавьте заголовки');
    }
    
    if (lastCol < 9) {
      throw new Error('На листе "Задачи" должно быть минимум 9 колонок. Сейчас: ' + lastCol);
    }
    
    const lastRow = sheet.getLastRow();
    Logger.log('lastRow before clear: ' + lastRow);
    
    if (lastRow > 1) {
      sheet.getRange(2, 1, Math.max(0, lastRow - 1), lastCol).clearContent();
      Logger.log('Старые задачи очищены');
    }
    
    if (!newTasks || newTasks.length === 0) {
      Logger.log('Нет задач для записи (пустой массив)');
      Logger.log('=== replaceAllTasks END (empty) ===');
      return;
    }
    
    Logger.log('Записываем ' + newTasks.length + ' задач');
    
    const rows = [];
    
    for (let i = 0; i < newTasks.length; i++) {
      const t = newTasks[i];
      
      const row = [];
      for (let j = 0; j < lastCol; j++) {
        row.push('');
      }
      
      row[0] = t.id || Utilities.getUuid();
      row[1] = t.webinarId || '';
      row[2] = t.webinarTitle || '';
      row[3] = t.type || '';
      if (t.plannedDate) {
        if (typeof t.plannedDate === 'string') {
          const dateParts = t.plannedDate.split('-');
          row[4] = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        } else {
          row[4] = new Date(t.plannedDate);
        }
      } else {
        row[4] = '';
      }
      row[5] = t.owner || '';
      row[6] = t.email || '';
      row[7] = t.status || CONFIG.TASK_STATUS.PLANNED;
      row[8] = t.eventId || '';
      
      if (row.length !== lastCol) {
        throw new Error('Ошибка: row.length=' + row.length + ', lastCol=' + lastCol);
      }
      
      rows.push(row);
    }
    
    if (rows.length === 0) {
      Logger.log('rows пустой');
      return;
    }
    
    if (rows[0].length !== lastCol) {
      throw new Error('НЕСООТВЕТСТВИЕ: rows[0].length=' + rows[0].length + ', lastCol=' + lastCol);
    }
    
    Logger.log('Записываем ' + rows.length + ' строк × ' + rows[0].length + ' колонок');
    
    try {
      sheet.getRange(2, 1, rows.length, lastCol).setValues(rows);
      
      if (lastCol >= 5) {
        sheet.getRange(2, 5, rows.length, 1).setNumberFormat('dd.mm.yyyy');
      }
      
      Logger.log('✅ Записано задач: ' + rows.length);
    } catch (e) {
      Logger.log(' Ошибка записи: ' + e.message);
      throw e;
    }
    
    Logger.log('=== replaceAllTasks END ===');
  }

  function updateTaskEventId(taskId, eventId) {
    if (!taskId) return false;
    const sheet = getSheet_(CONFIG.SHEETS.TASKS);
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return false;
    const map = buildColumnMap_(data[0]);

    if (map['ID'] === undefined || map['EventID'] === undefined) return false;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][map['ID']]).trim() === String(taskId).trim()) {
        sheet.getRange(i + 1, map['EventID'] + 1).setValue(eventId || '');
        return true;
      }
    }
    return false;
  }

  // --- ПРАЗДНИКИ ---

  function getHolidaysSet() {
    const now = Date.now();
    if (holidaysCache && (now - holidaysCacheTime) < CACHE_TTL) return holidaysCache;

    const set = [];
    try {
      const sheet = getSheet_(CONFIG.SHEETS.HOLIDAYS);
      if (sheet.getLastRow() < 2) {
        holidaysCache = set;
        holidaysCacheTime = now;
        return set;
      }
      const values = sheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        const d = normalizeDate_(values[i][0]);
        if (d) set.push(formatDateKey_(d));
      }
    } catch (e) {
      Logger.log('Лист праздников не найден.');
    }
    holidaysCache = set;
    holidaysCacheTime = now;
    return set;
  }

  function isHoliday(date) {
    const holidays = getHolidaysSet();
    const dateKey = formatDateKey_(normalizeDate_(date));
    return holidays.indexOf(dateKey) !== -1;
  }

  // ========================================================
  // АВТОЗАВЕРШЕНИЕ И АРХИВАЦИЯ
  // ========================================================

  /**
   * Автозавершение прошедших вебинаров
   */
  function autoCompleteWebinars() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sheet = getSheet_(CONFIG.SHEETS.WEBINARS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const map = buildColumnMap_(headers);
    
    if (map['Дата'] === undefined || map['Статус'] === undefined) return;
    
    let completedCount = 0;
    
    for (let i = 1; i < data.length; i++) {
      const status = String(data[i][map['Статус']] || '').trim();
      const date = normalizeDate_(data[i][map['Дата']]);
      
      // Если вебинар запланирован и дата прошла - завершаем
      if ((status === CONFIG.STATUS.PLANNED || status === CONFIG.STATUS.ACTIVE) && date && date < today) {
        sheet.getRange(i + 1, map['Статус'] + 1).setValue(CONFIG.STATUS.DONE);
        completedCount++;
        Logger.log('Вебинар автоматически завершён: ' + data[i][map['Название']]);
        
        // Архивируем задачи этого вебинара
        const webinarId = String(data[i][map['ID']] || '').trim();
        if (webinarId) {
          archiveTasksByWebinarId(webinarId);
        }
      }
    }
    
    if (completedCount > 0) {
      Logger.log('Автозавершено вебинаров: ' + completedCount);
    }
  }

  /**
   * Архивировать задачи по ID вебинара
   */
  function archiveTasksByWebinarId(webinarId) {
    const tasksSheet = getSheet_(CONFIG.SHEETS.TASKS);
    const archiveSheet = getArchiveSheet_();
    
    const tasksData = tasksSheet.getDataRange().getValues();
    const tasksHeaders = tasksData[0];
    const tasksMap = buildColumnMap_(tasksHeaders);
    
    if (tasksMap['Вебинар ID'] === undefined) return;
    
    let archivedCount = 0;
    
    // Идем с конца чтобы не нарушать индексы при удалении
    for (let i = tasksData.length - 1; i >= 1; i--) {
      const taskWebinarId = String(tasksData[i][tasksMap['Вебинар ID']] || '').trim();
      if (taskWebinarId === webinarId) {
        // Копируем в архив
        const archiveRow = [];
        for (let j = 0; j < tasksHeaders.length; j++) {
          archiveRow.push(tasksData[i][j]);
        }
        archiveRow.push(new Date()); // Дата архивации
        archiveSheet.appendRow(archiveRow);
        
        // Удаляем из основного листа
        tasksSheet.deleteRow(i + 1);
        archivedCount++;
      }
    }
    
    if (archivedCount > 0) {
      Logger.log('Архивировано задач: ' + archivedCount);
    }
  }

  /**
   * Получить лист архива задач
   */
  function getArchiveSheet_() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('📦 Архив Задач');
    
    if (!sheet) {
      sheet = ss.insertSheet(' Архив Задач');
      const tasksSheet = getSheet_(CONFIG.SHEETS.TASKS);
      const headers = tasksSheet.getRange(1, 1, 1, tasksSheet.getLastColumn()).getValues()[0];
      const archiveHeaders = headers.concat(['Дата архивации']);
      sheet.getRange(1, 1, 1, archiveHeaders.length).setValues([archiveHeaders]);
      sheet.getRange(1, 1, 1, archiveHeaders.length)
        .setFontWeight('bold')
        .setBackground('#4285f4')
        .setFontColor('#ffffff');
    }
    
    return sheet;
  }

  /**
   * Получить архивные задачи
   */
  function getArchiveTasks() {
    const sheet = getArchiveSheet_();
    if (sheet.getLastRow() < 2) return [];
    
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const map = buildColumnMap_(headers);
    const result = [];
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row.every(function(cell) { return cell === '' || cell == null; })) continue;
      result.push({
        id: String(row[map['ID']] || '').trim(),
        webinarId: String(row[map['Вебинар ID']] || '').trim(),
        webinarTitle: String(row[map['Вебинар']] || '').trim(),
        type: String(row[map['Тип']] || '').trim(),
        plannedDate: normalizeDate_(row[map['Дата']]),
        owner: String(row[map['Ответственный']] || '').trim(),
        email: String(row[map['Email']] || '').trim(),
        status: String(row[map['Статус']] || '').trim(),
        eventId: String(row[map['EventID']] || '').trim()
      });
    }
    
    return result;
  }

  /**
   * Архивировать задачу по ID
   */
  function archiveTask(taskId) {
    const tasksSheet = getSheet_(CONFIG.SHEETS.TASKS);
    const archiveSheet = getArchiveSheet_();
    
    const tasksData = tasksSheet.getDataRange().getValues();
    const tasksHeaders = tasksData[0];
    const tasksMap = buildColumnMap_(tasksHeaders);
    
    if (tasksMap['ID'] === undefined) return false;
    
    for (let i = 1; i < tasksData.length; i++) {
      if (String(tasksData[i][tasksMap['ID']]).trim() === String(taskId).trim()) {
        // Копируем в архив
        const archiveRow = [];
        for (let j = 0; j < tasksHeaders.length; j++) {
          archiveRow.push(tasksData[i][j]);
        }
        archiveRow.push(new Date());
        archiveSheet.appendRow(archiveRow);
        
        // Удаляем из основного листа
        tasksSheet.deleteRow(i + 1);
        Logger.log('Задача архивирована: ' + taskId);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Восстановить задачу из архива
   */
  function restoreTask(taskId) {
    const archiveSheet = getArchiveSheet_();
    const tasksSheet = getSheet_(CONFIG.SHEETS.TASKS);
    
    const archiveData = archiveSheet.getDataRange().getValues();
    const archiveHeaders = archiveData[0];
    const archiveMap = buildColumnMap_(archiveHeaders);
    
    if (archiveMap['ID'] === undefined) return false;
    
    for (let i = 1; i < archiveData.length; i++) {
      if (String(archiveData[i][archiveMap['ID']]).trim() === String(taskId).trim()) {
        // Копируем обратно в задачи (без колонки "Дата архивации")
        const taskRow = [];
        const tasksHeaders = tasksSheet.getRange(1, 1, 1, tasksSheet.getLastColumn()).getValues()[0];
        const tasksMap = buildColumnMap_(tasksHeaders);
        
        for (let j = 0; j < tasksHeaders.length; j++) {
          const header = String(tasksHeaders[j]).trim();
          if (archiveMap[header] !== undefined) {
            taskRow.push(archiveData[i][archiveMap[header]]);
          } else {
            taskRow.push('');
          }
        }
        
        tasksSheet.appendRow(taskRow);
        archiveSheet.deleteRow(i + 1);
        Logger.log('Задача восстановлена: ' + taskId);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Получить архивные вебинары
   */
  function getArchiveWebinars() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('📦 Архив Вебинаров');
    
    if (!sheet || sheet.getLastRow() < 2) return [];
    
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const map = buildColumnMap_(headers);
    const result = [];
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row.every(function(cell) { return cell === '' || cell == null; })) continue;
      result.push({
        id: String(row[map['ID']] || '').trim(),
        title: String(row[map['Название']] || '').trim(),
        date: normalizeDate_(row[map['Дата']]),
        owner: String(row[map['Ответственный']] || '').trim(),
        email: String(row[map['Email']] || '').trim(),
        status: String(row[map['Статус']] || '').trim(),
        notes: String(row[map['Примечание']] || '').trim()
      });
    }
    
    return result;
  }

  /**
   * Архивировать вебинар
   */
  function archiveWebinar(webinarId) {
    const webinarsSheet = getSheet_(CONFIG.SHEETS.WEBINARS);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let archiveSheet = ss.getSheetByName('📦 Архив Вебинаров');
    
    if (!archiveSheet) {
      archiveSheet = ss.insertSheet('📦 Архив Вебинаров');
      const headers = webinarsSheet.getRange(1, 1, 1, webinarsSheet.getLastColumn()).getValues()[0];
      const archiveHeaders = headers.concat(['Дата архивации']);
      archiveSheet.getRange(1, 1, 1, archiveHeaders.length).setValues([archiveHeaders]);
      archiveSheet.getRange(1, 1, 1, archiveHeaders.length)
        .setFontWeight('bold')
        .setBackground('#4285f4')
        .setFontColor('#ffffff');
    }
    
    const webinarsData = webinarsSheet.getDataRange().getValues();
    const webinarsHeaders = webinarsData[0];
    const webinarsMap = buildColumnMap_(webinarsHeaders);
    
    if (webinarsMap['ID'] === undefined) return false;
    
    for (let i = 1; i < webinarsData.length; i++) {
      if (String(webinarsData[i][webinarsMap['ID']]).trim() === String(webinarId).trim()) {
        // Копируем в архив
        const archiveRow = [];
        for (let j = 0; j < webinarsHeaders.length; j++) {
          archiveRow.push(webinarsData[i][j]);
        }
        archiveRow.push(new Date());
        archiveSheet.appendRow(archiveRow);
        
        // Удаляем из основного листа
        webinarsSheet.deleteRow(i + 1);
        Logger.log('Вебинар архивирован: ' + webinarId);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Восстановить вебинар из архива
   */
  function restoreWebinar(webinarId) {
    Logger.log('=== restoreWebinar START: ' + webinarId + ' ===');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const archiveSheet = ss.getSheetByName('📦 Архив Вебинаров');
    const webinarsSheet = getSheet_(CONFIG.SHEETS.WEBINARS);
    
    if (!archiveSheet) {
      Logger.log('❌ Лист архива вебинаров не найден');
      return false;
    }
    
    if (archiveSheet.getLastRow() < 2) {
      Logger.log('❌ Архив пуст');
      return false;
    }
    
    const archiveData = archiveSheet.getDataRange().getValues();
    const archiveHeaders = archiveData[0];
    const archiveMap = buildColumnMap_(archiveHeaders);
    
    Logger.log('Колонки архива: ' + Object.keys(archiveMap).join(', '));
    Logger.log('Ищем ID: ' + webinarId);
    
    if (archiveMap['ID'] === undefined) {
      Logger.log('❌ Колонка ID не найдена в архиве');
      return false;
    }
    
    for (let i = 1; i < archiveData.length; i++) {
      const archiveId = String(archiveData[i][archiveMap['ID']] || '').trim();
      Logger.log('Проверяем строку ' + i + ': ID=' + archiveId);
      
      if (archiveId === String(webinarId).trim()) {
        Logger.log('✅ Вебинар найден в архиве, строка ' + (i + 1));
        
        // Формируем строку для листа вебинаров
        const webinarsHeaders = webinarsSheet.getRange(1, 1, 1, webinarsSheet.getLastColumn()).getValues()[0];
        const webinarsMap = buildColumnMap_(webinarsHeaders);
        
        Logger.log('Колонки вебинаров: ' + Object.keys(webinarsMap).join(', '));
        
        const webinarRow = [];
        for (let j = 0; j < webinarsHeaders.length; j++) {
          const header = String(webinarsHeaders[j]).trim();
          if (archiveMap[header] !== undefined) {
            webinarRow.push(archiveData[i][archiveMap[header]]);
          } else {
            webinarRow.push('');
          }
        }
        
        // Добавляем строку в лист вебинаров
        webinarsSheet.appendRow(webinarRow);
        
        // Форматируем дату
        if (webinarsMap['Дата'] !== undefined) {
          const dateRow = webinarsSheet.getLastRow();
          const dateCell = webinarsSheet.getRange(dateRow, webinarsMap['Дата'] + 1);
          dateCell.setNumberFormat('dd.mm.yyyy');
          Logger.log('✅ Дата отформатирована');
        }
        
        // Удаляем из архива
        archiveSheet.deleteRow(i + 1);
        Logger.log('✅ Вебинар удалён из архива');
        
        // Восстанавливаем задачи этого вебинара из архива задач
        const tasksRestored = restoreTasksByWebinarId_(webinarId);
        Logger.log('Восстановлено задач: ' + tasksRestored);
        
        Logger.log('=== restoreWebinar END: SUCCESS ===');
        return true;
      }
    }
    
    Logger.log('❌ Вебинар не найден в архиве');
    return false;
  }

  /**
   * Восстановить задачи вебинара из архива
   */
  function restoreTasksByWebinarId_(webinarId) {
    Logger.log('=== restoreTasksByWebinarId_ START: ' + webinarId + ' ===');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const archiveSheet = ss.getSheetByName('📦 Архив Задач');
    const tasksSheet = getSheet_(CONFIG.SHEETS.TASKS);
    
    if (!archiveSheet || archiveSheet.getLastRow() < 2) {
      Logger.log('️ Архив задач пуст или не найден');
      return 0;
    }
    
    const archiveData = archiveSheet.getDataRange().getValues();
    const archiveHeaders = archiveData[0];
    const archiveMap = buildColumnMap_(archiveHeaders);
    
    if (archiveMap['Вебинар ID'] === undefined) {
      Logger.log('❌ Колонка "Вебинар ID" не найдена в архиве задач');
      return 0;
    }
    
    const tasksHeaders = tasksSheet.getRange(1, 1, 1, tasksSheet.getLastColumn()).getValues()[0];
    const tasksMap = buildColumnMap_(tasksHeaders);
    
    let restoredCount = 0;
    
    // Идём с конца чтобы не нарушать индексы
    for (let i = archiveData.length - 1; i >= 1; i--) {
      const taskWebinarId = String(archiveData[i][archiveMap['Вебинар ID']] || '').trim();
      
      if (taskWebinarId === String(webinarId).trim()) {
        Logger.log('Найдена задача для восстановления: ' + archiveData[i][archiveMap['ID']]);
        
        // Формируем строку для листа задач
        const taskRow = [];
        for (let j = 0; j < tasksHeaders.length; j++) {
          const header = String(tasksHeaders[j]).trim();
          if (archiveMap[header] !== undefined) {
            taskRow.push(archiveData[i][archiveMap[header]]);
          } else {
            taskRow.push('');
          }
        }
        
        // Добавляем в лист задач
        tasksSheet.appendRow(taskRow);
        
        // Форматируем дату
        if (tasksMap['Дата'] !== undefined) {
          const dateRow = tasksSheet.getLastRow();
          tasksSheet.getRange(dateRow, tasksMap['Дата'] + 1).setNumberFormat('dd.mm.yyyy');
        }
        
        // Удаляем из архива
        archiveSheet.deleteRow(i + 1);
        restoredCount++;
        Logger.log('✅ Задача восстановлена');
      }
    }
    
    Logger.log('Восстановлено задач для вебинара ' + webinarId + ': ' + restoredCount);
    Logger.log('=== restoreTasksByWebinarId_ END ===');
    return restoredCount;
  }
    /**
   * Добавить отдельную задачу
   */
  function addTask(data) {
    if (!data || !data.type) {
      throw new Error('Тип задачи обязателен');
    }
    
    const sheet = getSheet_(CONFIG.SHEETS.TASKS);
    if (sheet.getLastColumn() === 0) {
      throw new Error('Лист "Задачи" пустой — добавьте заголовки');
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const map = buildColumnMap_(headers);
    
    const id = data.id || Utilities.getUuid();
    
    const row = new Array(headers.length).fill('');
    
    if (map['ID'] !== undefined) row[map['ID']] = id;
    if (map['Вебинар ID'] !== undefined) row[map['Вебинар ID']] = data.webinarId || '';
    if (map['Вебинар'] !== undefined) row[map['Вебинар']] = data.webinarTitle || '';
    if (map['Тип'] !== undefined) row[map['Тип']] = data.type;
    if (map['Дата'] !== undefined) {
      if (data.plannedDate) {
        if (typeof data.plannedDate === 'string') {
          const dateParts = data.plannedDate.split('-');
          row[map['Дата']] = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        } else {
          row[map['Дата']] = data.plannedDate;
        }
      }
    }
    // НОВОЕ: Время напоминания
    if (map['Время напоминания'] !== undefined) {
      row[map['Время напоминания']] = data.reminderTime || '';
    }
    if (map['Ответственный'] !== undefined) row[map['Ответственный']] = data.owner || '';
    if (map['Email'] !== undefined) row[map['Email']] = data.email || '';
    if (map['Статус'] !== undefined) row[map['Статус']] = data.status || CONFIG.TASK_STATUS.PLANNED;
    if (map['EventID'] !== undefined) row[map['EventID']] = data.eventId || '';
    
    sheet.appendRow(row);
    
    // Форматируем дату
    if (map['Дата'] !== undefined && data.plannedDate) {
      sheet.getRange(sheet.getLastRow(), map['Дата'] + 1).setNumberFormat('dd.mm.yyyy');
    }
    
    Logger.log('✅ Задача добавлена: ' + id);
    return id;
  }
    /**
   * Получить задачи с напоминаниями на определенное время
   */
  function getTasksWithReminders() {
    const sheet = getSheet_(CONFIG.SHEETS.TASKS);
    if (sheet.getLastRow() < 2) return [];
    
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const map = buildColumnMap_(headers);
    
    if (map['Время напоминания'] === undefined) {
      Logger.log('Колонка "Время напоминания" не найдена');
      return [];
    }
    
    const result = [];
    const now = new Date();
    const todayStr = formatDateKey_(now);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    Logger.log('Текущее время: ' + currentHour + ':' + String(currentMinute).padStart(2, '0'));
    Logger.log('Сегодня: ' + todayStr);
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row.every(function(cell) { return cell === '' || cell == null; })) continue;
      
      const status = String(row[map['Статус']] || '').trim();
      if (status !== CONFIG.TASK_STATUS.PLANNED) continue;
      
      const reminderTimeValue = row[map['Время напоминания']];
      if (!reminderTimeValue) continue;
      
      let reminderHour, reminderMinute;
      
      if (typeof reminderTimeValue === 'string') {
        const timeParts = reminderTimeValue.split(':');
        if (timeParts.length !== 2) continue;
        reminderHour = parseInt(timeParts[0]);
        reminderMinute = parseInt(timeParts[1]);
      } else if (reminderTimeValue instanceof Date) {
        reminderHour = reminderTimeValue.getHours();
        reminderMinute = reminderTimeValue.getMinutes();
      } else {
        continue;
      }
      
      if (isNaN(reminderHour) || isNaN(reminderMinute)) continue;
      
      const plannedDate = normalizeDate_(row[map['Дата']]);
      if (!plannedDate) continue;
      
      const dateStr = formatDateKey_(plannedDate);
      if (dateStr !== todayStr) continue;
      
      const reminderTimeInMinutes = reminderHour * 60 + reminderMinute;
      
      Logger.log('Задача: ' + row[map['Тип']] + ', Время: ' + 
                 String(reminderHour).padStart(2, '0') + ':' + String(reminderMinute).padStart(2, '0'));
      
      const timeDiff = currentTime - reminderTimeInMinutes;
      
      Logger.log('Разница: ' + timeDiff + ' минут');
      
      // УВЕЛИЧЕН ДОПУСК до 20 минут (триггер работает каждые 15 минут)
      if (timeDiff >= 0 && timeDiff < 20) {
        result.push({
          id: String(row[map['ID']] || '').trim(),
          type: String(row[map['Тип']] || '').trim(),
          webinarTitle: String(row[map['Вебинар']] || '').trim(),
          plannedDate: plannedDate,
          reminderTime: String(reminderHour).padStart(2, '0') + ':' + String(reminderMinute).padStart(2, '0'),
          owner: String(row[map['Ответственный']] || '').trim(),
          email: String(row[map['Email']] || '').trim()
        });
        Logger.log('✅ Задача добавлена в список напоминаний');
      }
    }
    
    Logger.log('Всего задач для напоминания: ' + result.length);
    return result;
  }
  

      return {
    getWebinars: getWebinars,
    getWebinarById: getWebinarById,
    addWebinar: addWebinar,
    updateWebinar: updateWebinar,
    deleteWebinar: deleteWebinar,
    getTasks: getTasks,
    addTask: addTask,
    getTasksWithReminders: getTasksWithReminders,  // ← ДОБАВЬТЕ
    replaceAllTasks: replaceAllTasks,
    updateTaskEventId: updateTaskEventId,
    getHolidaysSet: getHolidaysSet,
    isHoliday: isHoliday,
    formatDateKey: formatDateKey_,
    normalizeDate: normalizeDate_,
    autoCompleteWebinars: autoCompleteWebinars,
    archiveTasksByWebinarId: archiveTasksByWebinarId,
    getArchiveTasks: getArchiveTasks,
    archiveTask: archiveTask,
    restoreTask: restoreTask,
    getArchiveWebinars: getArchiveWebinars,
    archiveWebinar: archiveWebinar,
    restoreWebinar: restoreWebinar
  };
})();

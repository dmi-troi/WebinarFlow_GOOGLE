// @ts-nocheck
/**
 * ==========================================================
 * WebinarFlow v2.0 - Main Web App
 * Основное веб-приложение (интерфейс)
 * ==========================================================
 */

function doGet(e) {
  try {
    Logger.log('doGet вызван для основного приложения');
    return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('WebinarFlow - Eurokappa Academy')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (err) {
    Logger.log('doGet error: ' + err.message);
    return ContentService.createTextOutput('Error: ' + err.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ========================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ СЕРИАЛИЗАЦИИ
// ========================================================

function serializeWebinar_(w) {
  return {
    id: String(w.id || ''),
    title: String(w.title || ''),
    date: w.date ? formatDateLocal_(w.date) : null,
    owner: String(w.owner || ''),
    email: String(w.email || ''),
    status: String(w.status || ''),
    notes: String(w.notes || '')
  };
}

function serializeTask_(t) {
  return {
    id: String(t.id || ''),
    webinarId: String(t.webinarId || ''),
    webinarTitle: String(t.webinarTitle || ''),
    type: String(t.type || ''),
    plannedDate: t.plannedDate ? formatDateLocal_(t.plannedDate) : null,
    owner: String(t.owner || ''),
    email: String(t.email || ''),
    status: String(t.status || ''),
    eventId: String(t.eventId || ''),
    reminderTime: t.reminderTime || '',
    notes: String(t.notes || '')
  };
}

function formatDateLocal_(date) {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

// ========================================================
// API ФУНКЦИИ
// ========================================================

function apiGetWebinars() {
  try {
    Logger.log('apiGetWebinars вызван');
    const webinars = DataModel.getWebinars();
    Logger.log('Вебинаров найдено: ' + webinars.length);
    return webinars.map(serializeWebinar_);
  } catch (e) {
    Logger.log('apiGetWebinars error: ' + e.message);
    return { error: e.message };
  }
}

function apiGetTasks() {
  try {
    Logger.log('apiGetTasks вызван');
    const tasks = DataModel.getTasks();
    Logger.log('Задач найдено: ' + tasks.length);
    return tasks.map(serializeTask_);
  } catch (e) {
    Logger.log('apiGetTasks error: ' + e.message);
    return { error: e.message };
  }
}

function apiGetDashboard() {
  try {
    Logger.log('apiGetDashboard вызван');
    
    try {
      DataModel.autoCompleteWebinars();
    } catch (e) {
      Logger.log('autoCompleteWebinars error: ' + e.message);
    }
    
    const webinars = DataModel.getWebinars();
    const tasks = DataModel.getTasks();
    Logger.log('Вебинаров: ' + webinars.length + ', Задач: ' + tasks.length);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const result = {
      webinars: {
        total: webinars.length || 0,
        active: webinars.filter(function(w) { return w.status === CONFIG.STATUS.ACTIVE || w.status === CONFIG.STATUS.PLANNED; }).length || 0,
        planned: webinars.filter(function(w) { return w.status === CONFIG.STATUS.PLANNED; }).length || 0,
        done: webinars.filter(function(w) { return w.status === CONFIG.STATUS.DONE; }).length || 0,
        cancelled: webinars.filter(function(w) { return w.status === CONFIG.STATUS.CANCELLED; }).length || 0
      },
      tasks: {
        total: tasks.length || 0,
        planned: tasks.filter(function(t) { return t.status === CONFIG.TASK_STATUS.PLANNED; }).length || 0,
        done: tasks.filter(function(t) { return t.status === CONFIG.TASK_STATUS.DONE; }).length || 0,
        today: tasks.filter(function(t) {
          if (!t.plannedDate) return false;
          const d = new Date(t.plannedDate);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        }).length || 0,
        tomorrow: tasks.filter(function(t) {
          if (!t.plannedDate) return false;
          const d = new Date(t.plannedDate);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === tomorrow.getTime();
        }).length || 0,
        thisWeek: tasks.filter(function(t) {
          if (!t.plannedDate) return false;
          const d = new Date(t.plannedDate);
          d.setHours(0, 0, 0, 0);
          return d >= today && d <= weekEnd;
        }).length || 0
      },
      nextTasks: tasks
        .filter(function(t) { return t.status === CONFIG.TASK_STATUS.PLANNED && t.plannedDate; })
        .sort(function(a, b) { return new Date(a.plannedDate) - new Date(b.plannedDate); })
        .slice(0, 5)
        .map(serializeTask_)
    };
    
    Logger.log('Dashboard данные подготовлены успешно');
    return result;
  } catch (e) {
    Logger.log('apiGetDashboard error: ' + e.message);
    return { error: e.message };
  }
}

function apiCreateWebinar(data) {
  try {
    Logger.log('Создание вебинара: ' + JSON.stringify(data));
    const id = DataModel.addWebinar({
      title: data.title,
      date: data.date,
      owner: data.owner,
      email: data.email,
      status: CONFIG.STATUS.PLANNED,
      notes: data.comment || ''
    });
    Logger.log('Вебинар создан с ID: ' + id);
    Logger.log('Запускаем пересчёт задач...');
    Planner.planAllWebinars();
    return { success: true, id: id };
  } catch (e) {
    Logger.log('Ошибка при создании вебинара: ' + e.message);
    return { error: e.message };
  }
}

function apiDeleteWebinar(id) {
  try {
    DataModel.deleteWebinar(id);
    Planner.planAllWebinars();
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

function apiUpdateWebinarDate(id, newDate) {
  try {
    Logger.log('apiUpdateWebinarDate: id=' + id + ', date=' + newDate);
    
    const updated = DataModel.updateWebinar(id, { 'Дата': newDate });
    
    if (updated) {
      Logger.log('Дата вебинара обновлена, пересчитываем задачи...');
      Planner.planAllWebinars();
      return { success: true };
    } else {
      throw new Error('Вебинар не найден');
    }
  } catch (e) {
    Logger.log('apiUpdateWebinarDate error: ' + e.message);
    return { error: e.message };
  }
}

function apiCompleteWebinar(id) {
  try {
    Logger.log('apiCompleteWebinar: id=' + id);
    
    const updated = DataModel.updateWebinar(id, { 'Статус': CONFIG.STATUS.DONE });
    
    if (updated) {
      Logger.log('Вебинар завершён');
      DataModel.archiveTasksByWebinarId(id);
      return { success: true };
    } else {
      throw new Error('Вебинар не найден');
    }
  } catch (e) {
    Logger.log('apiCompleteWebinar error: ' + e.message);
    return { error: e.message };
  }
}

function apiGetResponsibles() {
  try {
    const responsibles = Responsibles.getActive();
    return responsibles.map(function(r) {
      return {
        name: String(r.name || ''),
        email: String(r.email || ''),
        position: String(r.position || ''),
        phone: String(r.phone || ''),
        active: r.active
      };
    });
  } catch (e) {
    return { error: e.message };
  }
}

function apiGetCalendarData(year, month) {
  try {
    Logger.log('apiGetCalendarData вызван: ' + year + '-' + month);
    const webinars = DataModel.getWebinars();
    const tasks = DataModel.getTasks();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    Logger.log('Период: ' + startDate.toISOString().split('T')[0] + ' - ' + endDate.toISOString().split('T')[0]);
    const calendarEvents = [];
    
    webinars.forEach(function(w) {
      if (!w.date) return;
      const eventDate = new Date(w.date);
      eventDate.setHours(0, 0, 0, 0);
      if (eventDate >= startDate && eventDate <= endDate) {
        calendarEvents.push({
          date: formatDateLocal_(eventDate),
          type: 'webinar',
          title: w.title,
          owner: w.owner,
          status: w.status,
          color: '#2d4a7a',
          completed: w.status === CONFIG.STATUS.DONE
        });
      }
    });
    
    tasks.forEach(function(t) {
      if (!t.plannedDate) return;
      const eventDate = new Date(t.plannedDate);
      eventDate.setHours(0, 0, 0, 0);
      if (eventDate >= startDate && eventDate <= endDate) {
        let color = '#5b8def';
        if (t.type === 'Юнисендер') color = '#34a853';
        else if (t.type === 'МТС Link') color = '#fbbc04';
        else if (t.type === 'Напоминание') color = '#ea4335';
        
        const isCompleted = t.status === CONFIG.TASK_STATUS.DONE;
        
        calendarEvents.push({
          date: formatDateLocal_(eventDate),
          type: 'task',
          title: t.type + ': ' + t.webinarTitle,
          owner: t.owner,
          status: t.status,
          color: color,
          completed: isCompleted
        });
      }
    });
    
    Logger.log('Всего событий: ' + calendarEvents.length);
    return { events: calendarEvents, year: year, month: month };
  } catch (e) {
    Logger.log('apiGetCalendarData error: ' + e.message);
    return { error: e.message };
  }
}

function apiGetAppSettings() {
  try {
    return {
      DAYS_BEFORE_UNISENDER: Settings.getNumber('DAYS_BEFORE_UNISENDER') || 14,
      DAYS_BEFORE_MTSLINK: Settings.getNumber('DAYS_BEFORE_MTSLINK') || 7,
      DAYS_BEFORE_REMINDER: Settings.getNumber('DAYS_BEFORE_REMINDER') || 3,
      DAYS_BEFORE_EVENT: Settings.getNumber('DAYS_BEFORE_EVENT') || 0,
      TASK_TYPE_UNISENDER: Settings.get('TASK_TYPE_UNISENDER') || 'Юнисендер',
      TASK_TYPE_MTSLINK: Settings.get('TASK_TYPE_MTSLINK') || 'МТС Link',
      TASK_TYPE_REMINDER: Settings.get('TASK_TYPE_REMINDER') || 'Напоминание',
      TASK_TYPE_EVENT: Settings.get('TASK_TYPE_EVENT') || 'День мероприятия',
      AUTO_RECALCULATE: Settings.getBoolean('AUTO_RECALCULATE'),
      SHIFT_DIRECTION: Settings.get('SHIFT_DIRECTION') || 'backward',
      MAX_SHIFT_DAYS: Settings.getNumber('MAX_SHIFT_DAYS') || 14
    };
  } catch (e) {
    return { error: e.message };
  }
}

function apiSaveAppSettings(settings) {
  try {
    Settings.set('DAYS_BEFORE_UNISENDER', String(settings.DAYS_BEFORE_UNISENDER));
    Settings.set('DAYS_BEFORE_MTSLINK', String(settings.DAYS_BEFORE_MTSLINK));
    Settings.set('DAYS_BEFORE_REMINDER', String(settings.DAYS_BEFORE_REMINDER));
    Settings.set('DAYS_BEFORE_EVENT', String(settings.DAYS_BEFORE_EVENT));
    Settings.set('TASK_TYPE_UNISENDER', settings.TASK_TYPE_UNISENDER);
    Settings.set('TASK_TYPE_MTSLINK', settings.TASK_TYPE_MTSLINK);
    Settings.set('TASK_TYPE_REMINDER', settings.TASK_TYPE_REMINDER);
    Settings.set('TASK_TYPE_EVENT', settings.TASK_TYPE_EVENT);
    Settings.set('SHIFT_DIRECTION', settings.SHIFT_DIRECTION);
    Settings.set('MAX_SHIFT_DAYS', String(settings.MAX_SHIFT_DAYS));
    Settings.set('AUTO_RECALCULATE', String(settings.AUTO_RECALCULATE));
    CONFIG.TASK_TYPES.UNISENDER = settings.TASK_TYPE_UNISENDER;
    CONFIG.TASK_TYPES.MTSLINK = settings.TASK_TYPE_MTSLINK;
    CONFIG.TASK_TYPES.REMINDER = settings.TASK_TYPE_REMINDER;
    CONFIG.TASK_TYPES.EVENT = settings.TASK_TYPE_EVENT;
    Planner.planAllWebinars();
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

function apiUpdateTaskResponsible(taskId, newOwner) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.TASKS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    let idCol = -1, ownerCol = -1, emailCol = -1;
    for (let i = 0; i < headers.length; i++) {
      if (String(headers[i]).trim() === 'ID') idCol = i;
      if (String(headers[i]).trim() === 'Ответственный') ownerCol = i;
      if (String(headers[i]).trim() === 'Email') emailCol = i;
    }
    if (idCol === -1 || ownerCol === -1) {
      throw new Error('Не найдены колонки ID или Ответственный');
    }
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]).trim() === String(taskId).trim()) {
        sheet.getRange(i + 1, ownerCol + 1).setValue(newOwner);
        if (emailCol !== -1 && newOwner) {
          const responsibles = Responsibles.getActive();
          const responsible = responsibles.find(function(r) { return r.name === newOwner; });
          if (responsible && responsible.email) {
            sheet.getRange(i + 1, emailCol + 1).setValue(responsible.email);
          }
        }
        return { success: true };
      }
    }
    throw new Error('Задача не найдена');
  } catch (e) {
    return { error: e.message };
  }
}

function apiGetResponsiblesList() {
  try {
    const responsibles = Responsibles.getActive();
    return responsibles.map(function(r) {
      return {
        name: String(r.name || ''),
        email: String(r.email || ''),
        position: String(r.position || ''),
        phone: String(r.phone || ''),
        active: r.active
      };
    });
  } catch (e) {
    return { error: e.message };
  }
}

function apiUpdateTaskStatus(taskId, newStatus) {
  try {
    Logger.log('apiUpdateTaskStatus: taskId=' + taskId + ', status=' + newStatus);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.TASKS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    let idCol = -1, statusCol = -1;
    for (let i = 0; i < headers.length; i++) {
      if (String(headers[i]).trim() === 'ID') idCol = i;
      if (String(headers[i]).trim() === 'Статус') statusCol = i;
    }
    if (idCol === -1 || statusCol === -1) {
      throw new Error('Не найдены колонки ID или Статус');
    }
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]).trim() === String(taskId).trim()) {
        sheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
        Logger.log('✅ Статус обновлён');
        return { success: true };
      }
    }
    throw new Error('Задача не найдена');
  } catch (e) {
    Logger.log('apiUpdateTaskStatus error: ' + e.message);
    return { error: e.message };
  }
}

function apiUpdateTaskDate(taskId, newDate) {
  try {
    Logger.log('apiUpdateTaskDate: taskId=' + taskId + ', date=' + newDate);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.TASKS);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    let idCol = -1, dateCol = -1;
    for (let i = 0; i < headers.length; i++) {
      if (String(headers[i]).trim() === 'ID') idCol = i;
      if (String(headers[i]).trim() === 'Дата') dateCol = i;
    }
    if (idCol === -1 || dateCol === -1) {
      throw new Error('Не найдены колонки ID или Дата');
    }
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]).trim() === String(taskId).trim()) {
        const dateParts = newDate.split('-');
        const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        sheet.getRange(i + 1, dateCol + 1).setValue(dateObj);
        sheet.getRange(i + 1, dateCol + 1).setNumberFormat('dd.mm.yyyy');
        Logger.log('✅ Дата обновлена');
        return { success: true };
      }
    }
    throw new Error('Задача не найдена');
  } catch (e) {
    Logger.log('apiUpdateTaskDate error: ' + e.message);
    return { error: e.message };
  }
}

function apiRecalculateSystem() {
  try {
    Logger.log('apiRecalculateSystem вызван');
    Planner.planAllWebinars();
    return { success: true };
  } catch (e) {
    Logger.log('apiRecalculateSystem error: ' + e.message);
    return { error: e.message };
  }
}

// ========================================================
// API ФУНКЦИИ ДЛЯ АРХИВА
// ========================================================

function apiGetArchive() {
  try {
    Logger.log('apiGetArchive вызван');
    const archiveWebinars = DataModel.getArchiveWebinars();
    const archiveTasks = DataModel.getArchiveTasks();
    Logger.log('Архивных вебинаров: ' + archiveWebinars.length + ', задач: ' + archiveTasks.length);
    return {
      webinars: archiveWebinars.map(serializeWebinar_),
      tasks: archiveTasks.map(serializeTask_)
    };
  } catch (e) {
    Logger.log('apiGetArchive error: ' + e.message);
    return { error: e.message };
  }
}

function apiArchiveWebinar(id) {
  try {
    Logger.log('apiArchiveWebinar: id=' + id);
    DataModel.archiveWebinar(id);
    return { success: true };
  } catch (e) {
    Logger.log('apiArchiveWebinar error: ' + e.message);
    return { error: e.message };
  }
}

function apiArchiveTask(id) {
  try {
    Logger.log('apiArchiveTask: id=' + id);
    DataModel.archiveTask(id);
    return { success: true };
  } catch (e) {
    Logger.log('apiArchiveTask error: ' + e.message);
    return { error: e.message };
  }
}

function apiRestoreWebinar(id) {
  try {
    Logger.log('apiRestoreWebinar: id=' + id);
    DataModel.restoreWebinar(id);
    return { success: true };
  } catch (e) {
    Logger.log('apiRestoreWebinar error: ' + e.message);
    return { error: e.message };
  }
}

function apiRestoreTask(id) {
  try {
    Logger.log('apiRestoreTask: id=' + id);
    DataModel.restoreTask(id);
    return { success: true };
  } catch (e) {
    Logger.log('apiRestoreTask error: ' + e.message);
    return { error: e.message };
  }
}

/**
 * Создать отдельную задачу (не от вебинара)
 */
function apiCreateTask(data) {
  try {
    Logger.log('Создание задачи: ' + JSON.stringify(data));
    
    if (!data || !data.type || !data.plannedDate) {
      throw new Error('Тип задачи и дата обязательны');
    }
    
    const id = DataModel.addTask({
      webinarId: data.webinarId || '',
      webinarTitle: data.webinarTitle || '',
      type: data.type,
      plannedDate: data.plannedDate,
      owner: data.owner || '',
      email: data.email || '',
      status: data.status || CONFIG.TASK_STATUS.PLANNED,
      notes: data.notes || '',
      reminderTime: data.reminderTime || ''
    });
    
    Logger.log('✅ Задача создана с ID: ' + id);
    return { success: true, id: id };
  } catch (e) {
    Logger.log('apiCreateTask error: ' + e.message);
    Logger.log(e.stack);
    return { error: e.message };
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
      reminderCol = headers.length;
      sheet.getRange(1, reminderCol + 1).setValue('Время напоминания');
      Logger.log('Колонка "Время напоминания" добавлена');
    }
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]).trim() === String(taskId).trim()) {
        sheet.getRange(i + 1, reminderCol + 1).setValue(String(reminderTime || ''));
        Logger.log('✅ Время напоминания обновлено: ' + reminderTime);
        return { success: true };
      }
    }
    
    throw new Error('Задача не найдена');
    
  } catch (e) {
    Logger.log('apiUpdateTaskReminderTime error: ' + e.message);
    return { error: e.message };
  }
}
}

/**
 * ==========================================================
 * WebinarFlow v2.0
 * Dashboard.gs
 * Сбор и отображение статистики
 * ==========================================================
 */

const Dashboard = (function () {
  
  function updateDashboard() {
    Logger.log('=== updateDashboard START ===');
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(CONFIG.SHEETS.DASHBOARD);
    
    if (!sheet) {
      Logger.log('Лист Dashboard не найден');
      return;
    }
    
    // Очищаем лист (кроме заголовка)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, Math.max(0, lastRow - 1), sheet.getLastColumn()).clearContent();
    }
    
    const stats = collectStatistics();
    
    // Формируем данные ПРАВИЛЬНО - всегда 2 колонки
    const data = [
      ['📅 ВЕБИНАРЫ', ''],
      ['Всего вебинаров', String(stats.webinars.total)],
      ['Активных', String(stats.webinars.active)],
      ['Запланированных', String(stats.webinars.planned)],
      ['Проведённых', String(stats.webinars.done)],
      ['Отменённых', String(stats.webinars.cancelled)],
      [''],
      ['📨 ЗАДАЧИ', ''],
      ['Всего задач', String(stats.tasks.total)],
      ['Запланировано', String(stats.tasks.planned)],
      ['Выполнено', String(stats.tasks.done)],
      ['Просрочено', String(stats.tasks.overdue)],
      ['Отменено', String(stats.tasks.cancelled)],
      [''],
      ['📆 БЛИЖАЙШИЕ СОБЫТИЯ', ''],
      ['Задач на сегодня', String(stats.tasks.today)],
      ['Задач на завтра', String(stats.tasks.tomorrow)],
      ['Задач на неделю', String(stats.tasks.thisWeek)],
      [''],
      ['📊 ПРОДУКТИВНОСТЬ', ''],
      ['Процент выполнения', String(stats.productivity.completionRate) + '%'],
      ['Средняя загрузка в день', String(stats.productivity.avgTasksPerDay)]
    ];
    
    // Проверяем что все строки имеют 2 колонки
    for (let i = 0; i < data.length; i++) {
      if (data[i].length !== 2) {
        Logger.log('Ошибка: строка ' + i + ' имеет ' + data[i].length + ' колонок');
        while (data[i].length < 2) {
          data[i].push('');
        }
        if (data[i].length > 2) {
          data[i].length = 2;
        }
      }
    }
    
    // Записываем данные
    if (data.length > 0) {
      try {
        sheet.getRange(2, 1, data.length, 2).setValues(data);
        Logger.log('✅ Dashboard обновлён: ' + data.length + ' строк');
      } catch (e) {
        Logger.log('❌ Ошибка записи Dashboard: ' + e.message);
        throw e;
      }
    }
    
    // Форматирование
    formatDashboard(sheet);
    
    Logger.log('=== updateDashboard END ===');
  }
  
  function collectStatistics() {
    const webinars = DataModel.getWebinars();
    const tasks = DataModel.getTasks();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    return {
      webinars: {
        total: webinars.length || 0,
        active: webinars.filter(function(w) { return w.status === CONFIG.STATUS.ACTIVE; }).length || 0,
        planned: webinars.filter(function(w) { return w.status === CONFIG.STATUS.PLANNED; }).length || 0,
        done: webinars.filter(function(w) { return w.status === CONFIG.STATUS.DONE; }).length || 0,
        cancelled: webinars.filter(function(w) { return w.status === CONFIG.STATUS.CANCELLED; }).length || 0
      },
      
      tasks: {
        total: tasks.length || 0,
        planned: tasks.filter(function(t) { return t.status === CONFIG.TASK_STATUS.PLANNED; }).length || 0,
        done: tasks.filter(function(t) { return t.status === CONFIG.TASK_STATUS.DONE; }).length || 0,
        overdue: tasks.filter(function(t) {
          if (!t.plannedDate || t.status !== CONFIG.TASK_STATUS.PLANNED) return false;
          const taskDate = new Date(t.plannedDate);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate < today;
        }).length || 0,
        cancelled: tasks.filter(function(t) { return t.status === CONFIG.TASK_STATUS.CANCELLED; }).length || 0,
        
        today: tasks.filter(function(t) {
          if (!t.plannedDate) return false;
          const taskDate = new Date(t.plannedDate);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime();
        }).length || 0,
        
        tomorrow: tasks.filter(function(t) {
          if (!t.plannedDate) return false;
          const taskDate = new Date(t.plannedDate);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === tomorrow.getTime();
        }).length || 0,
        
        thisWeek: tasks.filter(function(t) {
          if (!t.plannedDate) return false;
          const taskDate = new Date(t.plannedDate);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate >= today && taskDate <= weekEnd;
        }).length || 0
      },
      
      productivity: {
        completionRate: calculateCompletionRate(tasks) || 0,
        avgTasksPerDay: calculateAvgTasksPerDay(tasks) || 0
      }
    };
  }
  
  function calculateCompletionRate(tasks) {
    const completed = tasks.filter(function(t) { return t.status === CONFIG.TASK_STATUS.DONE; }).length;
    const total = tasks.filter(function(t) { return t.status !== CONFIG.TASK_STATUS.CANCELLED; }).length;
    
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }
  
  function calculateAvgTasksPerDay(tasks) {
    const plannedTasks = tasks.filter(function(t) { 
      return t.status === CONFIG.TASK_STATUS.PLANNED && t.plannedDate;
    });
    
    if (plannedTasks.length === 0) return 0;
    
    const dates = {};
    plannedTasks.forEach(function(t) {
      const d = new Date(t.plannedDate).toDateString();
      dates[d] = true;
    });
    
    const uniqueDays = Object.keys(dates).length;
    if (uniqueDays === 0) return 0;
    
    return (plannedTasks.length / uniqueDays).toFixed(1);
  }
  
  function formatDashboard(sheet) {
    // Заголовки секций
    const headers = sheet.getRange("A2:A").getValues();
    
    headers.forEach(function(row, index) {
      if (row[0] && typeof row[0] === 'string' && 
          (row[0].indexOf('📅') !== -1 || row[0].indexOf('📨') !== -1 || 
           row[0].indexOf('📆') !== -1 || row[0].indexOf('📊') !== -1)) {
        
        const range = sheet.getRange(index + 2, 1, 1, 2);
        range.setBackground("#4285f4");
        range.setFontColor("#ffffff");
        range.setFontWeight("bold");
      }
    });
    
    // Ширина колонок
    sheet.setColumnWidth(1, 250);
    sheet.setColumnWidth(2, 100);
  }
  
  return {
    updateDashboard: updateDashboard
  };
  
})();

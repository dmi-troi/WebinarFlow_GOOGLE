/**
 * ==========================================================
 * WebinarFlow v2.0
 * DashboardUI.gs
 * Красивый интерфейс Dashboard
 * ==========================================================
 */

const DashboardUI = (function () {
  
  function updateDashboard() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(CONFIG.SHEETS.DASHBOARD);
    
    if (!sheet) return;
    
    // Очищаем лист
    sheet.clear();
    
    const stats = collectStatistics();
    
    // === ЗАГОЛОВОК ===
    sheet.getRange(1, 1, 1, 4).merge();
    sheet.getRange(1, 1).setValue('📊 DASHBOARD WEBINARFLOW');
    sheet.getRange(1, 1)
      .setFontSize(18)
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setBackground('#1a73e8')
      .setFontColor('#ffffff');
    sheet.setRowHeight(1, 50);
    
    // === КАРТОЧКИ СТАТИСТИКИ ===
    const cards = [
      { label: 'Всего вебинаров', value: stats.webinars.total, icon: '📅', color: '#4285f4' },
      { label: 'Активных', value: stats.webinars.active, icon: '✅', color: '#34a853' },
      { label: 'Запланировано', value: stats.webinars.planned, icon: '📋', color: '#fbbc04' },
      { label: 'Проведено', value: stats.webinars.done, icon: '🎉', color: '#ea4335' },
      { label: 'Всего задач', value: stats.tasks.total, icon: '📨', color: '#4285f4' },
      { label: 'На сегодня', value: stats.tasks.today, icon: '⏰', color: '#ea4335' },
      { label: 'На завтра', value: stats.tasks.tomorrow, icon: '📆', color: '#fbbc04' },
      { label: 'Выполнено', value: stats.tasks.done, icon: '✅', color: '#34a853' }
    ];
    
    // Заголовки карточек (строка 3)
    sheet.getRange(3, 1, 1, 4).merge();
    sheet.getRange(3, 1).setValue(' ОСНОВНЫЕ ПОКАЗАТЕЛИ');
    sheet.getRange(3, 1)
      .setFontSize(14)
      .setFontWeight('bold')
      .setBackground('#f8f9fa')
      .setHorizontalAlignment('left');
    
    // Карточки (строки 4-5)
    let col = 1;
    cards.forEach(function(card) {
      // Метка
      sheet.getRange(4, col).setValue(card.icon + ' ' + card.label);
      sheet.getRange(4, col)
        .setFontWeight('bold')
        .setFontSize(11)
        .setHorizontalAlignment('center')
        .setBackground(card.color)
        .setFontColor('#ffffff');
      
      // Значение
      sheet.getRange(5, col).setValue(card.value);
      sheet.getRange(5, col)
        .setFontSize(24)
        .setFontWeight('bold')
        .setHorizontalAlignment('center')
        .setBackground('#f8f9fa');
      
      sheet.setColumnWidth(col, 150);
      col++;
    });
    
    // === БЛИЖАЙШИЕ ЗАДАЧИ ===
    const nextRow = 7;
    sheet.getRange(nextRow, 1, 1, 4).merge();
    sheet.getRange(nextRow, 1).setValue('📋 БЛИЖАЙШИЕ ЗАДАЧИ');
    sheet.getRange(nextRow, 1)
      .setFontSize(14)
      .setFontWeight('bold')
      .setBackground('#f8f9fa');
    
    // Получаем задачи на сегодня и завтра
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tasks = DataModel.getTasks().filter(function(t) {
      if (!t.plannedDate || t.status !== CONFIG.TASK_STATUS.PLANNED) return false;
      const taskDate = new Date(t.plannedDate);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === today.getTime() || taskDate.getTime() === tomorrow.getTime();
    });
    
    if (tasks.length > 0) {
      // Заголовки таблицы
      const headers = ['Дата', 'Тип', 'Вебинар', 'Ответственный'];
      sheet.getRange(nextRow + 1, 1, 1, 4).setValues([headers]);
      sheet.getRange(nextRow + 1, 1, 1, 4)
        .setFontWeight('bold')
        .setBackground('#4285f4')
        .setFontColor('#ffffff')
        .setHorizontalAlignment('center');
      
      // Данные
      const data = tasks.slice(0, 10).map(function(t) {
        const dateStr = t.plannedDate ? Utilities.formatDate(new Date(t.plannedDate), Session.getScriptTimeZone(), 'dd.mm.yyyy') : '';
        return [dateStr, t.type, t.webinarTitle, t.owner];
      });
      
      if (data.length > 0) {
        sheet.getRange(nextRow + 2, 1, data.length, 4).setValues(data);
        sheet.getRange(nextRow + 2, 1, data.length, 4).setHorizontalAlignment('center');
      }
    } else {
      sheet.getRange(nextRow + 1, 1).setValue('Нет ближайших задач ✅');
      sheet.getRange(nextRow + 1, 1).setFontSize(12).setFontColor('#34a853');
    }
    
    // === СТАТИСТИКА ПО ТИПАМ ЗАДАЧ ===
    const statsRow = nextRow + 15;
    sheet.getRange(statsRow, 1, 1, 4).merge();
    sheet.getRange(statsRow, 1).setValue('📊 СТАТИСТИКА ПО ТИПАМ');
    sheet.getRange(statsRow, 1)
      .setFontSize(14)
      .setFontWeight('bold')
      .setBackground('#f8f9fa');
    
    const typeStats = [
      ['Юнисендер', countTasksByType(tasks, 'Юнисендер'), '#34a853'],
      ['МТС Link', countTasksByType(tasks, 'МТС Link'), '#fbbc04'],
      ['Напоминание', countTasksByType(tasks, 'Напоминание'), '#ea4335'],
      ['День мероприятия', countTasksByType(tasks, 'День мероприятия'), '#4285f4']
    ];
    
    sheet.getRange(statsRow + 1, 1, 1, 3).setValues([['Тип', 'Количество', '']]);
    sheet.getRange(statsRow + 1, 1, 1, 3)
      .setFontWeight('bold')
      .setBackground('#4285f4')
      .setFontColor('#ffffff');
    
    typeStats.forEach(function(stat, index) {
      sheet.getRange(statsRow + 2 + index, 1, 1, 3).setValues([[stat[0], stat[1], '']]);
      sheet.getRange(statsRow + 2 + index, 1).setBackground(stat[2]).setFontColor('#ffffff').setFontWeight('bold');
      sheet.getRange(statsRow + 2 + index, 2).setHorizontalAlignment('center');
    });
    
    // === ПОСЛЕДНЕЕ ОБНОВЛЕНИЕ ===
    const lastRow = sheet.getLastRow() + 2;
    sheet.getRange(lastRow, 1, 1, 4).merge();
    sheet.getRange(lastRow, 1).setValue('🔄 Обновлено: ' + new Date().toLocaleString('ru-RU'));
    sheet.getRange(lastRow, 1).setFontSize(10).setFontColor('#666666').setHorizontalAlignment('right');
    
    // Форматирование
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(1);
    
    Logger.log('✅ Dashboard обновлён');
  }
  
  function collectStatistics() {
    const webinars = DataModel.getWebinars();
    const tasks = DataModel.getTasks();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
      webinars: {
        total: webinars.length || 0,
        active: webinars.filter(function(w) { return w.status === CONFIG.STATUS.ACTIVE; }).length || 0,
        planned: webinars.filter(function(w) { return w.status === CONFIG.STATUS.PLANNED; }).length || 0,
        done: webinars.filter(function(w) { return w.status === CONFIG.STATUS.DONE; }).length || 0
      },
      tasks: {
        total: tasks.length || 0,
        planned: tasks.filter(function(t) { return t.status === CONFIG.TASK_STATUS.PLANNED; }).length || 0,
        done: tasks.filter(function(t) { return t.status === CONFIG.TASK_STATUS.DONE; }).length || 0,
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
        }).length || 0
      }
    };
  }
  
  function countTasksByType(tasks, type) {
    return tasks.filter(function(t) { return t.type === type; }).length;
  }
  
  return {
    updateDashboard: updateDashboard
  };
  
})();

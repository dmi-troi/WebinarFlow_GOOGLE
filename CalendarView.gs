/**
 * ==========================================================
 * WebinarFlow v2.0
 * CalendarView.gs
 * Визуальное отображение задач в виде календаря
 * ==========================================================
 */

const CalendarView = (function () {
  
  /**
   * Обновить визуальный календарь на листе "Календарь"
   * @param {Date} month месяц для отображения (по умолчанию текущий)
   */
  function updateCalendarView(month) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(CONFIG.SHEETS.CALENDAR);
    
    if (!sheet) {
      throw new Error('Лист "Календарь" не найден');
    }
    
    // Если месяц не указан, используем текущий
    if (!month) {
      month = new Date();
    }
    
    const year = month.getFullYear();
    const monthIndex = month.getMonth(); // 0-11
    
    // Очищаем лист
    sheet.clear();
    
    // Заголовок
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    
    sheet.getRange(1, 1, 1, 7).merge();
    sheet.getRange(1, 1).setValue(`${monthNames[monthIndex]} ${year}`);
    sheet.getRange(1, 1).setFontSize(16).setFontWeight('bold').setHorizontalAlignment('center');
    
    // Дни недели
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    sheet.getRange(2, 1, 1, 7).setValues([weekDays]);
    sheet.getRange(2, 1, 1, 7).setFontWeight('bold').setHorizontalAlignment('center')
         .setBackground('#4285f4').setFontColor('#ffffff');
    
    // Получаем задачи
    const tasks = DataModel.getTasks();
    
    // Первый день месяца
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // День недели первого дня (0=Вс, 1=Пн, ..., 6=Сб)
    let startDayOfWeek = firstDay.getDay();
    // Преобразуем в формат Пн=0, Вт=1, ..., Вс=6
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    // Заполняем календарь
    let row = 3;
    let col = startDayOfWeek + 1;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, monthIndex, day);
      const dateKey = DataModel.formatDateKey(currentDate);
      
      // Находим задачи на эту дату
      const dayTasks = tasks.filter(t => {
        if (!t.plannedDate) return false;
        const taskDate = new Date(t.plannedDate);
        return DataModel.formatDateKey(taskDate) === dateKey;
      });
      
      // Формируем текст ячейки
      let cellText = String(day);
      if (dayTasks.length > 0) {
        cellText += '\n' + dayTasks.map(t => `• ${t.type}: ${t.webinarTitle}`).join('\n');
      }
      
      const cell = sheet.getRange(row, col);
      cell.setValue(cellText);
      cell.setHorizontalAlignment('top');
      cell.setVerticalAlignment('top');
      cell.setWrap(true);
      
      // Цвет фона для выходных
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        cell.setBackground('#f0f0f0');
      }
      
      // Цвет текста для дней с задачами
      if (dayTasks.length > 0) {
        cell.setFontWeight('bold');
        
        // Цвет по типу задачи (берём первую)
        const colorMap = {
          'Юнисендер': '#90ee90',      // светло-зелёный
          'МТС Link': '#fffacd',       // светло-жёлтый
          'Напоминание': '#ffd700',    // золотой
          'День мероприятия': '#ff6b6b' // светло-красный
        };
        
        const firstTaskType = dayTasks[0].type;
        if (colorMap[firstTaskType]) {
          cell.setBackground(colorMap[firstTaskType]);
        }
      }
      
      // Переход на следующий день
      col++;
      if (col > 7) {
        col = 1;
        row++;
      }
    }
    
    // Устанавливаем высоту строк
    for (let r = 3; r <= row; r++) {
      sheet.setRowHeight(r, 80);
    }
    
    // Устанавливаем ширину колонок
    sheet.setColumnWidths(1, 7, 120);
    
    Logger.log(`Календарь обновлён: ${monthNames[monthIndex]} ${year}`);
  }
  
  /**
   * Показать календарь на текущий месяц
   */
  function showCurrentMonth() {
    updateCalendarView(new Date());
  }
  
  /**
   * Показать календарь на следующий месяц
   */
  function showNextMonth() {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    updateCalendarView(nextMonth);
  }
  
  /**
   * Показать календарь на предыдущий месяц
   */
  function showPreviousMonth() {
    const prevMonth = new Date();
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    updateCalendarView(prevMonth);
  }
  
  return {
    updateCalendarView,
    showCurrentMonth,
    showNextMonth,
    showPreviousMonth
  };
  
})();

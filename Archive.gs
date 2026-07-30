/**
 * ==========================================================
 * WebinarFlow v2.0
 * Archive.gs
 * Архивация завершённых и отменённых вебинаров
 * ==========================================================
 */

const Archive = (function () {
  
  /**
   * Архивировать вебинары со статусом "Проведён" или "Отменён"
   */
  function archiveCompletedWebinars() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const webinarsSheet = ss.getSheetByName(CONFIG.SHEETS.WEBINARS);
    const archiveSheet = ss.getSheetByName(CONFIG.SHEETS.ARCHIVE);
    
    if (!webinarsSheet || !archiveSheet) {
      throw new Error('Не найдены листы "Вебинары" или "Архив"');
    }
    
    const webinars = DataModel.getWebinars();
    const toArchive = webinars.filter(w => 
      w.status === CONFIG.STATUS.DONE || w.status === CONFIG.STATUS.CANCELLED
    );
    
    if (toArchive.length === 0) {
      return { archived: 0, message: 'Нет вебинаров для архивации' };
    }
    
    // Добавляем в архив
    toArchive.forEach(webinar => {
      archiveSheet.appendRow([
        new Date(), // Дата архивации
        webinar.id,
        webinar.title,
        webinar.date,
        webinar.owner,
        webinar.email,
        webinar.status,
        webinar.notes
      ]);
      
      // Удаляем из основного листа
      DataModel.deleteWebinar(webinar.id);
    });
    
    Logger.log('Архивировано вебинаров: ' + toArchive.length);
    
    return {
      archived: toArchive.length,
      message: 'Архивировано: ' + toArchive.length
    };
  }
  
  /**
   * Получить все архивные вебинары
   */
  function getAll() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(CONFIG.SHEETS.ARCHIVE);
    
    if (!sheet || sheet.getLastRow() < 2) return [];
    
    const values = sheet.getDataRange().getValues();
    const archived = [];
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (!row[0] && !row[1]) continue;
      
      archived.push({
        archiveDate: row[0],
        id: row[1],
        title: row[2],
        date: row[3],
        owner: row[4],
        email: row[5],
        status: row[6],
        notes: row[7]
      });
    }
    
    return archived;
  }
  
  /**
   * Очистить архив
   */
  function clear() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(CONFIG.SHEETS.ARCHIVE);
    
    if (!sheet) return false;
    
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
           .clearContent();
    }
    
    Logger.log('Архив очищен');
    return true;
  }
  
  return {
    archiveCompletedWebinars,
    getAll,
    clear
  };
  
})();

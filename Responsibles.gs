/**
 * ==========================================================
 * WebinarFlow v2.0
 * Responsibles.gs
 * Управление ответственными
 * ==========================================================
 */

const Responsibles = (function () {
  
  function getSheet_() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(CONFIG.SHEETS.RESPONSIBLES);
    
    if (!sheet) {
      throw new Error('Лист "' + CONFIG.SHEETS.RESPONSIBLES + '" не найден');
    }
    return sheet;
  }
  
  function getAll() {
    const sheet = getSheet_();
    if (sheet.getLastRow() < 2) return [];
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    let nameCol = -1, emailCol = -1, positionCol = -1, phoneCol = -1, activeCol = -1;
    
    for (let i = 0; i < headers.length; i++) {
      const h = String(headers[i]).trim();
      if (h === 'Имя') nameCol = i;
      else if (h === 'Email') emailCol = i;
      else if (h === 'Должность') positionCol = i;
      else if (h === 'Телефон') phoneCol = i;
      else if (h === 'Активен') activeCol = i;
    }
    
    const result = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      result.push({
        name: String(row[nameCol] || '').trim(),
        email: String(row[emailCol] || '').trim(),
        position: String(row[positionCol] || '').trim(),
        phone: String(row[phoneCol] || '').trim(),
        active: activeCol === -1 ? true : String(row[activeCol] || 'true').toLowerCase() === 'true'
      });
    }
    
    return result;
  }
  
  function getActive() {
    return getAll().filter(function(r) { return r.active === true; });
  }
  
  function add(name, email, position, phone) {
    const sheet = getSheet_();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    let nameCol = -1, emailCol = -1, positionCol = -1, phoneCol = -1, activeCol = -1;
    
    for (let i = 0; i < headers.length; i++) {
      const h = String(headers[i]).trim();
      if (h === 'Имя') nameCol = i;
      else if (h === 'Email') emailCol = i;
      else if (h === 'Должность') positionCol = i;
      else if (h === 'Телефон') phoneCol = i;
      else if (h === 'Активен') activeCol = i;
    }
    
    const row = new Array(headers.length).fill('');
    if (nameCol !== -1) row[nameCol] = name;
    if (emailCol !== -1) row[emailCol] = email;
    if (positionCol !== -1) row[positionCol] = position;
    if (phoneCol !== -1) row[phoneCol] = phone;
    if (activeCol !== -1) row[activeCol] = 'true';
    
    sheet.appendRow(row);
    Logger.log('✅ Ответственный добавлен: ' + name);
    return true;
  }
  
  return {
    getAll: getAll,
    getActive: getActive,
    add: add
  };
  
})();

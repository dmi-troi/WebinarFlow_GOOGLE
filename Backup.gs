/**
 * ==========================================================
 * WebinarFlow v2.0
 * Backup.gs
 * Резервное копирование данных
 * ==========================================================
 */

const Backup = (function () {
  
  function createBackup() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = 'WebinarFlow_Backup_' + timestamp;
    
    const backup = ss.copy(backupName);
    
    Logger.log('✅ Резервная копия создана: ' + backupName);
    Logger.log('URL: ' + backup.getUrl());
    
    return backup.getUrl();
  }
  
  function autoBackup() {
    if (!Settings.getBoolean('BACKUP_ENABLED')) {
      Logger.log('Автобэкап отключён');
      return;
    }
    
    try {
      createBackup();
    } catch (e) {
      Logger.log('Ошибка автобэкапа: ' + e.message);
    }
  }
  
  return {
    createBackup: createBackup,
    autoBackup: autoBackup
  };
  
})();

function createBackupNow() {
  const url = Backup.createBackup();
  SpreadsheetApp.getUi().alert('✅ Резервная копия создана!\n\n' + url);
}

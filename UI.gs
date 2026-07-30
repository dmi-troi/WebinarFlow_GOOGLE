/**
 * ==========================================================
 * WebinarFlow v2.0
 * UI.gs
 * Пользовательский интерфейс: диалоги и вспомогательные функции
 * ==========================================================
 */

/**
 * Устанавливает триггер onOpen при первом запуске.
 */
function installTrigger() {
  // Удаляем старые триггеры
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'onOpen') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Создаём новый триггер
  ScriptApp.newTrigger('onOpen')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onOpen()
    .create();
  
  SpreadsheetApp.getUi().alert('✅ Меню установлено.\n\nПерезагрузите таблицу (F5).\n\nЭТО СООБЩЕНИЕ БОЛЬШЕ НЕ ПОЯВИТСЯ.');
}

// ========================================================
// ДИАЛОГИ ДЛЯ ВЕБИНАРОВ
// ========================================================

/**
 * Показывает диалог редактирования вебинара.
 */
function showEditWebinarDialog() {
  const webinars = DataModel.getWebinars();
  
  if (webinars.length === 0) {
    SpreadsheetApp.getUi().alert('Нет вебинаров для редактирования.');
    return;
  }
  
  // Формируем опции для select
  let optionsHtml = '<option value="">— Выберите вебинар —</option>';
  webinars.forEach(function(w) {
    const dateStr = w.date ? Utilities.formatDate(new Date(w.date), Session.getScriptTimeZone(), 'dd.mm.yyyy') : 'без даты';
    optionsHtml += '<option value="' + w.id + '">' + w.title + ' (' + dateStr + ')</option>';
  });
  
  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      .form-group { margin-bottom: 15px; }
      label { display: block; margin-bottom: 5px; font-weight: bold; }
      input, select { width: 100%; padding: 8px; box-sizing: border-box; }
      button { padding: 10px 20px; margin-right: 10px; cursor: pointer; border: none; border-radius: 4px; }
      .btn-primary { background: #4285f4; color: white; }
      .btn-secondary { background: #f1f1f1; border: 1px solid #ccc; }
      #status { margin-top: 10px; font-size: 13px; }
    </style>
    
    <h3>✏️ Редактировать вебинар</h3>
    
    <div class="form-group">
      <label>Выберите вебинар *</label>
      <select id="webinarId" onchange="loadWebinar()">
        ` + optionsHtml + `
      </select>
    </div>
    
    <div class="form-group">
      <label>Название *</label>
      <input type="text" id="title">
    </div>
    
    <div class="form-group">
      <label>Дата *</label>
      <input type="date" id="date">
    </div>
    
    <div class="form-group">
      <label>Ответственный</label>
      <input type="text" id="owner">
    </div>
    
    <div class="form-group">
      <label>Email</label>
      <input type="email" id="email">
    </div>
    
    <div class="form-group">
      <label>Статус</label>
      <select id="status">
        <option value="Планируется">Планируется</option>
        <option value="Подготовка">Подготовка</option>
        <option value="Проведён">Проведён</option>
        <option value="Отменён">Отменён</option>
      </select>
    </div>
    
    <div class="form-group">
      <label>Примечание</label>
      <input type="text" id="notes">
    </div>
    
    <button class="btn-primary" onclick="submitForm()">Сохранить</button>
    <button class="btn-secondary" onclick="google.script.host.close()">Отмена</button>
    
    <div id="status"></div>
    
    <script>
      function loadWebinar() {
        const id = document.getElementById('webinarId').value;
        if (!id) return;
        
        google.script.run
          .withSuccessHandler(function(webinar) {
            if (webinar) {
              document.getElementById('title').value = webinar.title || '';
              document.getElementById('date').value = webinar.date ? new Date(webinar.date).toISOString().split('T')[0] : '';
              document.getElementById('owner').value = webinar.owner || '';
              document.getElementById('email').value = webinar.email || '';
              document.getElementById('status').value = webinar.status || 'Планируется';
              document.getElementById('notes').value = webinar.notes || '';
            }
          })
          .withFailureHandler(function(err) {
            document.getElementById('status').innerHTML = '<span style="color: red;">Ошибка: ' + err.message + '</span>';
          })
          .getWebinarByIdFromDialog(id);
      }
      
      function submitForm() {
        const id = document.getElementById('webinarId').value;
        const title = document.getElementById('title').value.trim();
        const date = document.getElementById('date').value;
        
        if (!id) {
          document.getElementById('status').innerHTML = '<span style="color: red;">❌ Выберите вебинар</span>';
          return;
        }
        
        if (!title || !date) {
          document.getElementById('status').innerHTML = '<span style="color: red;">❌ Заполните обязательные поля</span>';
          return;
        }
        
        const updates = {
          'Название': title,
          'Дата': date,
          'Ответственный': document.getElementById('owner').value.trim(),
          'Email': document.getElementById('email').value.trim(),
          'Статус': document.getElementById('status').value,
          'Примечание': document.getElementById('notes').value.trim()
        };
        
        document.getElementById('status').innerText = '⏳ Сохранение...';
        
        google.script.run
          .withSuccessHandler(function() {
            document.getElementById('status').innerHTML = '<span style="color: green;">✅ Сохранено</span>';
            setTimeout(function() { google.script.host.close(); }, 1000);
          })
          .withFailureHandler(function(err) {
            document.getElementById('status').innerHTML = '<span style="color: red;">❌ Ошибка: ' + err.message + '</span>';
          })
          .updateWebinarFromDialog(id, updates);
      }
    </script>
  `)
  .setWidth(450)
  .setHeight(550);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Редактировать вебинар');
}

/**
 * Показывает диалог удаления вебинара.
 */
function showDeleteWebinarDialog() {
  const webinars = DataModel.getWebinars();
  
  if (webinars.length === 0) {
    SpreadsheetApp.getUi().alert('Нет вебинаров для удаления.');
    return;
  }
  
  // Формируем опции для select
  let optionsHtml = '<option value="">— Выберите вебинар —</option>';
  webinars.forEach(function(w) {
    const dateStr = w.date ? Utilities.formatDate(new Date(w.date), Session.getScriptTimeZone(), 'dd.mm.yyyy') : 'без даты';
    optionsHtml += '<option value="' + w.id + '">' + w.title + ' (' + dateStr + ')</option>';
  });
  
  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      .form-group { margin-bottom: 15px; }
      label { display: block; margin-bottom: 5px; font-weight: bold; }
      select { width: 100%; padding: 8px; box-sizing: border-box; }
      button { padding: 10px 20px; margin-right: 10px; cursor: pointer; border: none; border-radius: 4px; }
      .btn-danger { background: #ea4335; color: white; }
      .btn-secondary { background: #f1f1f1; border: 1px solid #ccc; }
      .warning { color: #ea4335; font-weight: bold; margin: 15px 0; }
      #status { margin-top: 10px; font-size: 13px; }
    </style>
    
    <h3>🗑️ Удалить вебинар</h3>
    
    <div class="form-group">
      <label>Выберите вебинар *</label>
      <select id="webinarId">
        ` + optionsHtml + `
      </select>
    </div>
    
    <div class="warning">⚠️ Внимание: это действие нельзя отменить!</div>
    
    <button class="btn-danger" onclick="submitForm()">Удалить</button>
    <button class="btn-secondary" onclick="google.script.host.close()">Отмена</button>
    
    <div id="status"></div>
    
    <script>
      function submitForm() {
        const id = document.getElementById('webinarId').value;
        
        if (!id) {
          document.getElementById('status').innerHTML = '<span style="color: red;">❌ Выберите вебинар</span>';
          return;
        }
        
        if (!confirm('Вы уверены, что хотите удалить этот вебинар?')) {
          return;
        }
        
        document.getElementById('status').innerText = '⏳ Удаление...';
        
        google.script.run
          .withSuccessHandler(function() {
            document.getElementById('status').innerHTML = '<span style="color: green;">✅ Вебинар удалён</span>';
            setTimeout(function() { google.script.host.close(); }, 1000);
          })
          .withFailureHandler(function(err) {
            document.getElementById('status').innerHTML = '<span style="color: red;">❌ Ошибка: ' + err.message + '</span>';
          })
          .deleteWebinarFromDialog(id);
      }
    </script>
  `)
  .setWidth(450)
  .setHeight(350);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Удалить вебинар');
}

/**
 * Получает вебинар по ID (вызывается из HTML).
 */
function getWebinarByIdFromDialog(id) {
  return DataModel.getWebinarById(id);
}

/**
 * Обновляет вебинар из диалога (вызывается из HTML).
 */
function updateWebinarFromDialog(id, updates) {
  if (!id || !updates) {
    throw new Error('Некорректные данные');
  }
  
  const result = DataModel.updateWebinar(id, updates);
  
  if (!result) {
    throw new Error('Не удалось обновить вебинар');
  }
  
  return true;
}

/**
 * Удаляет вебинар из диалога (вызывается из HTML).
 */
function deleteWebinarFromDialog(id) {
  if (!id) {
    throw new Error('Не указан ID вебинара');
  }
  
  // Используем каскадное удаление
  const result = cascadeDeleteWebinar(id);
  
  Logger.log('Удалено событий: ' + result.eventsDeleted);
  
  return true;
}

// ========================================================
// ДИАЛОГИ ДЛЯ ОТВЕТСТВЕННЫХ
// ========================================================

/**
 * Показывает диалог добавления ответственного.
 */
function showAddResponsibleDialog() {
  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      .field { margin-bottom: 15px; }
      label { display: block; margin-bottom: 5px; font-weight: bold; }
      input { width: 100%; padding: 8px; box-sizing: border-box; }
      button { padding: 10px 20px; margin-right: 10px; cursor: pointer; border: none; border-radius: 4px; }
      .btn-primary { background: #4285f4; color: white; }
      .btn-secondary { background: #f1f1f1; border: 1px solid #ccc; }
      #status { margin-top: 10px; font-size: 13px; }
    </style>
    
    <h3>➕ Добавить ответственного</h3>
    
    <div class="field">
      <label>Имя *</label>
      <input type="text" id="name" required>
    </div>
    
    <div class="field">
      <label>Email *</label>
      <input type="email" id="email" required>
    </div>
    
    <div class="field">
      <label>Должность</label>
      <input type="text" id="position">
    </div>
    
    <div class="field">
      <label>Телефон</label>
      <input type="text" id="phone">
    </div>
    
    <button class="btn-primary" onclick="submitForm()">Добавить</button>
    <button class="btn-secondary" onclick="google.script.host.close()">Отмена</button>
    
    <div id="status"></div>
    
    <script>
      function submitForm() {
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        
        if (!name || !email) {
          document.getElementById('status').innerHTML = '<span style="color: red;">❌ Заполните обязательные поля</span>';
          return;
        }
        
        const position = document.getElementById('position').value.trim();
        const phone = document.getElementById('phone').value.trim();
        
        document.getElementById('status').innerText = '⏳ Добавление...';
        
        google.script.run
          .withSuccessHandler(function() {
            document.getElementById('status').innerHTML = '<span style="color: green;">✅ Добавлен</span>';
            setTimeout(function() { google.script.host.close(); }, 1000);
          })
          .withFailureHandler(function(err) {
            document.getElementById('status').innerHTML = '<span style="color: red;">❌ Ошибка: ' + err.message + '</span>';
          })
          .addResponsibleFromDialog(name, email, position, phone);
      }
    </script>
  `)
  .setWidth(400)
  .setHeight(400);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Добавить ответственного');
}

/**
 * Добавить ответственного из диалога.
 */
function addResponsibleFromDialog(name, email, position, phone) {
  if (!name || !email) {
    throw new Error('Имя и Email обязательны');
  }
  
  Responsibles.add(name, email, position, phone);
  return true;
}

/**
 * Создаёт вебинар из формы NewWebinar.html
 */
function createWebinar(data) {
  try {
    Logger.log("Получены данные: " + JSON.stringify(data));
    
    // Валидация
    const validation = validateWebinar(data);
    if (!validation.success) {
      throw new Error(validation.errors.join("\n"));
    }
    
    // Генерируем ID
    const id = Utilities.getUuid();
    
    // Добавляем вебинар
    DataModel.addWebinar({
      id: id,
      title: data.title,
      date: data.date,
      owner: data.owner,
      email: data.email,
      notes: data.comment || '',
      status: CONFIG.STATUS.PLANNED
    });
    
    // Если есть дополнительные поля (время, город, ссылка), добавляем их вручную
    if (data.time || data.city || data.link) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(CONFIG.SHEETS.WEBINARS);
      const lastRow = sheet.getLastRow();
      
      // Проверяем, есть ли колонки для этих полей
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      if (data.time && headers.indexOf('Время') !== -1) {
        const col = headers.indexOf('Время') + 1;
        sheet.getRange(lastRow, col).setValue(data.time);
      }
      
      if (data.city && headers.indexOf('Город') !== -1) {
        const col = headers.indexOf('Город') + 1;
        sheet.getRange(lastRow, col).setValue(data.city);
      }
      
      if (data.link && headers.indexOf('Ссылка') !== -1) {
        const col = headers.indexOf('Ссылка') + 1;
        sheet.getRange(lastRow, col).setValue(data.link);
      }
    }
    
    Logger.log("Вебинар создан с ID: " + id);
    return id;
    
  } catch (e) {
    Logger.log("Ошибка createWebinar: " + e.message);
    throw e;
  }
}

/**
 * Возвращает список ответственных для выпадающего списка в форме
 */
function getResponsiblesList() {
  try {
    return Responsibles.getAll().filter(function(r) {
      return r.active !== false && r.active !== 'false';
    });
  } catch (e) {
    Logger.log('Ошибка getResponsiblesList: ' + e.message);
    return [];
  }
}

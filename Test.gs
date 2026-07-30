/**
 * Тест API функций
 */
function testApiFunctions() {
  const ui = SpreadsheetApp.getUi();
  let report = '🧪 Тест API функций:\n\n';
  
  // 1. Тест DataModel
  try {
    const webinars = DataModel.getWebinars();
    report += '✅ DataModel.getWebinars(): ' + webinars.length + ' вебинаров\n';
  } catch (e) {
    report += '❌ DataModel.getWebinars(): ' + e.message + '\n';
  }
  
  try {
    const tasks = DataModel.getTasks();
    report += '✅ DataModel.getTasks(): ' + tasks.length + ' задач\n';
  } catch (e) {
    report += '❌ DataModel.getTasks(): ' + e.message + '\n';
  }
  
  // 2. Тест Settings
  try {
    const token = Settings.get('TELEGRAM_BOT_TOKEN');
    report += '✅ Settings.get(): токен ' + (token ? 'есть' : 'пустой') + '\n';
  } catch (e) {
    report += '❌ Settings.get(): ' + e.message + '\n';
  }
  
  // 3. Тест Responsibles
  try {
    const responsibles = Responsibles.getActive();
    report += '✅ Responsibles.getActive(): ' + responsibles.length + ' ответственных\n';
  } catch (e) {
    report += '❌ Responsibles.getActive(): ' + e.message + '\n';
  }
  
  // 4. Тест Planner
  try {
    Planner.planAllWebinars();
    report += '✅ Planner.planAllWebinars(): успешно\n';
  } catch (e) {
    report += '❌ Planner.planAllWebinars(): ' + e.message + '\n';
  }
  
  ui.alert(report);
}

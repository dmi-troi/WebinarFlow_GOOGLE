/**
 * Проверить проект
 */
function analyzeProject() {

  const webinars = getAllWebinars();

  const report = {

    webinars: webinars

  };

  const prompt =

`Проанализируй проект WebinarFlow.

Данные:

${JSON.stringify(report, null, 2)}

Проверь:

1. ошибки

2. пустые поля

3. возможные конфликты

4. проблемы планирования

5. дай рекомендации.

Ответ дай списком.`;

  const answer = askAI(prompt);

  SpreadsheetApp
    .getUi()
    .alert(answer);

}

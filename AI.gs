/**
 * ==========================================================
 * WebinarFlow v2.0
 * AI.gs
 * ==========================================================
 */

function askAI(systemPrompt, userPrompt) {

  const apiKey = getAIKey();

  if (!apiKey) {

    throw new Error(
      "API Key не указан."
    );

  }

  const payload = {
  model: AI_CONFIG.MODEL,
  messages: [
    {
      role: "system",
      content: systemPrompt
    },
    {
      role: "user",
      content: userPrompt
    }
  ],
  temperature: AI_CONFIG.TEMPERATURE,
  max_tokens: AI_CONFIG.MAX_TOKENS
};

  const options = {

    method: "post",

    contentType: "application/json",

    headers: {

      Authorization: "Bearer " + apiKey,

      "HTTP-Referer": "https://script.google.com",

      "X-Title": "WebinarFlow"

    },

    payload: JSON.stringify(payload),

    muteHttpExceptions: true

  };

  const response = UrlFetchApp.fetch(

    AI_CONFIG.URL,

    options

  );

  const code = response.getResponseCode();

  const body = response.getContentText();

  if (code != 200) {

    throw new Error(body);

  }

  const json = JSON.parse(body);

  if (!json.choices) {

    throw new Error("AI не вернул ответ.");

  }

  return json.choices[0].message.content;

}


/**
 * Проверка подключения
 */
function testAI() {

  const answer = askAI(

    "Ты помощник.",

    "Ответь одним словом OK."

  );

  SpreadsheetApp
    .getUi()
    .alert(answer);

}

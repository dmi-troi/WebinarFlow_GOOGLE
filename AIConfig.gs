/**
 * ==========================================================
 * WebinarFlow v2.0
 * AIConfig.gs
 * ==========================================================
 */

const AI_CONFIG = {
  URL: "https://openrouter.ai/api/v1/chat/completions",
  MODEL: "meta-llama/llama-3.3-70b-instruct",
  API_PROPERTY: "OPENROUTER_API_KEY",
  TEMPERATURE: 0.2,
  MAX_TOKENS: 1000
};


/**
 * Получить API Key
 */
function getAIKey() {

  return PropertiesService
    .getScriptProperties()
    .getProperty(AI_CONFIG.API_PROPERTY);

}


/**
 * Сохранить API Key
 */
function saveAIKey(apiKey) {

  if (!apiKey)
    throw new Error("API Key пустой");

  apiKey = apiKey.trim();

  PropertiesService
    .getScriptProperties()
    .setProperty(
      AI_CONFIG.API_PROPERTY,
      apiKey
    );

}


/**
 * Удалить API Key
 */
function removeAIKey() {

  PropertiesService
    .getScriptProperties()
    .deleteProperty(
      AI_CONFIG.API_PROPERTY
    );

}


/**
 * Есть ли ключ
 */
function hasAIKey() {

  return getAIKey() != null;

}


/**
 * Маска ключа
 */
function getMaskedAIKey() {

  const key = getAIKey();

  if (!key)
    return "";

  return key.substring(0,8)
      + "********"
      + key.substring(key.length-4);

}

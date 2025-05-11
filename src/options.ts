import { loadConfig, saveConfig } from './utils/config';
import { initI18n, applyDocumentTranslations, changeLanguage, getStoredLanguage, t, SUPPORTED_LANGS } from './utils/i18n';

const $headers = document.querySelector<HTMLTextAreaElement>('#headers')!;
const $strict = document.querySelector<HTMLInputElement>('#strictBearer')!;
const $cookie = document.querySelector<HTMLInputElement>('#captureCookies')!;
const $status = document.querySelector<HTMLParagraphElement>('#status')!;
const $languageSelect = document.querySelector<HTMLSelectElement>('#languageSelect')!;

async function initializeOptionsPage() {
  await initI18n();
  
  $languageSelect.innerHTML = '';
  for (const langCode of SUPPORTED_LANGS) {
    try {
      const response = await fetch(chrome.runtime.getURL(`_locales/${langCode}/messages.json`));
      if (response.ok) {
        const messages = await response.json();
        const langName = messages['languageNameDisplay']?.message || langCode; // Fallback to langCode
        const option = document.createElement('option');
        option.value = langCode;
        option.textContent = langName;
        $languageSelect.appendChild(option);
      }
    } catch (e) {
      console.warn(`Could not load language display name for ${langCode}`, e);
      const option = document.createElement('option'); // Fallback option
      option.value = langCode;
      option.textContent = langCode;
      $languageSelect.appendChild(option);
    }
  }

  applyDocumentTranslations();

  const currentLang = await getStoredLanguage();
  $languageSelect.value = currentLang;

  const cfg = await loadConfig();
  $headers.value = cfg.headerNames.join('\n');
  $strict.checked = cfg.strictBearer;
  $cookie.checked = cfg.captureCookies;
}

initializeOptionsPage();

$languageSelect.addEventListener('change', async (event) => {
  const newLang = (event.target as HTMLSelectElement).value;
  await changeLanguage(newLang);
});

document.querySelector('#save')!.addEventListener('click', async () => {
  const cfg = {
    headerNames: $headers.value.split(/\s+/).filter(Boolean),
    strictBearer: $strict.checked,
    captureCookies: $cookie.checked,
  };
  await saveConfig(cfg);
  $status.textContent = t('optionsSavedStatus'); // Assuming 'optionsSavedStatus' key exists
  setTimeout(() => ($status.textContent = ''), 1500);
});

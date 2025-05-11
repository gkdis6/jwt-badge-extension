import { loadConfig, saveConfig } from './utils/config';
import { initI18n, applyDocumentTranslations, changeLanguage, getStoredLanguage, t } from './utils/i18n';

const $headers = document.querySelector<HTMLTextAreaElement>('#headers')!;
const $strict = document.querySelector<HTMLInputElement>('#strictBearer')!;
const $cookie = document.querySelector<HTMLInputElement>('#captureCookies')!;
const $status = document.querySelector<HTMLParagraphElement>('#status')!;
const $languageSelect = document.querySelector<HTMLSelectElement>('#languageSelect')!;

async function initializeOptionsPage() {
  // Initialize i18n
  await initI18n();
  applyDocumentTranslations();

  // Load and apply current language to select
  const currentLang = await getStoredLanguage();
  $languageSelect.value = currentLang;

  // Load other configs
  const cfg = await loadConfig();
  $headers.value = cfg.headerNames.join('\n');
  $strict.checked = cfg.strictBearer;
  $cookie.checked = cfg.captureCookies;
}

// Initialize the page
initializeOptionsPage();

// Event listener for language change
$languageSelect.addEventListener('change', async (event) => {
  const newLang = (event.target as HTMLSelectElement).value;
  await changeLanguage(newLang);
  // Update status message if needed, or other language-dependent dynamic content not covered by data-i18n-key
  // For example, the save status message could also be internationalized.
});

// Event listener for save button
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

// Add 'optionsSavedStatus' to messages.json if it doesn't exist
// en: "✅ Options saved successfully"
// ko: "✅ 옵션이 성공적으로 저장되었습니다"

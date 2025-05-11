// src/utils/i18n.ts

interface Messages {
  [key: string]: { message: string; description?: string };
}

let currentMessages: Messages = {};
let currentLang: string = 'en'; // Default language

const DEFAULT_LANG = 'en';
const SUPPORTED_LANGS = ['en', 'ko'];

// Function to get the stored language or default
export async function getStoredLanguage(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['appLanguage'], (result) => {
      if (result.appLanguage && SUPPORTED_LANGS.includes(result.appLanguage)) {
        resolve(result.appLanguage);
      } else {
        // If no language is stored, try to use browser's language if supported, else default
        const browserLang = chrome.i18n.getUILanguage().split('-')[0];
        resolve(SUPPORTED_LANGS.includes(browserLang) ? browserLang : DEFAULT_LANG);
      }
    });
  });
}

// Function to set the stored language
export async function setStoredLanguage(lang: string): Promise<void> {
  if (!SUPPORTED_LANGS.includes(lang)) {
    console.warn(`Unsupported language: ${lang}. Defaulting to ${DEFAULT_LANG}.`);
    lang = DEFAULT_LANG;
  }
  return new Promise((resolve) => {
    chrome.storage.sync.set({ appLanguage: lang }, () => {
      currentLang = lang;
      resolve();
    });
  });
}

// Function to load messages for a given language
async function loadMessages(lang: string): Promise<Messages> {
  if (!SUPPORTED_LANGS.includes(lang)) {
    lang = DEFAULT_LANG;
  }
  try {
    const response = await fetch(chrome.runtime.getURL(`_locales/${lang}/messages.json`));
    if (!response.ok) {
      throw new Error(`Failed to load messages for ${lang}: ${response.statusText}`);
    }
    const messages = await response.json();
    return messages;
  } catch (error) {
    console.error(`Error loading messages for ${lang}:`, error);
    // Fallback to default language if current one fails
    if (lang !== DEFAULT_LANG) {
      return loadMessages(DEFAULT_LANG);
    }
    return {}; // Should not happen if default 'en' messages.json exists
  }
}

// Initialize and load messages for the current language
export async function initI18n(): Promise<void> {
  currentLang = await getStoredLanguage();
  currentMessages = await loadMessages(currentLang);
}

// Get translated string
export function t(key: string, substitutions?: string | string[]): string {
  if (currentMessages && currentMessages[key]) {
    let message = currentMessages[key].message;
    // Basic substitution (e.g., "Hello $1", replace $1 with substitutions[0])
    if (substitutions) {
      const subsArray = Array.isArray(substitutions) ? substitutions : [substitutions];
      subsArray.forEach((sub, i) => {
        message = message.replace(new RegExp(`\\$${i + 1}`, 'g'), sub);
      });
    }
    return message;
  }
  console.warn(`Missing translation for key: ${key} in language: ${currentLang}`);
  return key; // Return key if not found
}

// Apply translations to the current document
export function applyDocumentTranslations(): void {
  if (!document) return;

  // Update page title
  const pageTitleKey = document.documentElement.dataset.i18nPageTitleKey;
  if (pageTitleKey) {
    document.title = t(pageTitleKey);
  } else {
    // Fallback for pages like options.html that have a specific title key
    if (document.title === 'Options' && currentMessages['optionsTitle']) { // A bit of a hack for initial load
        document.title = t('optionsTitle');
    } else if (document.title === 'JWT Decoder' && currentMessages['popupTitle']) {
        document.title = t('popupTitle');
    } else if (document.title === 'JWT Panel' && currentMessages['panelTitle']) {
        document.title = t('panelTitle');
    }
  }


  // Update elements with data-i18n-key
  document.querySelectorAll('[data-i18n-key]').forEach((element) => {
    const key = element.getAttribute('data-i18n-key');
    if (key) {
      const translation = t(key);
      if (element.hasAttribute('data-i18n-target')) {
        const targetAttr = element.getAttribute('data-i18n-target');
        if (targetAttr) {
          (element as HTMLElement).setAttribute(targetAttr, translation);
        }
      } else if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'submit' || (element as HTMLInputElement).type === 'button') {
        (element as HTMLInputElement).value = translation;
      } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        (element as HTMLInputElement).placeholder = translation;
      }
      else {
        element.innerHTML = translation;
      }
    }
  });
}

// Function to change language and update UI
export async function changeLanguage(newLang: string): Promise<void> {
  await setStoredLanguage(newLang);
  await initI18n(); // Reload messages for the new language
  applyDocumentTranslations();

  // Notify other extension parts (background, popup, panel) about the language change
  chrome.runtime.sendMessage({ type: 'LANGUAGE_CHANGED', lang: newLang }).catch(err => {
    // Catch error if no listeners are available (e.g. popup not open)
    if (err.message !== 'Could not establish connection. Receiving end does not exist.') {
        console.error('Error sending LANGUAGE_CHANGED message:', err);
    }
  });
}

// Listen for language change messages from other parts of the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'LANGUAGE_CHANGED') {
    if (request.lang && request.lang !== currentLang) {
      console.log(`Language changed to ${request.lang} by another part of the extension.`);
      // Ensure this part also updates its language and UI
      // This might cause a loop if not handled carefully, but generally,
      // the part initiating the change won't need to re-process this message.
      // However, for safety, we can re-initialize and re-apply.
      currentLang = request.lang; // Directly update currentLang to avoid re-storage
      loadMessages(currentLang).then(messages => {
        currentMessages = messages;
        applyDocumentTranslations();
      });
    }
    return true; // Indicates async response, though not used here
  }
});

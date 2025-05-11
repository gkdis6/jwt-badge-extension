import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { decode } from './utils/jwt';
import { loadConfig, UserConfig } from './utils/config';
import { initI18n, applyDocumentTranslations, t } from './utils/i18n';

let cfg: UserConfig;

dayjs.extend(relativeTime);

const $token = document.querySelector<HTMLTextAreaElement>('#token')!;
const $cookieName = document.querySelector<HTMLInputElement>('#cookieName')!;
const $result = document.querySelector<HTMLPreElement>('#result')!;
const $optionsButton = document.querySelector<HTMLButtonElement>('#optionsButton')!;

async function initializePopup() {
  await initI18n();
  applyDocumentTranslations();
  // dayjs.locale(currentLang); // If dayjs supports locale switching and we have locale files for it

  // Set tooltip for options button
  if ($optionsButton) {
    $optionsButton.title = t('openOptionsTooltip');
  }

  cfg = await loadConfig();
  // 저장된 쿠키 이름 불러오기
  const { lastCookieName } = await chrome.storage.local.get('lastCookieName');
  if (lastCookieName) {
    $cookieName.value = lastCookieName;
  } else if (cfg.headerNames.length > 0) {
    $cookieName.value = cfg.headerNames[0];
  }

  if ($cookieName.value.trim()) {
    const name = $cookieName.value.trim();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      chrome.cookies.get({ url: tab.url, name }, (cookie) => {
        if (cookie?.value) {
          handleToken(cookie.value);
        } else {
          // $result.textContent = t('autoFetchCookieNotFoundError', name); // Example if we add this key
        }
      });
    }
  }
}

initializePopup();

// Event listener for options button
if ($optionsButton) {
  $optionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

document.querySelector('#decode')!.addEventListener('click', () => {
  handleToken($token.value.trim());
});

const fetchCookieButton = document.querySelector('#fetchCookie')!;
fetchCookieButton.addEventListener('click', async () => {
  const name = $cookieName.value.trim();
  if (!name) {
    $result.textContent = t('cookieNameRequiredError');
    return;
  }

  await chrome.storage.local.set({ lastCookieName: name });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    $result.textContent = t('tabUrlError');
    return;
  }

  chrome.cookies.get({ url: tab.url, name }, (cookie) => {
    if (!cookie?.value) {
      $result.textContent = t('cookieNotFoundError', name);
      return;
    }
    handleToken(cookie.value);
  });
});

function handleToken(tokenValue: string) {
  try {
    const { payload } = decode(tokenValue);
    const expUnix = payload.exp as number | undefined;
    const remain = expUnix ? dayjs.unix(expUnix).fromNow() : t('noExpiry');

    $result.textContent =
      JSON.stringify(payload, null, 2) + `\n\n${t('tokenExpiryPrefix')}${remain}`;

    chrome.storage.local.set({ token: tokenValue, exp: expUnix ?? null });
    chrome.runtime.sendMessage({ type: 'TOKEN_UPDATED' });
  } catch (e: any) {
    $result.textContent = `${t('decodeErrorPrefix')}${e.message}`;
  }
}

// Listener for language changes from other parts (e.g., options page)
// This is already in i18n.ts, but ensuring popup re-applies translations if it's open.
// The listener in i18n.ts should handle calling applyDocumentTranslations.
// No specific extra code needed here if i18n.ts listener works globally for the current document.

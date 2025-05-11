import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { decode } from './utils/jwt';
import { initI18n, applyDocumentTranslations, t } from './utils/i18n';

dayjs.extend(relativeTime);

const $header = document.querySelector<HTMLPreElement>('#headerPre')!;
const $payload = document.querySelector<HTMLPreElement>('#payloadPre')!;

async function initializePanel() {
  await initI18n();
  applyDocumentTranslations();
  // dayjs.locale(currentLang); // If dayjs supports locale switching

  refresh();
}

// ➊ 최초 로드
initializePanel();


// ➋ 백그라운드에서 “TOKEN_UPDATED”·“PANEL_OPENED” 메시지 수신
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'TOKEN_UPDATED' || msg.type === 'PANEL_OPENED') {
    refresh();
  }
  // Language change listener is in i18n.ts and should handle UI updates globally
  // If specific refresh logic beyond applyDocumentTranslations is needed for panel on lang change,
  // it could be added here, or i18n.ts could be made to call a registered refresh function.
  // For now, assuming applyDocumentTranslations in i18n.ts is sufficient.
  return true; // Keep channel open for other listeners if any
});

// ➌ storage 변화 감지(쿠키→Storage 자동 갱신 시 실시간 반영)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.token) {
    refresh();
  }
});

async function refresh() {
  // Ensure translations are applied, especially if this is called before full init or after lang change
  // This might be redundant if initI18n and applyDocumentTranslations are always called first.
  // However, if refresh can be called independently after a language change not yet reflected,
  // it's safer to ensure messages are current.
  // await initI18n(); // Re-ensure messages are loaded for current lang if needed
  // applyDocumentTranslations(); // Re-apply static text if needed

  const { token } = await chrome.storage.local.get('token');
  if (!token) {
    $header.textContent = '{}';
    $payload.textContent = t('noTokenInPanel');
    return;
  }

  try {
    const { header, payload } = decode(token as string);

    // exp 상대시간 추가
    if (payload.exp) {
      (payload as any).expReadable = dayjs.unix(payload.exp).fromNow();
    }

    $header.textContent = JSON.stringify(header, null, 2);
    $payload.textContent = JSON.stringify(payload, null, 2);
  } catch (e) {
    $header.textContent = '{}';
    $payload.textContent = `${t('decodeFailedInPanel')}${(e as Error).message}`;
  }
}

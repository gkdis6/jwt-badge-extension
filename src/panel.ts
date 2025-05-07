import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { decode } from './utils/jwt';

dayjs.extend(relativeTime);

const $header = document.querySelector<HTMLPreElement>('#headerPre')!;
const $payload = document.querySelector<HTMLPreElement>('#payloadPre')!;

// ➊ 최초 로드
refresh();

// ➋ 백그라운드에서 “TOKEN_UPDATED”·“PANEL_OPENED” 메시지 수신
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'TOKEN_UPDATED' || msg.type === 'PANEL_OPENED') refresh();
});

// ➌ storage 변화 감지(쿠키→Storage 자동 갱신 시 실시간 반영)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.token) refresh();
});

async function refresh() {
  const { token } = await chrome.storage.local.get('token');
  if (!token) {
    $header.textContent = '{}';
    $payload.textContent = '토큰 없음';
    return;
  }

  try {
    const { header, payload } = decode(token);

    // exp 상대시간 추가
    if (payload.exp) {
      (payload as any).expReadable = dayjs.unix(payload.exp).fromNow();
    }

    $header.textContent = JSON.stringify(header, null, 2);
    $payload.textContent = JSON.stringify(payload, null, 2);
  } catch (e) {
    $header.textContent = '{}';
    $payload.textContent = `⚠️ 디코드 실패: ${(e as Error).message}`;
  }
}
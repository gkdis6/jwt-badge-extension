import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { decode } from './utils/jwt';
import { loadConfig } from './utils/config';

let cfg: UserConfig;                      // 변수를 먼저 선언해 두고

(async () => {                            // async IIFE로 감싸기
  cfg = await loadConfig();
})();
dayjs.extend(relativeTime);

const $token = document.querySelector<HTMLTextAreaElement>('#token')!;
const $cookieName = document.querySelector<HTMLInputElement>('#cookieName')!;
const $result = document.querySelector<HTMLPreElement>('#result')!;

document.querySelector('#decode')!.addEventListener('click', () => {
  handleToken($token.value.trim());
});

document.querySelector('#fetchCookie')!.addEventListener('click', async () => {
  const name = $cookieName.value.trim();
  if (!name) return ($result.textContent = '⚠️ 쿠키 이름을 입력하세요');

  // 1. 현재 활성 탭 URL 얻기
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return ($result.textContent = '⚠️ 탭 URL을 확인할 수 없습니다');

  // 2. 도메인 범위로 쿠키 읽기
  chrome.cookies.get({ url: tab.url, name }, (cookie) => {
    if (!cookie?.value) {
      $result.textContent = `⚠️ "${name}" 쿠키를 찾을 수 없습니다`;
      return;
    }
    handleToken(cookie.value);
  });
});

function handleToken(token: string) {
  try {
    const { payload } = decode(token);
    const expUnix = payload.exp as number | undefined;
    const remain = expUnix ? dayjs.unix(expUnix).fromNow() : 'exp 없음';

    $result.textContent =
      JSON.stringify(payload, null, 2) + `\n\n만료까지: ${remain}`;

    chrome.storage.local.set({ token, exp: expUnix ?? null });
    chrome.runtime.sendMessage({ type: 'TOKEN_UPDATED' }); // 배지 즉시 새로고침
  } catch (e: any) {
    $result.textContent = '⚠️  ' + e.message;
  }
}
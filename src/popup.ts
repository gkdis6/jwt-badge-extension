import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { decode } from './utils/jwt';
import { loadConfig, UserConfig } from './utils/config';

let cfg: UserConfig;

dayjs.extend(relativeTime);

const $token = document.querySelector<HTMLTextAreaElement>('#token')!;
const $cookieName = document.querySelector<HTMLInputElement>('#cookieName')!;
const $result = document.querySelector<HTMLPreElement>('#result')!;

(async () => {
  cfg = await loadConfig();
  // 저장된 쿠키 이름 불러오기
  const { lastCookieName } = await chrome.storage.local.get('lastCookieName');
  if (lastCookieName) {
    $cookieName.value = lastCookieName;
  } else if (cfg.headerNames.length > 0) {
    // 설정된 headerNames의 첫 번째 값을 기본값으로 사용
    $cookieName.value = cfg.headerNames[0];
  }

  // $cookieName.value가 비어있지 않으면 자동으로 쿠키 가져오기 시도
  if ($cookieName.value.trim()) {
    // '#fetchCookie' 버튼을 직접 클릭하는 대신, 해당 로직을 직접 호출하거나
    // 버튼에 대한 참조를 만들어 click()을 호출할 수 있습니다.
    // 여기서는 로직을 직접 실행하는 방식을 택합니다.
    const name = $cookieName.value.trim();
    // 1. 현재 활성 탭 URL 얻기
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      // 2. 도메인 범위로 쿠키 읽기
      chrome.cookies.get({ url: tab.url, name }, (cookie) => {
        if (cookie?.value) {
          handleToken(cookie.value);
        } else {
          // 쿠키를 찾지 못한 경우, 사용자에게 알릴 수 있지만,
          // 자동 실행이므로 조용히 실패 처리하거나, 최소한의 메시지만 표시할 수 있습니다.
          // $result.textContent = `⚠️ 자동 가져오기: "${name}" 쿠키를 찾을 수 없습니다`;
        }
      });
    }
  }
})();

document.querySelector('#decode')!.addEventListener('click', () => {
  handleToken($token.value.trim());
});

const fetchCookieButton = document.querySelector('#fetchCookie')!;
fetchCookieButton.addEventListener('click', async () => {
  const name = $cookieName.value.trim();
  if (!name) return ($result.textContent = '⚠️ 쿠키 이름을 입력하세요');

  // 쿠키 이름 저장
  await chrome.storage.local.set({ lastCookieName: name });

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

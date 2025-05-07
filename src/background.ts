import dayjs from 'dayjs';
import { loadConfig } from './utils/config';

const jwtRx = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;

async function init() {
  await refreshBadge();
  // 1분 주기 배지 갱신
  setInterval(refreshBadge, 60_000);

  // 쿠키 감시
  const cfg = await loadConfig();
  if (cfg.captureCookies) {
    chrome.cookies.onChanged.addListener(handleCookieChange);
  }
}

async function refreshBadge() {
  const { exp } = await chrome.storage.local.get('exp');
  updateBadge(exp);
}

function updateBadge(exp?: number | null) {
  if (!exp) return chrome.action.setBadgeText({ text: '' });
  const diff = exp - dayjs().unix();
  if (diff <= 0) {
    chrome.action.setBadgeText({ text: 'EXP' });
    chrome.action.setBadgeBackgroundColor({ color: '#d32f2f' });
  } else {
    chrome.action.setBadgeText({ text: Math.floor(diff / 60).toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#1976d2' });
  }
}

function handleCookieChange({ cookie, removed }: chrome.cookies.CookieChangeInfo) {
  if (removed || !jwtRx.test(cookie.value)) return;
  chrome.storage.local.set({ token: cookie.value });
  chrome.runtime.sendMessage({ type: 'TOKEN_UPDATED' });
}

chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'TOKEN_UPDATED') refreshBadge();
});
import { decode } from './utils/jwt';
import { loadConfig, UserConfig } from './utils/config';

let cfg: UserConfig;
loadConfig().then((c) => (cfg = c));
chrome.storage.onChanged.addListener((ch, area) => {
  if (area === 'sync' && ch.config) cfg = { ...cfg, ...(ch.config.newValue as UserConfig) };
});

const jwtRx = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;

chrome.devtools.panels.create('JWT Inspector', '', 'panel.html', (p) =>
  p.onShown.addListener(() => chrome.runtime.sendMessage({ type: 'PANEL_OPENED' })),
);

chrome.devtools.network.onRequestFinished.addListener((req) => {
  if (!cfg) return;

  // ① 지정 헤더 탐색
  const found = req.request.headers.find((h) =>
    cfg.headerNames.includes(h.name.toLowerCase()),
  );
  if (!found) return;

  let candidate = found.value.trim();
  if (found.name.toLowerCase() === 'authorization') {
    const parts = candidate.split(/\s+/);
    if (cfg.strictBearer && parts[0].toLowerCase() !== 'bearer') return;
    candidate = parts.pop()!;
  }

  if (jwtRx.test(candidate)) {
    try {
      decode(candidate);                       // 형식 검증
      chrome.storage.local.set({ token: candidate });
      chrome.runtime.sendMessage({ type: 'TOKEN_UPDATED' });
    } catch {/* ignore */}
  }
});
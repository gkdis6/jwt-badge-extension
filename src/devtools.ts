import { decode } from './utils/jwt';
import { loadConfig, UserConfig } from './utils/config';
import { initI18n, t, getStoredLanguage } from './utils/i18n'; // Added getStoredLanguage

let cfg: UserConfig;
loadConfig().then((c) => (cfg = c));
chrome.storage.onChanged.addListener((ch, area) => {
  if (area === 'sync' && ch.config) cfg = { ...cfg, ...(ch.config.newValue as UserConfig) };
});

const jwtRx = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;

// Initialize i18n and create panel
async function createDevToolsPanel() {
  await initI18n();
  chrome.devtools.panels.create(
    t("panelTitle"),
    '', // iconPath
    'panel.html',
    (p) => p.onShown.addListener(() => chrome.runtime.sendMessage({ type: 'PANEL_OPENED' })),
  );
}

createDevToolsPanel();

// Listen for language changes to potentially re-create the panel if title needs update
// Note: DevTools panels cannot be easily updated once created. Re-creation might be too disruptive.
// For simplicity, panel title will be set on creation based on the language at that time.
// If dynamic title update is crucial, a more complex mechanism or different panel creation strategy is needed.
// The listener in i18n.ts will update panel.html's content, but not the panel tab title itself.

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === 'LANGUAGE_CHANGED') {
    // DevTools panel title is hard to update dynamically.
    // It's set on creation. If the language changes, the panel title in the tab bar
    // won't update unless the devtools are closed and reopened, or we re-create the panel.
    // Re-creating the panel might be disruptive.
    // For now, we'll log that the language changed. The panel's *content* will update.
    console.log(`DevTools: Language changed to ${request.lang}. Panel title may not update until DevTools is reopened.`);
    // To attempt re-creation (can be disruptive):
    // await createDevToolsPanel(); // This would create a new panel, potentially duplicating.
  }
  return true;
});


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

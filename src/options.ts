import { loadConfig, saveConfig } from './utils/config';

const $headers = document.querySelector<HTMLTextAreaElement>('#headers')!;
const $strict = document.querySelector<HTMLInputElement>('#strictBearer')!;
const $cookie = document.querySelector<HTMLInputElement>('#captureCookies')!;
const $status = document.querySelector<HTMLParagraphElement>('#status')!;

(async () => {
  const cfg = await loadConfig();
  $headers.value = cfg.headerNames.join('\n');
  $strict.checked = cfg.strictBearer;
  $cookie.checked = cfg.captureCookies;
})();

document.querySelector('#save')!.addEventListener('click', async () => {
  const cfg = {
    headerNames: $headers.value.split(/\s+/).map((h) => h.toLowerCase()).filter(Boolean),
    strictBearer: $strict.checked,
    captureCookies: $cookie.checked,
  };
  await saveConfig(cfg);
  $status.textContent = '✅ 저장되었습니다';
  setTimeout(() => ($status.textContent = ''), 1500);
});
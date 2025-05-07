export interface UserConfig {
    headerNames: string[];    // 감시할 헤더 이름(소문자) 배열
    captureCookies: boolean;  // 쿠키 감시 on/off
    strictBearer: boolean;    // Authorization 헤더에서 Bearer 스킴만 허용?
  }
  
  export const DEFAULT_CONFIG: UserConfig = {
    headerNames: ['authorization', 'x-access-token', 'x-jwt', 'token'],
    captureCookies: true,
    strictBearer: true,
  };
  
  export async function loadConfig(): Promise<UserConfig> {
    const stored = await chrome.storage.sync.get('config');
    return { ...DEFAULT_CONFIG, ...(stored.config as Partial<UserConfig> ?? {}) };
  }
  
  export async function saveConfig(cfg: UserConfig) {
    await chrome.storage.sync.set({ config: cfg });
  }
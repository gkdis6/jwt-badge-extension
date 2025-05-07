// vite.config.ts
import { defineConfig } from 'vite';
import { chromeExtension } from 'vite-plugin-chrome-extension'; // ✅ 네임드 import

export default defineConfig({
  build: {
    rollupOptions: {
      // manifest.json을 진입점으로 지정
      input: 'src/manifest.json',
    },
  },
  plugins: [
    chromeExtension(), // ✅ 함수 호출
  ],
});
// vite.config.ts
import { defineConfig } from 'vite';
import { chromeExtension } from 'vite-plugin-chrome-extension'; // ✅ 네임드 import
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    rollupOptions: {
      // manifest.json을 진입점으로 지정
      input: 'src/manifest.json',
    },
  },
  plugins: [
    chromeExtension() as any, // ✅ 함수 호출, 타입 오류 회피
    viteStaticCopy({
      targets: [
        {
          src: 'src/_locales',
          dest: '.' // dist 폴더의 루트에 _locales로 복사됩니다.
        }
      ]
    })
  ],
});

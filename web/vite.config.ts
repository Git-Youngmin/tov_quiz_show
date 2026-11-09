import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// 로컬 개발: `npm run dev:server`(wrangler dev, :8787) 를 같이 띄우면 /api, /parties 가 프록시된다.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // 같은 Wi-Fi 의 폰에서 접속 테스트
    proxy: {
      "/api": "http://localhost:8787",
      "/parties": { target: "ws://localhost:8787", ws: true },
    },
  },
});

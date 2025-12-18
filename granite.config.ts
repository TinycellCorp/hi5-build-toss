import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'sticky-cookingtowersolitaire', // 개발자 콘솔에 / 앱 정보 / 앱 ID 와 일치.
  brand: {
    displayName: '쿠킹 타워 솔리테어', // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: '#3182F6', // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: "https://static.toss.im/appsintoss/9891/55c9ba33-ffc8-43a1-9021-13e3f00ac9df.png", // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
    bridgeColorMode: 'inverted', // Basic, Inverted
  },
  web: {
    host: 'localhost', // 로컬에서 샌드박스 앱을 연결해 테스트 하려면 설정 해야 한당.
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
  webViewProps: {
    type: 'game'
  }
});

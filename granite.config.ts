import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'hi5games-myidol', // 개발자 콘솔에 / 앱 정보 / 앱 ID 와 일치.
  brand: {
    displayName: '마이 아이돌', // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: '#3182F6', // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: "https://static.toss.im/appsintoss/2281/34d2f053-4e16-4b4c-960a-22f61c952a04.png", // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
    bridgeColorMode: 'inverted', // Basic, Inverted
  },
  web: {
    host: '192.168.0.85', // 로컬에서 샌드박스 앱을 연결해 테스트 하려면 설정 해야 한당.
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'vite build',
    },
  },
  permissions: [
    {
      name: 'photos',
      access: 'write',
    },
    {
      name: 'photos',
      access: 'read',
    }
  ],
  outdir: 'dist',
  webViewProps: {
    type: 'game'
  }
});

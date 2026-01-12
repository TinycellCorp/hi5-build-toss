/* Do not edit - hi5-config */
const hi5AppName = "sticky-ageofsolitaire";
const hi5DisplayName = "에이지 오브 솔리테어";
const hi5PrimaryColor = "#3182F6";
const hi5IconUrl = "https://static.toss.im/appsintoss/9891/08db4ac3-4b0a-4582-9a8e-f715146aa929.png";
const hi5BridgeColorMode = "inverted";
/* End hi5-config */

import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: hi5AppName,
  brand: {
    displayName: hi5DisplayName,
    primaryColor: hi5PrimaryColor,
    icon: hi5IconUrl,
    bridgeColorMode: hi5BridgeColorMode,
  },
  web: {
    host: 'localhost',
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

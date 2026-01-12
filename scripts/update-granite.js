/**
 * Granite 설정 업데이트
 *
 * Usage:
 *   node scripts/update-granite.js --appName "sticky-app" --displayName "앱이름" --primaryColor "#3182F6" --iconUrl "https://..." [--bridgeColorMode "inverted"]
 *
 * Options:
 *   --appName <name>        앱 ID (개발자 콘솔)
 *   --displayName <name>    앱 표시 이름
 *   --primaryColor <color>  기본 색상
 *   --iconUrl <url>         아이콘 URL
 *   --bridgeColorMode <mode> 브릿지 색상 모드 (basic/inverted)
 */

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../granite.config.ts');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--appName' && args[i + 1]) {
      options.appName = args[++i];
    } else if (args[i] === '--displayName' && args[i + 1]) {
      options.displayName = args[++i];
    } else if (args[i] === '--primaryColor' && args[i + 1]) {
      options.primaryColor = args[++i];
    } else if (args[i] === '--iconUrl' && args[i + 1]) {
      options.iconUrl = args[++i];
    } else if (args[i] === '--bridgeColorMode' && args[i + 1]) {
      options.bridgeColorMode = args[++i];
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Granite 설정 업데이트

Usage:
  node scripts/update-granite.js [options]

Options:
  --appName <name>        앱 ID (개발자 콘솔)
  --displayName <name>    앱 표시 이름
  --primaryColor <color>  기본 색상
  --iconUrl <url>         아이콘 URL
  --bridgeColorMode <mode> 브릿지 색상 모드 (basic/inverted)
  --help, -h              도움말 표시
      `);
      process.exit(0);
    }
  }

  return options;
}

function updateGraniteConfig(options) {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error('Error: granite.config.ts 파일을 찾을 수 없습니다:', CONFIG_PATH);
    process.exit(1);
  }

  let config = fs.readFileSync(CONFIG_PATH, 'utf8');
  const changes = [];

  // 변수 선언 방식으로 정규식 매칭
  if (options.appName) {
    config = config.replace(/const hi5AppName = "[^"]*"/, `const hi5AppName = "${options.appName}"`);
    changes.push(`appName: ${options.appName}`);
  }
  if (options.displayName) {
    config = config.replace(/const hi5DisplayName = "[^"]*"/, `const hi5DisplayName = "${options.displayName}"`);
    changes.push(`displayName: ${options.displayName}`);
  }
  if (options.primaryColor) {
    config = config.replace(/const hi5PrimaryColor = "[^"]*"/, `const hi5PrimaryColor = "${options.primaryColor}"`);
    changes.push(`primaryColor: ${options.primaryColor}`);
  }
  if (options.iconUrl) {
    config = config.replace(/const hi5IconUrl = "[^"]*"/, `const hi5IconUrl = "${options.iconUrl}"`);
    changes.push(`iconUrl: ${options.iconUrl}`);
  }
  if (options.bridgeColorMode) {
    config = config.replace(/const hi5BridgeColorMode = "[^"]*"/, `const hi5BridgeColorMode = "${options.bridgeColorMode}"`);
    changes.push(`bridgeColorMode: ${options.bridgeColorMode}`);
  }

  if (changes.length === 0) {
    console.log('변경할 옵션이 없습니다. --help로 사용법을 확인하세요.');
    return;
  }

  fs.writeFileSync(CONFIG_PATH, config);
  console.log('Granite 설정이 업데이트되었습니다!');
  changes.forEach(change => console.log('  -', change));
}

const options = parseArgs();
updateGraniteConfig(options);

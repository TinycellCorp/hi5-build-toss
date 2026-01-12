/**
 * Egret 설정 업데이트 (index.html)
 *
 * Usage:
 *   node scripts/update-egret.js --gameId "38AgeOfSolitaire"
 *
 * Options:
 *   --gameId <id>  EgretLoader.init()에 전달할 게임 ID
 */

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '../index.html');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--gameId' && args[i + 1]) {
      options.gameId = args[++i];
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Egret 설정 업데이트

Usage:
  node scripts/update-egret.js [options]

Options:
  --gameId <id>  EgretLoader.init()에 전달할 게임 ID
  --help, -h     도움말 표시
      `);
      process.exit(0);
    }
  }

  return options;
}

function updateEgretConfig(options) {
  if (!fs.existsSync(INDEX_PATH)) {
    console.error('Error: index.html 파일을 찾을 수 없습니다:', INDEX_PATH);
    process.exit(1);
  }

  let html = fs.readFileSync(INDEX_PATH, 'utf8');
  const changes = [];

  // 변수 선언 방식으로 정규식 매칭
  if (options.gameId) {
    html = html.replace(
      /const hi5GameId = "[^"]*"/,
      `const hi5GameId = "${options.gameId}"`
    );
    changes.push(`gameId: ${options.gameId}`);
  }

  if (changes.length === 0) {
    console.log('변경할 옵션이 없습니다. --help로 사용법을 확인하세요.');
    return;
  }

  fs.writeFileSync(INDEX_PATH, html);
  console.log('Egret 설정이 업데이트되었습니다!');
  changes.forEach(change => console.log('  -', change));
}

const options = parseArgs();
updateEgretConfig(options);

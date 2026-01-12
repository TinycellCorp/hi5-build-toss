/**
 * Hi5 Splash Style Updater
 *
 * Usage:
 *   node scripts/update-splash.js --bg "#ffffff" --indicator "rgb(32,32,32)" --logo "./new_logo.png"
 *
 * Options:
 *   --bg         Background color (e.g., "#ffffff", "white")
 *   --indicator  Loader indicator color (e.g., "rgb(32,32,32)", "#202020")
 *   --logo       Path to logo image (will be converted to base64)
 */

const fs = require('fs');
const path = require('path');

const CSS_PATH = path.join(__dirname, '../sdk/HI5SDK.css');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--bg' && args[i + 1]) {
      options.bgColor = args[++i];
    } else if (args[i] === '--indicator' && args[i + 1]) {
      options.indicatorColor = args[++i];
    } else if (args[i] === '--logo' && args[i + 1]) {
      options.logoPath = args[++i];
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Hi5 Splash Style Updater

Usage:
  node scripts/update-splash.js [options]

Options:
  --bg <color>         Background color (e.g., "#ffffff")
  --indicator <color>  Loader indicator color (e.g., "rgb(32,32,32)")
  --logo <path>        Path to logo image file
  --help, -h           Show this help message
      `);
      process.exit(0);
    }
  }

  return options;
}

function updateSplashStyle(options) {
  if (!fs.existsSync(CSS_PATH)) {
    console.error('Error: CSS file not found:', CSS_PATH);
    process.exit(1);
  }

  let css = fs.readFileSync(CSS_PATH, 'utf8');
  let changes = [];

  // 1. Update background color
  if (options.bgColor) {
    css = css.replace(
      /(\.hi5-intro\s*\{[^}]*?background-color:\s*)[^;]+(;)/s,
      `$1${options.bgColor}$2`
    );
    changes.push(`Background color: ${options.bgColor}`);
  }

  // 2. Update loader indicator color
  if (options.indicatorColor) {
    css = css.replace(
      /(\.loader\s*\{[^}]*?color:\s*)[^;]+(;)/s,
      `$1${options.indicatorColor}$2`
    );
    changes.push(`Indicator color: ${options.indicatorColor}`);
  }

  // 3. Update logo (convert to base64)
  if (options.logoPath) {
    const logoFullPath = path.resolve(options.logoPath);

    if (!fs.existsSync(logoFullPath)) {
      console.error('Error: Logo file not found:', logoFullPath);
      process.exit(1);
    }

    const base64 = fs.readFileSync(logoFullPath).toString('base64');

    // Only replace .hi5logo background-image (not .ageall)
    css = css.replace(
      /(\.hi5logo\s*\{[^}]*?background-image:\s*url\(data:image\/png;base64,)[A-Za-z0-9+\/=]+(\);)/s,
      `$1${base64}$2`
    );
    changes.push(`Logo: ${options.logoPath}`);
  }

  if (changes.length === 0) {
    console.log('No changes specified. Use --help for usage information.');
    return;
  }

  fs.writeFileSync(CSS_PATH, css);

  console.log('Splash style updated!');
  changes.forEach(change => console.log('  -', change));
}

const options = parseArgs();
updateSplashStyle(options);

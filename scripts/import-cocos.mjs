import arg from "arg";
import { $ } from "execa";
import { readFileSync, writeFileSync, rmSync, existsSync, readdirSync, copyFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse arguments
const args = arg({
    "--project": String,
    "--config": String,
    "--editor": String,
    "--gameId": String,
});

const usage = "Usage: npm run import:cocos -- --project ../path/to/cocos-project --config ../path/to/buildConfig.json --gameId 45MyIdol [--editor /path/to/CocosCreator.exe]";

const projectPath = args["--project"];
if (!projectPath) {
    throw new Error(`Missing --project argument. ${usage}`);
}

const configPath = args["--config"];
if (!configPath) {
    throw new Error(`Missing --config argument. ${usage}`);
}

const gameId = args["--gameId"];
if (!gameId) {
    throw new Error(`Missing --gameId argument. ${usage}`);
}

// Resolve absolute paths
const absoluteProjectPath = path.resolve(projectPath);
const absoluteConfigPath = path.resolve(configPath);

console.log("Project path:", absoluteProjectPath);
console.log("Config path:", absoluteConfigPath);
console.log("Game ID:", gameId);

// Read Cocos Creator version from project's package.json
const projectPackageJsonPath = path.join(absoluteProjectPath, "package.json");
if (!existsSync(projectPackageJsonPath)) {
    throw new Error(`package.json not found in project: ${projectPackageJsonPath}`);
}

const projectPackageJson = JSON.parse(readFileSync(projectPackageJsonPath, "utf-8"));
const ccVersion = projectPackageJson.creator?.version;
if (!ccVersion) {
    throw new Error("creator.version not found in project's package.json");
}

console.log("Cocos Creator version:", ccVersion);

// Get Cocos Creator executable path
let cocosPath;

if (args["--editor"]) {
    // 사용자가 직접 경로 지정
    cocosPath = path.resolve(args["--editor"]);
    console.log("Using custom Cocos Creator path:", cocosPath);
} else {
    // 기본 경로 (버전 기반)
    cocosPath = `C:\\ProgramData\\cocos\\editors\\Creator\\${ccVersion}\\CocosCreator.exe`;
    console.log("Using default Cocos Creator path:", cocosPath);
}

if (!existsSync(cocosPath)) {
    const errorMsg = args["--editor"]
        ? `Cocos Creator not found at custom path: ${cocosPath}`
        : `Cocos Creator not found at default path: ${cocosPath}\nTry using --editor to specify custom path`;
    throw new Error(errorMsg);
}

// Read build config
if (!existsSync(absoluteConfigPath)) {
    throw new Error(`Build config not found: ${absoluteConfigPath}`);
}

const buildConfig = JSON.parse(readFileSync(absoluteConfigPath, "utf-8"));
console.log("Build config loaded:", buildConfig.name || "unnamed");

// Set build path to hi5-build-toss and output name to public
const hi5BuildTossPath = path.resolve(__dirname, "..");
const publicPath = path.resolve(hi5BuildTossPath, "public");
const backupPath = path.resolve(hi5BuildTossPath, ".hi5sdk-backup");

buildConfig.buildPath = hi5BuildTossPath;
buildConfig.outputName = "public";

// ============================================
// 1. HI5SDK 파일 백업 (복구 로직 포함)
// ============================================
console.log("\n📦 HI5SDK 파일 백업 중...");
const sdkFiles = ["HI5SDK.css", "HI5SDK.js"];
const backedUpFiles = [];

// 1-1. 이전 백업 폴더가 있으면 복구 (이전 실행 실패 상태)
if (existsSync(backupPath)) {
    console.log("  ⚠️  이전 백업 폴더 발견! 이전 실행이 실패한 것으로 판단됩니다.");
    console.log("  🔄 백업에서 SDK 파일 복원 중...");

    // public 폴더가 없으면 생성
    if (!existsSync(publicPath)) {
        mkdirSync(publicPath, { recursive: true });
    }

    // 백업에서 public으로 복원
    sdkFiles.forEach(file => {
        const backupFile = path.resolve(backupPath, file);
        const publicFile = path.resolve(publicPath, file);

        if (existsSync(backupFile)) {
            copyFileSync(backupFile, publicFile);
            console.log(`  ✅ ${file} 복원 (백업에서)`);
        }
    });
}

// 1-2. public에서 백업
if (existsSync(publicPath)) {
    // 백업 디렉토리 생성 (없으면)
    if (!existsSync(backupPath)) {
        mkdirSync(backupPath, { recursive: true });
    }

    sdkFiles.forEach(file => {
        const sourcePath = path.resolve(publicPath, file);
        const destPath = path.resolve(backupPath, file);

        if (existsSync(sourcePath)) {
            copyFileSync(sourcePath, destPath);
            backedUpFiles.push(file);
            console.log(`  ✅ ${file} 백업 완료`);
        } else {
            console.log(`  ⚠️  ${file} 파일을 찾을 수 없습니다`);
        }
    });
} else {
    console.log("  ⚠️  public 폴더가 존재하지 않습니다");
}

// 1-3. 백업된 파일 확인
if (backedUpFiles.length === 0) {
    console.log("  ⚠️  백업할 HI5SDK 파일을 찾을 수 없습니다");
    console.log("  ⚠️  빌드 후 HI5SDK 파일이 없을 수 있습니다");
}

// ============================================
// 2. public 디렉토리 클린
// ============================================
if (existsSync(publicPath)) {
    console.log("\n🧹 public 디렉토리 클린 중...");
    rmSync(publicPath, { recursive: true, force: true });
    console.log("  ✅ public 디렉토리 삭제 완료");
}

// ============================================
// 3. Cocos Creator 빌드 실행
// ============================================
// Write temporary build config (in hi5-build-toss project root)
const tempConfigPath = path.resolve(__dirname, "..", "temp-build-config.json");
writeFileSync(tempConfigPath, JSON.stringify(buildConfig, null, 4));
console.log("\n📝 Temporary build config created:", tempConfigPath);

// Execute Cocos Creator CLI build
console.log("\n🎮 Starting Cocos Creator build...");
const building = $(
    cocosPath,
    ["--project", absoluteProjectPath, "--build", `configPath=${tempConfigPath}`],
    {
        stdout: "pipe",
        stderr: "pipe",
    }
);

let quitTimeoutId;
building.stdout.on("data", (data) => {
    const output = data.toString();
    console.log(output);

    // Detect "Finished" to trigger auto-quit timeout
    if (output.includes("Finished")) {
        console.log("Build finished detected. Waiting 5 seconds before force quit...");
        quitTimeoutId = setTimeout(() => {
            if (building.killed) {
                console.log("Already killed");
                return;
            }
            console.log("Force quitting...");
            building.kill(new Error("QUIT_TIMEOUT"));
        }, 5000);
    }
});

building.stderr.on("data", (data) => {
    console.error(data.toString());
});

let buildSuccess = false;
try {
    await building;
    buildSuccess = true;
} catch (e) {
    if (e.message === "QUIT_TIMEOUT") {
        console.log("\n✅ Build completed (force quit after timeout)");
        buildSuccess = true;
    } else {
        console.log("Build ExitCode:", e.exitCode);
        const isSuccess = e.exitCode === 36;
        if (isSuccess) {
            buildSuccess = true;
        } else {
            console.error("\n❌ 빌드 실패");
            buildSuccess = false;
        }
    }
} finally {
    clearTimeout(quitTimeoutId);

    // Clean up temporary config
    if (existsSync(tempConfigPath)) {
        rmSync(tempConfigPath);
        console.log("Temporary build config removed");
    }

    // ============================================
    // 4. HI5SDK 파일 복원 (빌드 성공/실패 무관하게 항상 실행)
    // ============================================
    console.log("\n📦 HI5SDK 파일 복원 중...");

    // 4-0. 빌드 실패 시 public 폴더 확인 및 생성
    if (!buildSuccess && !existsSync(publicPath)) {
        mkdirSync(publicPath, { recursive: true });
        console.log("  ✅ public 폴더 생성 (빌드 실패 복구)");
    }

    // 4-1. 백업 폴더에서 복원
    if (existsSync(backupPath)) {
        sdkFiles.forEach(file => {
            const sourcePath = path.resolve(backupPath, file);
            const destPath = path.resolve(publicPath, file);

            if (existsSync(sourcePath)) {
                copyFileSync(sourcePath, destPath);
                console.log(`  ✅ ${file} 복원 완료`);
            }
        });

        // 4-2. 백업 폴더 삭제 (항상 삭제)
        rmSync(backupPath, { recursive: true, force: true });
        console.log("  ✅ 백업 폴더 삭제 완료");
    } else {
        console.log("  ⚠️  백업 폴더가 없습니다");
    }

    // ============================================
    // 4.5. cocos-loader.js 복사 (빌드 성공/실패 무관하게 항상 실행)
    // ============================================
    console.log("\n📦 cocos-loader.js 복사 중...");
    const loaderSource = path.resolve(__dirname, "cocos-loader.js");
    const loaderDest = path.resolve(publicPath, "cocos-loader.js");

    if (existsSync(loaderSource)) {
        copyFileSync(loaderSource, loaderDest);
        console.log("  ✅ cocos-loader.js 복사 완료");
    } else {
        console.log("  ⚠️  scripts/cocos-loader.js 파일을 찾을 수 없습니다");
    }
}

// ============================================
// 5. 메타데이터 생성 (index.html이 있으면 생성)
// ============================================
const metadataPath = generateGameMetadata(publicPath, gameId);

// 6. 메타데이터를 루트에도 복사 (빌드 성공 시에만)
if (metadataPath && existsSync(metadataPath)) {
    const rootMetadataPath = path.resolve(hi5BuildTossPath, 'cocos-metadata.json');
    copyFileSync(metadataPath, rootMetadataPath);
    console.log("\n📄 메타데이터를 루트로 복사:", rootMetadataPath);
}

if (buildSuccess) {
    console.log("\n✅ Cocos build imported to public successfully!");
} else {
    console.log("\n⚠️  빌드는 실패했지만 Hi5 환경(SDK + cocos-loader)은 정상 복원되었습니다");
    process.exit(1);
}

// ============================================
// 유틸리티 함수들
// ============================================

/**
 * 게임 메타데이터 생성
 * @param {string} gameDir - 게임 빌드 결과물이 있는 디렉토리 (index.html 포함)
 * @param {string} gameId - 게임 ID
 * @returns {string|null} 생성된 메타데이터 파일 경로
 */
function generateGameMetadata(gameDir, gameId) {
    console.log("\n📄 게임 메타데이터 생성 중...");
    const indexHtmlPath = path.resolve(gameDir, 'index.html');

    if (!existsSync(indexHtmlPath)) {
        console.log(`   ⚠️  index.html을 찾을 수 없습니다. 메타데이터를 생성하지 않습니다.`);
        return null;
    }

    try {
        const html = readFileSync(indexHtmlPath, 'utf-8');

        // <script src="..."> 추출 (type="systemjs-importmap" 제외)
        const scriptSrcRegex = /<script\s+src="([^"]+)"(?![^>]*type="systemjs-importmap")[^>]*>/g;
        const scripts = [];
        let match;
        while ((match = scriptSrcRegex.exec(html)) !== null) {
            scripts.push(match[1]);
        }

        // <script type="systemjs-importmap" src="..."> 추출
        const importMapRegex = /<script\s+src="([^"]+)"\s+type="systemjs-importmap"/g;
        const importMaps = [];
        while ((match = importMapRegex.exec(html)) !== null) {
            importMaps.push(match[1]);
        }

        // System.import('...') 추출
        const systemImportRegex = /System\.import\(['"]([^'"]+)['"]\)/;
        const systemImportMatch = html.match(systemImportRegex);
        const systemImport = systemImportMatch ? systemImportMatch[1] : null;

        // <link rel="stylesheet"> 추출
        const styleRegex = /<link\s+rel="stylesheet"[^>]*href="([^"]+)"/g;
        const styles = [];
        while ((match = styleRegex.exec(html)) !== null) {
            styles.push(match[1]);
        }

        // 엔진 감지
        const engine = detectGameEngine(gameDir);

        // 메타데이터 생성
        const metadata = {
            gameId,
            engine,
            scripts,
            importMaps,
            systemImport,
            styles,
            importedAt: new Date().toISOString()
        };

        const metadataPath = path.resolve(gameDir, 'cocos-metadata.json');
        writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

        console.log(`   ✅ 게임 ID: ${gameId}`);
        console.log(`   ✅ 엔진: ${engine}`);
        console.log(`   ✅ 스크립트: ${scripts.length}개`);
        console.log(`   ✅ Import Map: ${importMaps.length}개`);
        console.log(`   ✅ System Import: ${systemImport || '없음'}`);
        console.log(`   ✅ 스타일시트: ${styles.length}개`);
        console.log(`   ✅ cocos-metadata.json 생성 완료`);

        return metadataPath;
    } catch (error) {
        console.error(`   ⚠️  메타데이터 생성 실패: ${error.message}`);
        return null;
    }
}

/**
 * 게임 엔진 감지
 * @param {string} gameDir - 게임 빌드 결과물 디렉토리
 * @returns {string} 'cocos' | 'egret' | 'unknown'
 */
function detectGameEngine(gameDir) {
    // Cocos 감지: cocos-js/cc.*.js 패턴
    const cocosJsDir = path.resolve(gameDir, 'cocos-js');
    if (existsSync(cocosJsDir)) {
        try {
            const files = readdirSync(cocosJsDir);
            const hasCocosFile = files.some(file => /^cc\..*\.js$/.test(file));
            if (hasCocosFile) return 'cocos';
        } catch {
            // 폴더 읽기 실패 시 무시
        }
    }

    // Egret 감지: js/egret.*.js 패턴
    const jsDir = path.resolve(gameDir, 'js');
    if (existsSync(jsDir)) {
        try {
            const files = readdirSync(jsDir);
            const hasEgretFile = files.some(file => /^egret\..*\.js$/.test(file));
            if (hasEgretFile) return 'egret';
        } catch {
            // 폴더 읽기 실패 시 무시
        }
    }

    return 'unknown';
}

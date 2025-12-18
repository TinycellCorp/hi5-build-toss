#!/usr/bin/env node
/**
 * import-egret.js
 * Egret 프로젝트를 빌드하고 Hi5 플랫폼용으로 배포하는 스크립트
 *
 * 사용법:
 *   npm run import:egret -- --project ../egret --output ./public
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * 명령줄 인자 파싱
 */
function parseArgs(args) {
    const result = {
        project: '../egret',
        output: './public'
    };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--project' && args[i + 1]) {
            result.project = args[i + 1];
            i++;
        } else if (args[i] === '--output' && args[i + 1]) {
            result.output = args[i + 1];
            i++;
        }
    }

    return result;
}

/**
 * 메인 함수
 */
function main() {
    const args = parseArgs(process.argv.slice(2));

    // 스크립트 디렉토리 기준으로 경로 계산
    const scriptDir = __dirname;
    const baseDir = path.resolve(scriptDir, '..');
    const projectPath = path.resolve(baseDir, args.project);
    const outputPath = path.resolve(baseDir, args.output);
    const sdkDir = path.join(baseDir, 'sdk');

    console.log('=== Egret Import Script ===');
    console.log(`Project: ${projectPath}`);
    console.log(`Output: ${outputPath}`);
    console.log('');

    // 프로젝트 경로 확인
    if (!fs.existsSync(projectPath)) {
        console.error(`Error: Project path not found: ${projectPath}`);
        process.exit(1);
    }

    // output 디렉토리 생성 (없으면)
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
        console.log(`Created output directory: ${outputPath}`);
    }

    // egret publish 실행
    console.log('Running egret publish...');
    try {
        const egretCmd = process.platform === 'win32' ? 'egret.cmd' : 'egret';
        // "." 을 명시적으로 지정하여 현재 디렉토리(projectPath)를 프로젝트로 인식시킴
        const command = `${egretCmd} publish . --platform toss --output "${outputPath}"`;

        console.log(`> ${command}`);
        console.log(`> cwd: ${projectPath}`);
        console.log('');

        execSync(command, {
            cwd: projectPath,
            stdio: 'inherit',
            shell: true
        });

        console.log('');
        console.log('Egret publish completed.');
    } catch (error) {
        console.error('Error: Egret publish failed.');
        console.error(error.message);
        process.exit(1);
    }

    // SDK 파일 복사
    console.log('');
    console.log('Copying SDK files...');

    const sdkFiles = ['HI5SDK.css', 'HI5SDK.js'];

    for (const file of sdkFiles) {
        const srcPath = path.join(sdkDir, file);
        const destPath = path.join(outputPath, file);

        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`  Copied: ${file}`);
        } else {
            console.warn(`  Warning: SDK file not found: ${srcPath}`);
        }
    }

    // egret-loader.js 복사
    console.log('');
    console.log('Copying egret-loader.js...');
    const loaderSrcPath = path.join(scriptDir, 'egret-loader.js');
    const loaderDestPath = path.join(outputPath, 'egret-loader.js');

    if (fs.existsSync(loaderSrcPath)) {
        fs.copyFileSync(loaderSrcPath, loaderDestPath);
        console.log(`  Copied: egret-loader.js`);
    } else {
        console.warn(`  Warning: egret-loader.js not found: ${loaderSrcPath}`);
    }

    console.log('');
    console.log('=== Import completed ===');
}

main();

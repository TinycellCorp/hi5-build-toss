/**
 * Cocos 게임 동적 로더
 * - 메타데이터 기반으로 게임 리소스를 동적으로 로드
 * - Hi5 초기화 후 게임 시작
 */

(function() {
  'use strict';

  let cocosMetadata = null;

  /**
   * 메인 초기화 함수
   */
  window.onload = async function() {
    try {
      console.log('🎮 Cocos Loader 시작...');

      // 1. 메타데이터 로드
      console.log('📋 메타데이터 로드 중...');
      const metadata = await fetch('./cocos-metadata.json').then(r => r.json());
      cocosMetadata = metadata;
      console.log('✅ 메타데이터 로드 완료:', metadata);

      // 2. Hi5 초기화 (게임 리소스는 아직 로드 안 함)
      console.log('🔧 Hi5 초기화 시작...');
      const ret = await window.HI5TOSS.init(cocosMetadata.gameId);
      console.log('✅ Hi5TOSS 초기화 완료');

    } catch (error) {
      console.error('❌ 초기화 실패:', error);
      alert('초기화에 실패했습니다: ' + error.message);
    }
  };

  /**
   * Hi5 초기화 완료 후 게임 로드
   */
  window.HI5CORE.onLoad = async function() {
    console.log('🎮 Hi5 초기화 완료! 게임 로드 시작...');

    // retView 숨기기
    const retView = document.getElementById('retView');
    if (retView) {
      retView.style.display = 'none';
    }

    try {
      // 게임 리소스 로드
      await loadCocosResources();

      // System.import 실행
      if (cocosMetadata && cocosMetadata.systemImport) {
        console.log('🚀 게임 시작:', cocosMetadata.systemImport);
        System.import(`./${cocosMetadata.systemImport}`)
          .then(() => console.log('✅ 게임 시작 성공'))
          .catch(err => {
            console.error('❌ 게임 시작 실패:', err);
            alert('게임 시작에 실패했습니다: ' + err.message);
          });
      }
    } catch (error) {
      console.error('❌ 게임 리소스 로드 실패:', error);
      alert('게임 리소스 로드에 실패했습니다: ' + error.message);
    }
  };

  /**
   * 게임 리소스 로드 함수
   */
  async function loadCocosResources() {
    if (!cocosMetadata) {
      throw new Error('메타데이터가 없습니다');
    }

    const loadedScripts = [];

    try {
      // 1. 스타일 로드
      console.log('📦 스타일 로드 중...');
      cocosMetadata.styles.forEach(style => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `./${style}`;
        document.head.appendChild(link);
        console.log('  ✅', style);
      });

      // 2. GameDiv 생성 (body 맨 앞에 추가)
      console.log('📦 게임 컨테이너 생성 중...');
      const gameDiv = document.createElement('div');
      gameDiv.id = 'GameDiv';
      gameDiv.setAttribute('cc_exact_fit_screen', 'true');
      gameDiv.innerHTML = `
        <div id="Cocos3dGameContainer">
          <canvas id="GameCanvas" oncontextmenu="event.preventDefault()" tabindex="99"></canvas>
        </div>
      `;
      document.body.prepend(gameDiv);
      console.log('  ✅ GameDiv를 body 맨 앞에 추가');

      // 3. 일반 스크립트 순차 로드
      console.log('📦 스크립트 로드 중...');
      for (const scriptSrc of cocosMetadata.scripts) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = `./${scriptSrc}`;
          script.charset = 'utf-8';
          script.onload = () => {
            console.log('  ✅', scriptSrc);
            resolve();
          };
          script.onerror = () => reject(new Error(`Failed to load ${scriptSrc}`));
          document.body.appendChild(script);
          loadedScripts.push(script);
        });
      }

      // 4. Import Map 로드
      console.log('📦 Import Map 로드 중...');
      for (const importMapSrc of cocosMetadata.importMaps) {
        const script = document.createElement('script');
        script.src = `./${importMapSrc}`;
        script.type = 'systemjs-importmap';
        script.charset = 'utf-8';
        document.body.appendChild(script);
        loadedScripts.push(script);
        console.log('  ✅', importMapSrc);

        // Import Map 등록 대기
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log('✅ 모든 리소스 로드 완료');

    } catch (error) {
      console.error('❌ 리소스 로드 실패:', error);

      // Cleanup on error
      loadedScripts.forEach(script => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });

      throw error;
    }
  }

})();

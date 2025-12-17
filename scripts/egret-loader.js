// egret-loader.js
// Egret 게임을 Hi5 플랫폼에 동적으로 로드하는 로더
(function() {
    'use strict';

    // 스크립트 동적 로드 함수
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                console.log(`[EgretLoader] Loaded: ${src}`);
                resolve();
            };
            script.onerror = () => reject(new Error(`Failed to load: ${src}`));
            document.head.appendChild(script);
        });
    }

    // 여러 스크립트 순차 로드
    async function loadScripts(scriptArray) {
        for (const scriptPath of scriptArray) {
            await loadScript(scriptPath);
        }
    }

    // Egret 게임 플레이어 div 생성
    function createEgretPlayer() {
        const playerDiv = document.createElement('div');
        playerDiv.style.cssText = "margin: auto; width: 100%; height: 100%;";
        playerDiv.className = "egret-player";
        playerDiv.setAttribute('data-entry-class', 'Main');
        playerDiv.setAttribute('data-orientation', 'portrait');
        playerDiv.setAttribute('data-scale-mode', 'fixedNarrow');
        playerDiv.setAttribute('data-frame-rate', '30');
        playerDiv.setAttribute('data-content-width', '720');
        playerDiv.setAttribute('data-content-height', '1280');
        playerDiv.setAttribute('data-show-paint-rect', 'false');
        playerDiv.setAttribute('data-multi-fingered', '2');
        playerDiv.setAttribute('data-show-fps', 'false');
        playerDiv.setAttribute('data-show-fps-style', 'x:0,y:0,size:12,textColor:0xffffff,bgAlpha:0.9');
        document.body.appendChild(playerDiv);
        console.log('[EgretLoader] Egret player div created');
        return playerDiv;
    }

    // EgretLoader 객체를 window에 노출
    window.EgretLoader = {
        /**
         * Egret 게임 로더 초기화
         * @param {string} gameId - Hi5 게임 ID
         * @returns {Promise<void>}
         */
        init: async function(gameId) {
            console.log(`[EgretLoader] Initializing with gameId: ${gameId}`);

            try {
                // manifest.json 로드
                console.log('[EgretLoader] Loading manifest.json...');
                const response = await fetch('./manifest.json');
                if (!response.ok) {
                    throw new Error(`Failed to fetch manifest.json: ${response.status}`);
                }
                const manifest = await response.json();
                console.log('[EgretLoader] Manifest loaded:', manifest);

                // HI5TOSS 초기화
                console.log('[EgretLoader] Initializing HI5TOSS...');
                await window.HI5TOSS.init(gameId);
                console.log('[EgretLoader] HI5TOSS initialized');

                // HI5CORE.onLoad 콜백 설정
                window.HI5CORE.onLoad = async function() {
                    console.log('[EgretLoader] HI5CORE.onLoad called - Starting game load');

                    // 디버그 뷰 숨김
                    const retView = document.getElementById('retView');
                    if (retView) {
                        retView.style.display = "none";
                    }

                    try {
                        // Egret 플레이어 div 생성
                        const playerDiv = createEgretPlayer();

                        // initial 스크립트 로드 (Egret 프레임워크)
                        if (manifest.initial && manifest.initial.length > 0) {
                            console.log(`[EgretLoader] Loading ${manifest.initial.length} initial scripts...`);
                            await loadScripts(manifest.initial);
                            console.log('[EgretLoader] Initial scripts loaded');
                        }

                        // game 스크립트 로드 (게임 코드)
                        if (manifest.game && manifest.game.length > 0) {
                            console.log(`[EgretLoader] Loading ${manifest.game.length} game scripts...`);
                            await loadScripts(manifest.game);
                            console.log('[EgretLoader] Game scripts loaded');
                        }

                        // window.egret 객체 확인 및 게임 시작
                        if (window.egret) {
                            console.log('[EgretLoader] window.egret available');

                            // Egret는 자동으로 .egret-player div를 찾아서 data-entry-class를 실행
                            // 명시적으로 runEgret 같은 함수가 있다면 호출
                            if (typeof window.egret.runEgret === 'function') {
                                console.log('[EgretLoader] Calling egret.runEgret()');
                                window.egret.runEgret();
                            } else {
                                console.log('[EgretLoader] Egret will auto-start with data-entry-class="Main"');
                            }

                            console.log('[EgretLoader] Game started successfully');
                        } else {
                            throw new Error('window.egret is not available after loading scripts');
                        }

                    } catch (error) {
                        console.error('[EgretLoader] Failed to load game:', error);
                        // 사용자에게 에러 표시
                        if (window.HI5CORE && typeof window.HI5CORE.showAlert === 'function') {
                            window.HI5CORE.showAlert('게임 로드 실패: ' + error.message);
                        }
                        throw error;
                    }
                };

            } catch (error) {
                console.error('[EgretLoader] Initialization failed:', error);
                // 사용자에게 에러 표시
                if (window.HI5CORE && typeof window.HI5CORE.showAlert === 'function') {
                    window.HI5CORE.showAlert('초기화 실패: ' + error.message);
                }
                throw error;
            }
        }
    };

    console.log('[EgretLoader] EgretLoader ready');
})();

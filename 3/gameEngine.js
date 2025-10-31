
        function enableDragAndDrop() {
            const gHand = document.querySelector('#gHand');
            
            gHand.addEventListener('dragstart', (e)=>{  //드래그 발생했을 때
                const img = e.target.closest('img.pic'); //드래그 발생 요소가 img인가
                if (!img) return;                       //img아니면 무시
                img.classList.add('is-dragging');   //애니효과를 위해 클래스 추가
                e.dataTransfer.setData('cardId', img.id);  //카드id 데이터 저장
                })
            
                gHand.addEventListener('dragend', (e) =>{   //드래그 끝났을 때
                const img = e.target.closest('img.pic');
                if (img) img.classList.remove('is-dragging');   //드래그 클래스 제거
            });
            
            const comm = document.querySelector('.community');
            
            comm.addEventListener('dragover', (e) =>{
                if (e.target.closest('img.pic')) return;
                e.preventDefault(); //드랍 가능 영역 위에 있을 때 드랍차단을 막기
            });
            comm.addEventListener('drop', async (e) => {
                e.preventDefault(); //기존 탭에서 드롭 처리
                
                const cardId = e.dataTransfer.getData('cardId');//저장된 id 불러오기
                const card = document.getElementById(cardId);
                if (!card) return;

                const prevCard = getCommunityPlayerCard();
                if(prevCard && prevCard !== card){
                    
                    gHand.appendChild(prevCard);
                    prevCard.classList.remove('drop-anim');
                    prevCard.animate(
                        [
                            { transform: 'scale(1.2)', opacity: 0.8 },
                            { transform: 'scale(1)', opacity: 1 }
                        ],
                        { duration: 250, easing: 'ease-out' }
                    );
                }
                comm.appendChild(card);//community 영역에 카드 넣기
                card.classList.add('drop-anim') //드랍 애니메이션 클래스
                setTimeout(()=> card.classList.remove('drop-anim'),300);
                await ensureGoButton();
                await updateGoVisibility();
            });
        }
        async function onGoClick(e) {
            const btn = e.currentTarget;
            btn.disabled = true;
            const gHand = document.querySelector('#gHand');
            gHand.style.pointerEvents = 'none';
            await enemyPlay();//상대도 카드 내는 로직
            btn.classList.remove('show'); //go 버튼 숨기기
            btn.disabled = false;
        }
        function enemyPlay(delayMs = 500, flipDelayMs =200){
            return new Promise(resolve => { //Promise를 반환해서 상위에서 await 가능하도록 만듦
                const comm = document.querySelector('.community');
                if (getCommunityEnemyCard()) return resolve();  //enemy카드 있다면 아무것도 안 함 그런데 필요없는 기능. 추후 삭제
                
                const enemyCards = Array.from(document.querySelectorAll('#bHand img.enemy'));//적이 패에서 낼 수 있는 카드 목록 수집함
                if (!enemyCards.length) return resolve();//낼 카드가 없으면 종료 - 적의 승리임. 추후 더 연결해야 함
                
                //community를 2단 구조로 전환
                const playerCard = comm.querySelector('img[data-owner="player"]');//중앙에 플레이어 카드 있는지 확인. 필요한 기능인가?
                let playerSlot = comm.querySelector('.player-slot');//슬롯 존재 여부 확인. 삭제해도 될 것 같음
                let enemySlot = comm.querySelector('.enemy-slot');

                if (playerCard && (!playerSlot || !enemySlot)){ //플레이어가 있고 슬롯이 없다면
                    const tempCard = playerCard; //플레이어 카드 임시 저장
                    comm.innerHTML =`
                        <div class="enemy-slot"></div>
                        <div class="player-slot"></div>
                    `;
                    playerSlot = comm.querySelector('.player-slot');
                    enemySlot = comm.querySelector('.enemy-slot');
                    if(playerSlot && tempCard){//플레이어 슬롯과 임시 저장된 카드가 있다면
                    playerSlot.appendChild(tempCard); //플레이어 카드 아래로 이동
                    }
                }
                //badee의 choose 알고리즘으로 바꿔넣을 곳
                
                const n = chooseEnemyIndexByDOM();
                const chosen = enemyCards[n]
                //연출 추후에 강화
                setTimeout(()=> {   //enemy가 카드를 낼 타이밍
                    //혹시라도 구조가 없으면 comm에 직접 추가
                    const safeEnemySlot = comm.querySelector('.enemy-slot') || comm;
                    safeEnemySlot.appendChild(chosen);
                    chosen.classList.add('drop-anim');  //카드 등장 애니메이션
                    
                    
                    setTimeout(() => {
                        chosen.classList.remove('drop-anim');
                        chosen.classList.add('flip-anim');
                        setTimeout(() => {
                            const front = chosen.dataset.front;
                            if (front) {
                                chosen.src = front;
                            }
                            chosen.classList.remove('flip-anim');

                        // 3️⃣ flip 끝나고 1000ms 후 빛, 1000ms 후 결과
                            setTimeout(() => {
                            showResultFlash(comm);
                            setTimeout(()=> {checkWinner().then(resolve);
                                }, 2000);
                            }, 1000);
                        }, 300); // flip duration
                    }, flipDelayMs);
                }, delayMs);
            });
            updateEnemyCount();
        }
        async function checkWinner() {
            const comm = document.querySelector('.community');
            const playerCard = comm.querySelector('img[data-owner="player"]');
            const enemyCard = comm.querySelector('img[data-owner="enemy"]');
            if (!playerCard || !enemyCard) return;

            const pType = getCardType(playerCard);
            const eType = getCardType(enemyCard);

            const result = getWinner(pType, eType);

            await showResultImage(result);
            await resolveRound(result);
            updateEnemyCount()
            updatePlayerCount();
        }
        async function showResultImage(result){
            const comm =document.querySelector('.community');
            let imgSrc ='';
            switch (result){
                case 'playerWin': imgSrc = './image/ui/win.png'; break;
                case 'enemyWin': imgSrc = './image/ui/lose.png'; break;
                case 'draw': imgSrc = './image/ui/draw.png'; break;
                default: return;
            }
            const img = document.createElement('img');
            img.src =imgSrc;
            img.className = 'result-image';
            comm.appendChild(img);

            img.classList.add('show');
            await new Promise(r => setTimeout(r,1500));
            img.classList.add('hide');
            setTimeout(()=> img.remove(),800);
        }
        async function resolveRound(result) {
            const comm = document.querySelector('.community');
            const playerCard = getCommunityPlayerCard();
            const enemyCard = getCommunityEnemyCard();
                if (!playerCard || !enemyCard) return;
            // 공통 연출: 살짝 확대 후 이동 시작
            [playerCard, enemyCard].forEach(c => c.style.transition = 'all 0.5s ease');
            
                // 구디 승리: 그대로 자신의 손으로
                if (result === 'playerWin') {
                const bHand = document.querySelector('#gHand');
                [playerCard, enemyCard].forEach(c=>{
                    c.dataset.owner = "player";
                })
                
                document.querySelector('#gHand').appendChild(playerCard);
                document.querySelector('#gHand').appendChild(enemyCard);
            } 

                // 배디 승리: 두 카드 모두 rev 상태로 뒤집어 복귀
                else if (result === 'enemyWin') {
                const bHand = document.querySelector('#bHand');
                [playerCard, enemyCard].forEach(c => {
                    const origin = c.dataset.origin;

                    const revImg = origin === 'goodee'
                        ? './image/cards/card_goodee_rev.png'
                        : './image/cards/card_badee_rev.png';
        
                    c.src = revImg;                     // 카드 이미지를 뒷면으로 변경
                    c.dataset.owner = "enemy";          // 소유자만 변경 (owner 속성)
                    c.classList.remove('player');       // player 표식 제거
                    c.classList.add('enemy');           // enemy 표식 추가

                    c.style.animation = 'flyToEnemy 1s ease forwards';  //나중에 구디도 쓰게 css로 클래스화 함

                    setTimeout(()=> {
                    bHand.appendChild(c);
                    c.style.animation='';
                    updateEnemyCount()
                    }, 1000);
                });
            }
                // 무승부: 두 카드 neutral화 후 'grave'로 이동
                else if (result === 'draw') {
        
            const grave = prepareGraveArea();
            const neutralImg = './image/cards/card_neutral.png';
            
            [playerCard, enemyCard].forEach((c, index) => {
                c.src = neutralImg;
                c.classList.remove('player', 'enemy');
                c.classList.add('neutral');
                flyToGrave(c, grave);

                });
            }
            getBaddyQuipByResult(result)
            await new Promise(r => setTimeout(r, 500));
            await resetRound();
            updateEnemyCount();
        }
        async function resetRound() {
            const comm = document.querySelector('.community');
            comm.innerHTML = '';
            const gHand = document.querySelector('#gHand');
            gHand.style.pointerEvents = 'auto';
            await updateGoVisibility();
            ensureGoButton();
            checkGameOver();
            updateEnemyCount();
        }
        function checkGameOver() {  //남은 패의 갯수 확인
            const playerCards = document.querySelectorAll('#gHand img').length;
            const enemyCards = document.querySelectorAll('#bHand img').length;

            if (playerCards === 0 && enemyCards === 0) showFinalResult('noWin');
            else if (playerCards === 0) showFinalResult('goodeeWin');
            else if (enemyCards === 0) showFinalResult('badeeWin'); 
        }
        async function showFinalResult(result) {    //게임종료화면
            const fullscreen = document.querySelector('.fullscreen');

            // 기존 라운드용 GO 버튼, 카드 상호작용 모두 비활성화
            const goBtn = document.getElementById('goBtn');
            if (goBtn) goBtn.disabled = true;

            document.querySelectorAll('img.pic').forEach(img => {
                img.draggable = false;
                img.style.pointerEvents = 'none';
            });

            // 결과 이미지 소스 선택
            let imgSrc = '';
            switch (result) {
                case 'goodeeWin': imgSrc = './image/ui/final_win.png'; break;
                case 'badeeWin': imgSrc = './image/ui/final_lose.png'; break;
                case 'noWin' : imgSrc ='./image/ui/final_draw.png'; break;
                default: return;
            }

            // 최종 결과 오버레이 생성
            const overlay = document.createElement('div');
            overlay.className = 'final-overlay';
            overlay.innerHTML = `
                <img src="${imgSrc}" class="final-image">
                <div class="final-text">${(result === 'goodeeWin') ? 'YOU WIN!' : (result === 'badeeWin') ? 'YOU LOSE' : 'DRAW'}</div>
                <button class="restart-btn">RESTART</button>`;
            fullscreen.appendChild(overlay);

            // 페이드 인
            await new Promise(r => setTimeout(r, 100));
            overlay.classList.add('show');


            const restartBtn = overlay.querySelector('.restart-btn');
            restartBtn.addEventListener('click',()=>{
                overlay.classList.add('fadeout');
                setTimeout(()=>{
                    overlay.remove();
                    restartGame();
                }, 1500);
            });
        }
        function restartGame() {    //게임재시작
            document.querySelectorAll('#gHand, #bHand, .community').forEach(el => el.innerHTML = '');
            const grave = document.querySelector('.grave');
            if (grave) grave.remove();
            init(); //다시 init 발동
        }
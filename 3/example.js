function enableDragAndDrop() {
  const gHand = document.querySelector('#gHand');

  gHand.addEventListener('dragstart', (e) => {  // 드래그 시작
    const img = e.target.closest('img.pic');
    if (!img) return;
    e.dataTransfer.setData('cardId', img.id);    // 카드 id 저장
  });

  gHand.addEventListener('dragend', (e) => {    // 드래그 종료
    const img = e.target.closest('img.pic');
    // 필요 시 드래그 클래스 정리 가능
  });

  const comm = document.querySelector('.community');

  // 이미지 위에서는 드랍 금지, 그 외 영역에서는 허용
  comm.addEventListener('dragover', (e) => {
    if (e.target.closest('img.pic')) return;
    e.preventDefault();
  });

  // 항상 community 루트에만 붙이고, 상태(player)로 보정
  comm.addEventListener('drop', async (e) => {
    e.preventDefault();

    const cardId = e.dataTransfer.getData('cardId');
    const card = document.getElementById(cardId);
    if (!card) return;

    const prevCard = getCommunityPlayerCard();
    if (prevCard && prevCard !== card) {
      // 기존 플레이어 카드가 있으면 손으로 되돌림 + 상태 보정
      prevCard.dataset.owner = 'player';
      prevCard.classList.remove('enemy', 'neutral');
      prevCard.classList.add('player');

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

    // 반드시 community 루트에 부착
    comm.appendChild(card);

    // 드랍된 카드를 플레이어 소유 상태로 보정
    card.dataset.owner = 'player';
    card.classList.remove('enemy', 'neutral');
    card.classList.add('player');

    // 드랍 애니메이션
    card.classList.add('drop-anim');
    setTimeout(() => card.classList.remove('drop-anim'), 300);

    await ensureGoButton();
    await updateGoVisibility();
  });
}

async function onGoClick(e) {
  const btn = e.currentTarget;
  btn.disabled = true;

  const gHand = document.querySelector('#gHand');
  gHand.style.pointerEvents = 'none';

  await enemyPlay();              // 상대 턴 진행

  btn.classList.remove('show');   // GO 버튼 숨김
  btn.disabled = false;
}

function enemyPlay(delayMs = 500, flipDelayMs = 200) {
  return new Promise(resolve => {
    const comm = document.querySelector('.community');

    // (논리 수정) 조기 종료 가드 제거
    // if (getCommunityEnemyCard()) return resolve();

    const enemyCards = Array.from(document.querySelectorAll('#bHand img.enemy'));
    if (!enemyCards.length) return resolve(); // 적이 낼 카드가 없으면 그냥 종료

    // 커뮤니티를 2단 구조로 전환
    const playerCard = comm.querySelector('img[data-owner="player"]');
    let playerSlot = comm.querySelector('.player-slot');
    let enemySlot = comm.querySelector('.enemy-slot');

    if (playerCard && (!playerSlot || !enemySlot)) {
      const tempCard = playerCard;
      comm.innerHTML = `
        <div class="enemy-slot"></div>
        <div class="player-slot"></div>
      `;
      playerSlot = comm.querySelector('.player-slot');
      enemySlot = comm.querySelector('.enemy-slot');
      if (playerSlot && tempCard) {
        playerSlot.appendChild(tempCard); // 플레이어 카드를 아래 슬롯으로 이동
      }
    }

    // (임시) 랜덤 선택 — 추후 badee 알고리즘으로 교체
    const chosen = enemyCards[Math.floor(Math.random() * enemyCards.length)];

    setTimeout(() => {   // enemy가 카드를 낼 타이밍
      // 슬롯 구조가 없으면 community에 직접 추가
      const safeEnemySlot = comm.querySelector('.enemy-slot') || comm;
      safeEnemySlot.appendChild(chosen);
      chosen.classList.add('drop-anim');

      setTimeout(() => {
        chosen.classList.remove('drop-anim');
        chosen.classList.add('flip-anim');

        setTimeout(() => {
          const front = chosen.dataset.front;
          if (front) {
            chosen.src = front; // 앞면으로 뒤집기
          }
          chosen.classList.remove('flip-anim');

          // 3️⃣ flip 끝나고 1000ms 후 빛, 1000ms 후 결과
          setTimeout(() => {
            showResultFlash(comm);
            setTimeout(() => {
              checkWinner().then(resolve);
            }, 2000);
          }, 1000);
        }, 300); // flip duration
      }, flipDelayMs);
    }, delayMs);
  });
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
}

async function showResultImage(result) {
  const comm = document.querySelector('.community');
  let imgSrc = '';
  switch (result) {
    case 'playerWin': imgSrc = './image/ui/win.png'; break;
    case 'enemyWin': imgSrc = './image/ui/lose.png'; break;
    case 'draw':     imgSrc = './image/ui/draw.png'; break;
    default: return;
  }
  const img = document.createElement('img');
  img.src = imgSrc;
  img.className = 'result-image';
  comm.appendChild(img);

  img.classList.add('show');
  await new Promise(r => setTimeout(r, 1500));
  img.classList.add('hide');
  setTimeout(() => img.remove(), 800);
}

async function resolveRound(result) {
  const comm = document.querySelector('.community');
  const playerCard = getCommunityPlayerCard();
  const enemyCard = getCommunityEnemyCard();
  if (!playerCard || !enemyCard) return;

  // 공통 연출: 살짝 확대 후 이동 시작
  [playerCard, enemyCard].forEach(c => c.style.transition = 'all 0.5s ease');

  // 구디 승리: 두 카드 모두 플레이어 손으로
  if (result === 'playerWin') {
    const gHand = document.querySelector('#gHand');
    [playerCard, enemyCard].forEach(c => {
      c.dataset.owner = 'player';
      c.classList.remove('enemy', 'neutral');
      c.classList.add('player');
      gHand.appendChild(c);
    });
  }

  // 배디 승리: 두 카드 모두 rev 상태로 뒤집어 복귀
  else if (result === 'enemyWin') {
    const bHand = document.querySelector('#bHand');
    [playerCard, enemyCard].forEach(c => {
      const origin = c.dataset.origin;

      const revImg = origin === 'goodee'
        ? './image/cards/card_goodee_rev.png'
        : './image/cards/card_badee_rev.png';

      c.src = revImg;                 // 카드 이미지를 뒷면으로
      c.dataset.owner = 'enemy';
      c.classList.remove('player', 'neutral');
      c.classList.add('enemy');

      c.style.animation = 'flyToEnemy 1s ease forwards';

      setTimeout(() => {
        bHand.appendChild(c);
        c.style.animation = '';
      }, 1000);
    });
  }

  // 무승부: 두 카드 neutral화 후 'grave'로 이동 (템플릿 리터럴/오타 수정)
  else if (result === 'draw') {
    const grave = prepareGraveArea();
    const neutralImg = './image/cards/card_neutral.png';

    [playerCard, enemyCard].forEach((c, index) => {
      c.src = neutralImg;
      c.classList.remove('player', 'enemy');
      c.classList.add('neutral');

      c.style.position = 'absolute';
      c.style.transition = 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)';
      c.style.zIndex = 5 + index;
      c.style.top = `${Math.random() * 40 + 10}%`;
      c.style.left = `${Math.random() * 40 + 10}%`;

      const randomAngle = Math.random() * 20 - 10;
      const offsetY = Math.random() * 40 + 5;

      setTimeout(() => {
        c.style.transform = `translate(-400px, ${offsetY - 50}px) rotate(${randomAngle}deg)`;
      }, 50 * index);

      setTimeout(() => {
        c.style.transition = 'transform 0.3s ease-out';
        const jitter = randomAngle + (Math.random() * 4 - 2);
        c.style.transform = `translate(-400px, ${offsetY - 50}px) rotate(${jitter}deg)`;
      }, 800 + 50 * index);

      setTimeout(() => {
        grave.appendChild(c);
        c.style.transition = '';
        c.style.transform = `rotate(${randomAngle}deg)`;
      }, 1100 + 50 * index);
    });
  }

  await new Promise(r => setTimeout(r, 500));
  await resetRound();
}

async function resetRound() {
  const comm = document.querySelector('.community');
  comm.innerHTML = '';

  const gHand = document.querySelector('#gHand');
  gHand.style.pointerEvents = 'auto';  // 드래그 재활성화

  await updateGoVisibility();
  ensureGoButton();
  checkGameOver();
}

function checkGameOver() {  // 남은 패의 갯수 확인
  const playerCards = document.querySelectorAll('#gHand img').length;
  const enemyCards = document.querySelectorAll('#bHand img').length;

  if (playerCards === 0 && enemyCards === 0) showFinalResult('noWin');
  else if (playerCards === 0) showFinalResult('goodeeWin');
  else if (enemyCards === 0) showFinalResult('badeeWin');
}

async function showFinalResult(result) { // 게임 종료 화면
  const fullscreen = document.querySelector('.fullscreen');

  // 라운드용 GO 버튼, 카드 상호작용 비활성화
  const goBtn = document.getElementById('goBtn');
  if (goBtn) goBtn.disabled = true;

  document.querySelectorAll('img.pic').forEach(img => {
    img.draggable = false;
    img.style.pointerEvents = 'none';
  });

  // 결과 이미지 선택
  let imgSrc = '';
  switch (result) {
    case 'goodeeWin': imgSrc = './image/ui/final_win.png';  break;
    case 'badeeWin': imgSrc = './image/ui/final_lose.png'; break;
    case 'noWin':    imgSrc = './image/ui/final_draw.png'; break;
    default: return;
  }

  // 최종 결과 오버레이
  const overlay = document.createElement('div');
  overlay.className = 'final-overlay';
  overlay.innerHTML = `
    <img src="${imgSrc}" class="final-image">
    <div class="final-text">${
      (result === 'goodeeWin') ? 'YOU WIN!' :
      (result === 'badeeWin') ? 'YOU LOSE' : 'DRAW'
    }</div>
    <button class="restart-btn">RESTART</button>
  `;
  fullscreen.appendChild(overlay);

  // 페이드 인
  await new Promise(r => setTimeout(r, 100));
  overlay.classList.add('show');

  const restartBtn = overlay.querySelector('.restart-btn');
  restartBtn.addEventListener('click', () => {
    overlay.classList.add('fadeout');
    setTimeout(() => {
      overlay.remove();
      restartGame();
    }, 1500);
  });
}

function restartGame() { // 게임 재시작
  document.querySelectorAll('#gHand, #bHand, .community').forEach(el => el.innerHTML = '');
  const grave = document.querySelector('.grave');
  if (grave) grave.remove();
  init(); // 다시 init
}

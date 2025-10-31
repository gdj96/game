/************************************************************
 * 원카드 가위바위보 - 배디(컴퓨터) 선택 로직 올인원 파일
 * - 단기(즉시결과) + 장기(V) 하이브리드
 * - 예측 패널(#playerPrediction): 라운드 중 예측, 결과 시 자동 대사 교체
 * - 배디 해설 로그(콘솔)
 ************************************************************/

/* ===================== 설정 ===================== */
const DEBUG_AI = true; // 콘솔 디버그 on/off

// 플레이어(구디) 예측 전략 모드:
//  - 'LOSE_FIRST' : 항상 LOSE를 최우선, 없으면 DRAW
//  - 'DRAW_FIRST' : 항상 DRAW를 최우선, 없으면 LOSE
//  - 'AUTO'       : 현재 패 수(totP vs totE)에 따라 LOSE/DRAW를 자동 선택(이전 로직)
const PLAYER_PREDICT_STRATEGY = 'LOSE_FIRST';

/* ===================== 공용 유틸 ===================== */
const clamp  = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const sum3   = o => (o.S|0) + (o.R|0) + (o.P|0);

const toKey   = t => (t==='rock'?'R': t==='paper'?'P':'S');
const fromKey = k => (k==='R'?'rock': k==='P'?'paper':'scissors');

function beats(a,b){ return (a==='R'&&b==='S') || (a==='S'&&b==='P') || (a==='P'&&b==='R'); }

const labelKR = k => (k==='S' ? '가위' : k==='R' ? '바위' : '보');
const pct     = x => Math.round((x||0)*100);

// 예측 패널 덮어쓰기 금지 락 (결과 대사 표시 중 true)
window._panelLocked = window._panelLocked || false;

/* ===================== DOM 카운트 ===================== */
function getEnemyCountsFromDOM(){
  const nodes = Array.from(document.querySelectorAll('#bHand img.pic'));
  return {
    R: nodes.filter(c=>c.dataset.type==='rock').length,
    P: nodes.filter(c=>c.dataset.type==='paper').length,
    S: nodes.filter(c=>c.dataset.type==='scissors').length,
  };
}
function getPlayerCountsFromDOM(){
  const nodes = Array.from(document.querySelectorAll('#gHand img.pic'));
  return {
    R: nodes.filter(c=>c.dataset.type==='rock').length,
    P: nodes.filter(c=>c.dataset.type==='paper').length,
    S: nodes.filter(c=>c.dataset.type==='scissors').length,
  };
}

/* ===================== 상태 전이(nextState) ===================== */
function nextState(enemy, player, a, b){
  const e = {...enemy}, p = {...player};
  if(a===b){
    e[a] = Math.max(0, (e[a]|0)-1);
    p[b] = Math.max(0, (p[b]|0)-1);
  }else if(beats(a,b)){
    e[b] = (e[b]|0)+1;
    p[b] = Math.max(0, (p[b]|0)-1);
  }else{
    e[a] = Math.max(0, (e[a]|0)-1);
    p[a] = (p[a]|0)+1;
  }
  return [e,p];
}

/* ===================== V(state) 메모 & 휴리스틱 ===================== */
window._vmemo = window._vmemo || new Map();
const _vmemo = window._vmemo;

function keyOf(e,p){
  const eS=e.S|0,eR=e.R|0,eP=e.P|0; const pS=p.S|0,pR=p.R|0,pP=p.P|0;
  return `e${eS},${eR},${eP}|p${pS},${pR},${pP}`;
}

const MAX_DEPTH = 200;
function heuristic(enemy, player){
  const eS=enemy.S|0,eR=enemy.R|0,eP=enemy.P|0;
  const pS=player.S|0,pR=player.R|0,pP=player.P|0;
  const totE=eS+eR+eP, totP=pS+pR+pP;
  if(totE===0) return 1; // ENEMY 승
  if(totP===0) return 0; // ENEMY 패
  const winEdge = (eR*pS)+(eS*pP)+(eP*pR);
  const loseEdge= (eS*pR)+(eP*pS)+(eR*pP);
  const norm=(totE*totP)||1;
  return clamp(0.5 + 0.25*(winEdge-loseEdge)/norm, 0, 1);
}
function V(enemy, player, depth=0){
  const ke = keyOf(enemy, player);
  if(_vmemo.has(ke)) return _vmemo.get(ke);

  if(sum3(enemy)===0){ _vmemo.set(ke,1); return 1; } // ENEMY 승
  if(sum3(player)===0){ _vmemo.set(ke,0); return 0; } // ENEMY 패

  if(depth>=MAX_DEPTH){
    const h=heuristic(enemy, player);
    _vmemo.set(ke,h); return h;
  }

  const totP=sum3(player);
  const q={ S:(player.S||0)/totP, R:(player.R||0)/totP, P:(player.P||0)/totP };

  const candidates=['S','R','P'].filter(c => (enemy[c]||0)>0);
  let best=0;
  for(const a of candidates){
    let acc=0;
    for(const b of ['S','R','P']){
      if((player[b]||0)===0) continue;
      const [e2,p2]=nextState(enemy, player, a, b);
      acc += (q[b]||0)*V(e2,p2,depth+1);
    }
    if(acc>best) best=acc;
  }
  _vmemo.set(ke,best);
  return best;
}

/* ===================== 플레이어 단기전략 q(b) 추정 ===================== */
function _decidePlayerMode(enemyCounts, playerCounts){
  if (PLAYER_PREDICT_STRATEGY === 'LOSE_FIRST') return 'LOSE->DRAW';
  if (PLAYER_PREDICT_STRATEGY === 'DRAW_FIRST') return 'DRAW->LOSE';
  // AUTO
  const totE=sum3(enemyCounts), totP=sum3(playerCounts);
  return (totP>totE)?'LOSE' : (totP===totE)?'LOSE->DRAW' : 'DRAW->LOSE';
}

/**
 * 구디가 이번 턴 낼 확률 분포 q(b)를 추정
 * - 전략 모드에 따라 LOSE/DRAW 우선 순위를 강제할 수 있음
 * - r(a)는 ENEMY(배디) 분포(우리가 가진 카드 비율)
 */
function estimatePlayerQ_Greedy(enemyCounts, playerCounts, {stochastic=true, epsilon=0.01, power=1.0}={}){
  const totE=sum3(enemyCounts), totP=sum3(playerCounts);
  const denR=Math.max(1, totE);
  const r={ S:(enemyCounts.S||0)/denR, R:(enemyCounts.R||0)/denR, P:(enemyCounts.P||0)/denR };

  const candidates=['S','R','P'].filter(b => (playerCounts[b]||0)>0);
  if(candidates.length===0) return { q:{S:0,R:0,P:0}, mode:'NONE', chosen:null };

  const pDraw=b=>r[b];
  const pLose=b=>(b==='R'? r.P : b==='S'? r.R : r.S);

  const mode = _decidePlayerMode(enemyCounts, playerCounts);

  const target={S:0,R:0,P:0};
  if(mode==='LOSE' || mode==='LOSE->DRAW'){
    for(const b of candidates) target[b]=pLose(b);
    if(mode==='LOSE->DRAW' && candidates.every(b=>target[b]===0)){
      for(const b of candidates) target[b]=pDraw(b);
    }
  }else{ // DRAW->LOSE
    for(const b of candidates) target[b]=pDraw(b);
    if(candidates.every(b=>target[b]===0)){
      for(const b of candidates) target[b]=pLose(b);
    }
  }

  if(!stochastic){
    let bestB=candidates[0], bestV=target[bestB]??0;
    for(const b of candidates) if((target[b]??0)>bestV){ bestV=target[b]; bestB=b; }
    const q={S:0,R:0,P:0}; q[bestB]=1;
    return { q, mode, chosen:bestB };
  }

  const raw={S:0,R:0,P:0}; let sum=0;
  for(const b of candidates){
    const v=Math.pow((epsilon+(target[b]||0)), power);
    raw[b]=v; sum+=v;
  }
  const q={S:0,R:0,P:0};
  if(sum>0){ q.S=(raw.S||0)/sum; q.R=(raw.R||0)/sum; q.P=(raw.P||0)/sum; }
  return { q, mode, chosen:null };
}

/* ===================== λ(장기 가중치) 자동결정 ===================== */
function computeLambda(enemyCounts, playerCounts){
  const totE=sum3(enemyCounts), totP=sum3(playerCounts);
  const tot=totE+totP, gap=Math.abs(totE-totP);
  let lambda;
  if(tot<=5)        lambda=0.55;  // 막판: 장기 ↑
  else if(tot<=10)  lambda=0.30;  // 중반
  else              lambda=0.15;  // 초반: 단기 ↑
  if(gap<=1) lambda+=0.10;        // 박빙이면 장기 더 보기
  if(gap>=4) lambda-=0.05;        // 격차 크면 단기 더 보기
  return clamp(lambda, 0, 0.7);
}

/* ===================== 예측/대사 패널 ===================== */
function preparePlayerPredictionPanel(){
  const parent=document.querySelector('.communityTable')||document.body;
  let box=document.getElementById('playerPrediction');
  if(!box){
    box=document.createElement('div');
    box.id='playerPrediction';
    
    parent.appendChild(box);
  }
}

function updatePlayerPredictionPanel(enemyCounts, playerCounts){
  if (window._panelLocked) return; // 결과 대사 중엔 예측 갱신 금지
  preparePlayerPredictionPanel();
  const { q } = estimatePlayerQ_Greedy(enemyCounts, playerCounts, {stochastic:true});
  // 최댓값만 표기 (동률이면 S>R>P)
  let bestB='S', bestV=q.S||0;
  if((q.R||0)>bestV){ bestB='R'; bestV=q.R; }
  if((q.P||0)>bestV){ bestB='P'; bestV=q.P; }
  const box = document.getElementById('playerPrediction');
  box.textContent = `구디가 ${labelKR(bestB)}를 낼 확률은 ${pct(bestV)}퍼센트...!`;
}

/* ===================== 결과 대사 선택 + 자동 렌더 ===================== */
/**
 * 어떤 결과 문자열이 오든(플레이어/배디/별칭) 배디 관점으로 통일하여 대사를 고른다.
 *
 * 지원 별칭(대소문자 무시):
 *  - 플레이어 기준: "win"|"playerwin"|"goodeewin"  → ENEMY LOSE
 *                  "lose"|"playerlose"|"goodeelose" → ENEMY WIN
 *  - 배디 기준:     "badeewin"|"enemywin"           → ENEMY WIN
 *                  "badeelose"|"enemylose"          → ENEMY LOSE
 *  - 공통:          "draw"
 */
function getBaddyQuipByResult(resultStr){
  const meta = window._enemyTurnMeta || null;

  // 1) 결과 문자열 → ENEMY 관점 outcome으로 통일
  const r = String(resultStr || '').toLowerCase().trim();

  const PLAYER_WIN  = /^(win|playerwin|goodeewin)$/.test(r);
  const PLAYER_LOSE = /^(lose|playerlose|goodeelose)$/.test(r);
  const ENEMY_WIN_A  = /^(badeewin|enemywin)$/.test(r);
  const ENEMY_LOSE_A = /^(badeelose|enemylose)$/.test(r);

  let outcome; // 'WIN' | 'LOSE' | 'DRAW' (모두 ENEMY 관점)
  if (r === 'draw') {
    outcome = 'DRAW';
  } else if (PLAYER_WIN || ENEMY_LOSE_A) {
    outcome = 'LOSE'; // 플레이어가 이김 → 배디 LOSE
  } else if (PLAYER_LOSE || ENEMY_WIN_A) {
    outcome = 'WIN';  // 플레이어가 짐 → 배디 WIN (이 규칙에선 최악)
  } else {
    outcome = 'DRAW'; // 알 수 없으면 안전하게 draw 취급
  }

  // 2) 대사 선택 — WIN(최악)은 언제나 최우선
  let line = '나쁘지 않아';
  if (meta){
    if (outcome === 'WIN'){
      line = '흐음.. 이건 변수인데?';
    } else {
      const intended = (meta.intendedPrimary || '').toUpperCase(); // 'DRAW' | 'LOSE'
      const success  = (outcome === intended);
      if (success && meta.bucket === 'y') line = '역심리가 통했군!';
      else if (success)                   line = '큭큭, 그럴 줄 알았지!';
      else                                line = '나쁘지 않아';
    }
  }

  // 3) 자동 렌더: 예측 패널 문구를 대사로 교체 + 락
  try{
    preparePlayerPredictionPanel();
    const box = document.getElementById('playerPrediction');
    window._panelLocked = true;
    box.textContent = line;
  }catch(e){ /* 패널 없으면 무시 */ }

  if (DEBUG_AI){
    console.log('[BADDY QUIP]', { resultStr, outcome, intended: meta?.intendedPrimary, bucket: meta?.bucket, line });
  }
  return line;
}

/* ===================== 하이브리드 선택(핵심) ===================== */
function chooseEnemyTypeByPolicyHybrid(enemyCounts, playerCounts){
  const totE=sum3(enemyCounts), totP=sum3(playerCounts);

  // 정책 모드
  const mode = (totE>totP)?'LOSE' : (totE===totP)?'LOSE->DRAW' : 'DRAW->LOSE';
  const intendedPrimary = (mode==='DRAW->LOSE')?'draw':'lose'; // 로그용 소문자

  // 구디(b) 예측 분포 q(b): 단기전략 가정
  const { q } = estimatePlayerQ_Greedy(enemyCounts, playerCounts, {stochastic:true, epsilon:0.01, power:1.0});

  // 즉시 점수(단기)
  const pDraw=a=>q[a];
  const pLose=a=>(a==='R'? q.P : a==='S'? q.R : q.S);

  const candidates=['S','R','P'].filter(c=>(enemyCounts[c]||0)>0);
  if(candidates.length===0) return null;
  if(candidates.length===1){
    window._enemyTurnMeta = { mode, intendedPrimary, bucket:'x', chosen:candidates[0] };
    return candidates[0];
  }

  const immediate={};
  if(mode==='LOSE' || mode==='LOSE->DRAW'){
    for(const a of candidates) immediate[a]=pLose(a);
    if(mode==='LOSE->DRAW' && candidates.every(a=>immediate[a]===0)){
      for(const a of candidates) immediate[a]=pDraw(a);
    }
  }else{
    for(const a of candidates) immediate[a]=pDraw(a);
    if(candidates.every(a=>immediate[a]===0)){
      for(const a of candidates) immediate[a]=pLose(a);
    }
  }

  // 장기 점수 E[a] = Σ_b q(b) · V(nextState(a,b))
  let acc, e2,p2;
  const longterm={};
  for(const a of candidates){
    acc=0;
    for(const b of ['S','R','P']){
      if((playerCounts[b]||0)===0) continue;
      [e2,p2]=nextState(enemyCounts, playerCounts, a, b);
      acc += (q[b]||0)*V(e2,p2);
    }
    longterm[a]=acc;
  }

  // λ로 블렌딩
  const lambda = computeLambda(enemyCounts, playerCounts);
  const target={};
  for(const a of candidates) target[a]=(1-lambda)*(immediate[a]||0) + lambda*(longterm[a]||0);

  // 점수화 → x/y/m + 난수
  const score={};
  for(const a of candidates) score[a]=clamp(Math.round(target[a]*10),1,10);

  const order=[...candidates].sort((c1,c2)=>{
    if(score[c2]!==score[c1]) return score[c2]-score[c1];
    if((enemyCounts[c2]||0)!==(enemyCounts[c1]||0)) return (enemyCounts[c2]||0)-(enemyCounts[c1]||0);
    return c1.localeCompare(c2);
  });
  const x=order[0], y=order[order.length-1];
  const middle = order.find(c=>c!==x && c!==y) || null;

  const sx=score[x], sy=score[y];
  const xRange=[1, Math.min(10,sx)];
  const yRange=[xRange[1]+1, Math.min(10, sx+sy)];
  const hasMiddle=!!middle && yRange[1]<10;

  const r=randInt(1,10);
  const bucket = (r<=xRange[1])?'x' : (r<=yRange[1])?'y' : (hasMiddle?'m':'x');
  const chosen = (bucket==='x')?x : (bucket==='y')?y : (hasMiddle?middle:x);

  // resolveRound용 메타 저장
  window._enemyTurnMeta = { mode, intendedPrimary, bucket, chosen };

  if(DEBUG_AI){
    const strategyType = (lambda>=0.4)?'장기' : (lambda<=0.2)?'단기' : '혼합';

    let bestB='S', bestProb=q.S||0;
    if((q.R||0)>bestProb){ bestB='R'; bestProb=q.R; }
    if((q.P||0)>bestProb){ bestB='P'; bestProb=q.P; }

    const norm=(score[x]+score[y])||1;
    const pNormX=((score[x]/norm)*100).toFixed(1);
    const pNormY=((score[y]/norm)*100).toFixed(1);
    const finalBucket=(bucket==='x')?'정배' : (bucket==='y')?'역배' : '중도';

    console.log(
    `배디가 "${strategyType}" 전략을 택했습니다.\n` +
    `배디는 구디가 "${labelKR(bestB)}"를 ${(bestProb*100).toFixed(1)}퍼센트 확률로 낼 것이라 생각하여 ` +
    `"${intendedPrimary}"를 의도하고 내밀 카드를 고민 중입니다.\n` +
    `최후의 순간 배디는 "${finalBucket}" 를 골랐습니다. (정배 ${pNormX}퍼센트/역배 ${pNormY}퍼센트)`
  );
  }

  return chosen;
}

/* ===================== 최종: DOM에서 인덱스 선택 ===================== */
function chooseEnemyIndexByDOM(){
  window._panelLocked = false; // 새로운 턴 시작: 예측 갱신 허용
  _vmemo.clear();              // 라운드마다 V캐시 초기화(선택사항)

  const enemyCards = Array.from(document.querySelectorAll('#bHand img.pic'));
  if(enemyCards.length===0) return 0;

  const enemy = getEnemyCountsFromDOM();
  const player = getPlayerCountsFromDOM();

  updatePlayerPredictionPanel(enemy, player); // 라운드 중: 예측 문구

  const chosenTypeKey = chooseEnemyTypeByPolicyHybrid(enemy, player);
  if(!chosenTypeKey) return 0;

  const targetType = fromKey(chosenTypeKey);
  const indices = enemyCards
    .map((el,i)=>[el,i])
    .filter(([el])=>el.dataset.type===targetType)
    .map(([,i])=>i);

  if(indices.length===0) return 0;
  return randInt(0, indices.length-1);
}

/* ===================== resolveRound 연동 안내 ===================== */
/**
 * 승패 확정 시 어디서든:
 *   // 플레이어 기준 'win'|'lose'|'draw' 여도 OK!
 *   const line = getBaddyQuipByResult(resultString);
 * 이 함수가 자동으로 #playerPrediction 문구를 결과 대사로 교체합니다.
 */

        function getCommunityPlayerCard() {
            return document.querySelector('.community img[data-owner="player"]');
        }
        function getCommunityEnemyCard() {
            return document.querySelector('.community img[data-owner="enemy"]');
        }
        function getCardType(cardEl) {
            if (!cardEl) return null;
            const classes = [...cardEl.classList];
            if (classes.includes('rock')) return 'rock';
            if (classes.includes('paper')) return 'paper';
            if (classes.includes('scissors')) return 'scissors';
            return null;
        }
        function showResultFlash(comm) {
            const flash = document.createElement('div');
            flash.className = 'result-flash';
            comm.appendChild(flash);
            setTimeout(()=>flash.remove(), 800);
        }
        function updateGoVisibility() {
            const btn = document.getElementById('goBtn');
            if (!btn) return;
            const hasOne = !!getCommunityPlayerCard();
            if (hasOne) {
                btn.style.display = 'inline-block';
                btn.style.pointerEvents = 'auto';
            } else {
                btn.style.display = 'none';
                btn.style.pointerEvents = 'none';
            }
        }
        function getWinner(p, e){
            if (p === e) return 'draw';
            if(
                (p ==='rock' && e ==='scissors')||
                (p ==='paper' && e ==='rock')||
                (p ==='scissors' && e ==='paper')
            ) return 'playerWin';
            else return 'enemyWin';
        }
        function shake(el){
            if(!el) return;
            el.animate(
                [
                    {transform: 'translateX(0)'},
                    {transform: 'translateX(-6px)'},
                    {transform: 'translateX(6px)'},
                    {transform: 'translateX(0)'},
                ],
                {duration:250, easing: 'ease-out'}
            );
        }
        function prepareEnemyCounter(){
            const panel =document.querySelector('.communityTable')
            let counter = document.createElement('div');
            counter.id = 'enemyCount';
            counter.className = 'enemy-count';
            panel.appendChild(counter);
            updateEnemyCount()
        }
        function updateEnemyCount(){
            const enemyCards = Array.from(document.querySelectorAll('#bHand img.pic'))
            const rCount = enemyCards.filter(c => c.dataset.type === 'rock').length;
            const pCount = enemyCards.filter(c => c.dataset.type === 'paper').length;
            const sCount = enemyCards.filter(c => c.dataset.type === 'scissors').length;
            
            const display = document.getElementById('enemyCount');
            if (display) {
                display.textContent = `R: ${rCount} P: ${pCount} S: ${sCount}`
            }
        }
        function preparePlayerCounter(){
            const panel =document.querySelector('.communityTable')
            let counter = document.createElement('div');
            counter.id = 'playerCount';
            counter.className = 'player-count';
            panel.appendChild(counter);
            updatePlayerCount()
        }

        function updatePlayerCount(){
            const playerCards = Array.from(document.querySelectorAll("#gHand img.pic"))
            const rCount = playerCards.filter(c => c.dataset.type === 'rock').length;
            const pCount = playerCards.filter(c => c.dataset.type === 'paper').length;
            const sCount = playerCards.filter(c => c.dataset.type === 'scissors').length;
            
            const display = document.getElementById('playerCount');
            if (display) {
                display.textContent = `R: ${rCount} P: ${pCount} S: ${sCount}`
            }
        }
        function flyToGrave(card, grave){
            const first = card.getBoundingClientRect();
            const graveRect = grave.getBoundingClientRect();
            const margin = 0.15;
            const gx = graveRect.left + graveRect.width *(margin + Math.random()*(1-margin*2));
            const gy = graveRect.top + graveRect.height *(margin + Math.random()*(1-margin*2));
            const angle = Math.random() * 20 -10;
            const cardW = first.width;
            const cardH = first.height;

            grave.appendChild(card);
                card.style.position = 'absolute';
                card.style.left = `${gx - graveRect.left -cardW / 2}px`;
                card.style.top = `${gy - graveRect.top - cardH/2}px`;
                card.style.transform = `rotate(${angle}deg)`;
                card.style.willChange = 'transform';

                const last = card.getBoundingClientRect();
                const dx = first.left + first.width/2 - (last.left + last.width/2);
                const dy = first.top + first.height/2 - (last.top + last.height/2);

                card.style.transition = 'none';
                card.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${angle}deg)`;

                requestAnimationFrame(()=> {
                    card.style.transition = 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)';
                    card.style.transform = `translate3d(0,0,0)rotate(${angle}deg)`;
                });
                card.addEventListener('transitionend',()=>{
                    card.style.transition = 'transform 0.28s ease-out';
                    const jitter = Math.random() * 4-2;
                    card.style.transform = `translate3d(0,0,0) rotate(${angle + jitter}deg)`;
                    card.addEventListener('transitionend',()=>{
                        card.style.transition = '';
                        card.style.willChange = '';
                        card.style.transform = `rotate${angle + jitter}deg`;
                    },{once: true});
                },{once:true});
            }

        //         c.style.transition = 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)';
        //         c.style.zIndex = 5 +index;
        //         c.style.transform = `rotate(${Math.random()*20-10}deg)`;
        //         c.style.top = `${Math.random()*40+10}%`;
        //         c.style.left = `${Math.random()*40+10}%`;

        //         const randomAngle = Math.random() *20-10;
        //         const offsetX=Math.random()*40+5;
        //         const offsetY=Math.random()*40+5;
        //         const startX=0;
        //         const startY=0;
        //         setTimeout(()=>{
        //             c.style.transform = `translate(-400px,${offsetY - 50}px) rotate(${randomAngle}deg)`;
        //         }, 50 * index);

        //         setTimeout(()=> {
        //             c.style.transition = 'transform 0.3s ease-out';
        //             c.style.transform = `translate(-400px,${offsetY - 50}px) rotate(${randomAngle + (Math.random()*4-2)}deg)`;
        //         }, 800 + 50 * index);

        //         setTimeout(()=>{
        //             grave.appendChild(c);
        //             c.style.transition='';
        //             c.style.transform = `rotate(${randomAngle}deg)`;
        //         }, 1100 + 50 * index);
        // }
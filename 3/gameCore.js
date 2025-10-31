        function charaPrepare(){    //구디배디 생성
            const panels = document.querySelectorAll(".charaPanel");
            panels.forEach(panel =>{
                const classes = [...panel.classList].filter(c => c !== "charaPanel");
                const charaName = classes[0];
                const charaImg = `<div><img src="./image/chara/${charaName}.png"></div>`
                panel.innerHTML = charaImg;
            });
        }
        function cardPrepare(){     //카드 18장 생성
            card =  ["r.png","p.png","s.png","rev.png"]
            const frontPath = (owner, type)=>{
                const idx =(type === 'rock')?0:(type==="paper")?1:2;
                return `./image/cards/card_${owner}_${card[idx]}`;
            }
            let cardImage1 = ""
            for(i=0;i<9;i++){
                const type = (i <3)? 'rock' : (i<6?'paper':'scissors');
                const front = frontPath('goodee', type);
                cardImage1+=`
                    <div>
                        <img class='player pic ${type}' 
                        id='pic${i}' 
                        data-owner="player"
                        data-type="${type}"
                        data-front="${front}"
                        data-origin="goodee"
                        src="${front}">
                    </div>`
            }
            document.querySelector("#gHand").innerHTML = cardImage1;
            let cardImage2 = ""
            for(i=9;i<18;i++){
                const type = (i<12) ? 'rock' : (i<15 ? 'paper' : 'scissors');
                const front = frontPath('badee',type);
                cardImage2 +=`
                    <div>
                        <img class="enemy pic ${type}" 
                            id="pic${i}"
                            data-owner="enemy"
                            data-type="${type}"
                            data-front="${front}"
                            data-origin="badee"
                            src="${front}">
                    </div>`;
            }
            document.querySelector("#bHand").innerHTML = cardImage2;
            document.querySelectorAll("#bHand img.enemy").forEach(e=>{
                e.setAttribute("src",'./image/cards/card_badee_rev.png');
            });
            updateEnemyCount();
            updatePlayerCount();
        }
        function prepareGraveArea() {   //묘지 생성
            let grave = document.querySelector('.grave');
            if (!grave) {
                const commTable = document.querySelector('.communityTable');
                grave = document.createElement('div');
                grave.className = 'grave';
                grave.style.flex = '0 0 20%';
                grave.style.position = 'absolute';
                grave.style.top = '100px';
                grave.style.left = '2%';
                grave.style.width = '30%';
                grave.style.height = '80%';
                grave.style.display = 'flex';
                grave.style.flexDirection = 'column';
                grave.style.alignItems = 'center';
                grave.style.justifyContent = 'flex-start';
                grave.style.zIndex = '2'
                grave.style.pointerEvents = 'none';
                grave.style.overflow = 'visible';
                commTable.appendChild(grave);

                const community = commTable.querySelector('.community');
                commTable.insertBefore(grave, community);
            }
            return grave;
        }
        function ensureGoButton(){      //go버튼 생성
            const comm = document.querySelector('.community'); //community 영역 선택
            let btn = comm.querySelector('.go-btn');    //community 안에 이미 버튼이 있는지 확인
            if (!btn) {                             //없으면 새로 생성
                btn=document.createElement('img');   //버튼 요소 생성
                btn.className = 'go-btn';       //css용 class 부여
                btn.id = 'goBtn';               //id 부여
                btn.src = './image/ui/button0.png';
                btn.draggable = false;
                btn.style.display = 'none';
                btn.style.pointerEvents = 'none';
                comm.appendChild(btn)           //완성된 버튼을 community 영역의 자식으로 추가
            }
            btn.addEventListener('mouseenter',()=> {
                btn.src = './image/ui/button1.png';
            });
            btn.addEventListener('mouseleave',()=> {
                btn.src = './image/ui/button0.png';
            });
            btn.addEventListener('mousedown',()=> {
                btn.src = './image/ui/button2.png';
            });
            btn.addEventListener('mouseup',()=> {
                btn.src = './image/ui/button1.png';
            });
            btn.addEventListener('click', onGoClick);   //클릭시 이벤트 처리
        }

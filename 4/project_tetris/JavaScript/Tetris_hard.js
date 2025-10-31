document.addEventListener("DOMContentLoaded", () => {   // DomContentLoaded html이 완전히 로드된 뒤 실행
    const MainContainer = document.querySelector(".MainContainerIn");   // html 요소들을 찾을 수 있게함
    const NextBlockContainer = document.querySelector(".nextBlockContainer");
    const ServeContainerScore = document.querySelector(".ServeContainerScore");
    const row = 23;   // 세로칸
    const col = 17;   // 가로칸
    const cellSize = 25; // 각 칸 크기(px)
    let nowBlock;
    let nextBlock;
    let score = 0;  // 점수 
    let dropSpeed = 500;
    let gameInterval = setInterval(MovingBlock, dropSpeed);   // 낙하속도


    // 2차원 배열 Array.form은 배열을 만드는 함수, length : row => 길이가 row인 배열을 만들어라
    // () => Array(col).fill(0));은 콜백함수 
    const board = Array.from({ length: row }, () => Array(col).fill(0));

    // 화면(격자무늬) 그리는 함수
    function DrawBoard() {
        MainContainer.innerHTML = "";
        for (let r = 0; r < row; r++) {
            for (let c = 0; c < col; c++) {
                const cell = document.createElement("div"); // <div></div>생성
                cell.style.width = `${cellSize}px`;
                cell.style.height = `${cellSize}px`;
                cell.style.border = "1px solid #333";
                cell.style.boxSizing = "border-box";    // 테두리도 칸 크기에 포함하도록
                // 칸 색깔 정하기 ===0이 참이면 #292828 불이면 board[r][c]색 사용
                cell.style.backgroundColor = board[r][c] === 0 ? "#292828" : board[r][c];   
                cell.style.float = "left";  // 왼쪽으로 이어 붙이게 가로정렬
                MainContainer.appendChild(cell);    // MainContainer에 적용
            }
        }
        MainContainer.style.height = `${row * cellSize}px`; // 칸 높이
        MainContainer.style.width = `${col * cellSize}px`;  // 칸 넓이
        MainContainer.style.position = "relative";          // 상대적인 위치로 지정, 화면크기 고려해 칸위치 고정
    }

    // 블록모양
    const TeTbox = {
        I: [[1, 1, 1, 1]],
        I2: [[1],
        [1],
        [1],
        [1]
        ],
        T: [
            [0, 1, 0],
            [1, 1, 1]
        ],
        O: [
            [1, 1],
            [1, 1]
        ],
        S: [
            [0, 1, 1],
            [1, 1, 0]
        ],
        Z: [
            [1, 1, 0],
            [0, 1, 1]
        ],
        L: [
            [1, 0, 0],
            [1, 1, 1]
        ],
        L2: [
            [0, 0, 1],
            [1, 1, 1]
        ],
        U: [
            [1, 0, 1],
            [1, 1, 1],
        ],
        U2: [
            [1, 0, 1],
            [1, 0, 1],
            [1, 1, 1],
        ],
        E: [
            [1, 1, 1],
            [1, 0, 0],
            [1, 1, 1],
            [1, 0, 0],
            [1, 1, 1],
        ]
    };

    // 블록 색깔
    const COLORS = {
        I: "cyan",
        I2: "blue",
        T: "purple",
        O: "yellow",
        S: "green",
        Z: "red",
        L: "orange",
        L2: "orange",
        U: "pink",
        U2: "pink",
        E: "white"
    };

    // 블록 생성 및 초기 위치
    let currentBlock = {
        shape: TeTbox.I,    //블록 모양 가져오기
        row: 0,             // 생성 초기 위치
        col: Math.floor(col / 2) - 1, // 가운데 정렬
        color: COLORS.I     // 블록 색깔 가져오기
    };

    // 블록을 화면에 표현
    function drawBlock() {
        const { shape, row, col, color } = currentBlock;    // 객체 안에서 필요한 값만 꺼낼수 있게하는 문법
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    board[row + r][col + c] = color;
                }
            }
        }
    }

    // 한줄 완료시 지워지는 기능, 점수 계산
    function ClearBlock() {
        let linesCleared = 0;   // 한번에 지운 라인 수
        for (let r = row - 1; r >= 0; r--) { // 아래줄 부터 체크를 하기위해 보드 아래쪽 row-1 부터 위쪽으로
            if (board[r].every(cell => cell !== 0)) {   // 한줄이 모두 1인가 확인
                board.splice(r, 1); // r 번째 행 제거
                //  맨위 빈줄 추가, 배열 구조상 위쪽에 새로운 요소를 넣음 이미 있는 배열들은 밀리기에 자동으로 블록들은 내려가짐
                board.unshift(Array(col).fill(0)); 
                linesCleared++; // 지운줄 갯수
                r++;    // 안하면 여러줄 지울시 한번에 안지워짐        
            }
        }
        // 점수 계산
        if (linesCleared >= 5) {
            score += 400;
        }
        switch (linesCleared) {
            case 1: score += 50; break;
            case 2: score += 90; break;
            case 3: score += 150; break;
            case 4: score += 250; break;
        }
        ServeContainerScore.textContent = `점수 : ${score}`;
    }

    // 블록 낙하
    function MovingBlock() {
        ICBlockSpeed()  // 낙하속도 변경 호출
        // 기존 위치 지우기
        for (let r = 0; r < currentBlock.shape.length; r++) {
            for (let c = 0; c < currentBlock.shape[r].length; c++) {
                if (currentBlock.shape[r][c]) { // 블록이 있으면
                    board[currentBlock.row + r][currentBlock.col + c] = 0;  // 블록 이동시 이전위치 0으로 초기화
                }
            }
        }
        // 한 칸 아래로
        currentBlock.row++;

        // 충돌 체크
        if (checkCollision()) {
            currentBlock.row--;
            drawBlock();
            ClearBlock();
            SpawnBlock();
        }

        drawBlock();
        DrawBoard();
    }

    // 충돌 검사
    function checkCollision() {
        const { shape, row: br, col: bc } = currentBlock;
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {  // 블록이 있으면
                    const newrow = br + r;
                    const newcol = bc + c;
                    if (
                        newrow >= row ||        //바닥에 닿음
                        newcol < 0 || newcol >= col ||  // 벽에 닿음
                        board[newrow][newcol] !== 0 // 다른 블록에 닿음
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // 새 블록 생성, 게임 오버
    function SpawnBlock() {
        currentBlock.shape = nextBlock.shape;
        currentBlock.color = nextBlock.color;
        currentBlock.row = 0;       // 맨위에서 블록생성
        currentBlock.col = Math.floor(col / 2) - 1; // 가운데에서 블록 생성

        // 블록 랜덤 생성
        const keys = Object.keys(TeTbox);   // Object.keys => 객체의 모든 키를 배열로 반환
        const rand = keys[Math.floor(Math.random() * keys.length)]; // Math.random() 랜덤 선택
        nextBlock = {
            shape: TeTbox[rand],
            color: COLORS[rand]
        };
        ShowNextBlock();
        if (checkCollision()) {
            const restart = confirm(`게임 오버! 내 점수 : ${score} 점 다시 하시겠습니까?`);
            /*
            currentBlock.row = 0; currentBlock.col = Math.floor(col / 2) - 1;일경우 checkCollision()이 참일시에 true가 발생함    
            */
            if (restart) {
                clearInterval(gameInterval);
                window.location.reload();
            } else {
                clearInterval(gameInterval);
                alert("메인화면으로 돌아갑니다.")
                window.location.href = "../html/Main.html";
                return;
            }
        }
    }
    // 게임 시작 시 블록 초기화
    function initBlocks() {
        const keys = Object.keys(TeTbox);
        // 현재 블록
        let rand = keys[Math.floor(Math.random() * keys.length)];
        currentBlock = {
            shape: TeTbox[rand],
            color: COLORS[rand],
            row: 0,
            col: Math.floor(col / 2) - 1
        };
        // 다음 블록
        rand = keys[Math.floor(Math.random() * keys.length)];
        nextBlock = {
            shape: TeTbox[rand],
            color: COLORS[rand]
        };
        ShowNextBlock();

        // 장애물 설정
        for (let n = 0; n <= 3; n++) {
            let obstacleR = Math.floor(Math.random() * (row - 10)) + 10
            let obstacleC = Math.floor(Math.random() * (col))
            board[obstacleR][obstacleC] = "gray";
        }
    }
    // 다음 블록 표시
    function ShowNextBlock() {
        NextBlockContainer.innerHTML = "";
        const size = 20;
        for (let r = 0; r < nextBlock.shape.length; r++) {  // nextBlock.shape을 가져와서 다음 블록이 무엇인지 확인
            for (let c = 0; c < nextBlock.shape[r].length; c++) {
                const cell = document.createElement("div");
                cell.style.width = `${size}px`;
                cell.style.height = `${size}px`;
                cell.style.border = "1px solid #333";
                cell.style.boxSizing = "border-box";
                cell.style.backgroundColor = nextBlock.shape[r][c] ? nextBlock.color : "#292828";
                cell.style.float = "left";
                NextBlockContainer.appendChild(cell);
            }
            const br = document.createElement("div");
            br.style.clear = "both";
            NextBlockContainer.appendChild(br);
        }
    }

    // 블록 좌우 이동
    function ControlBlock(dir) {    // dir = 문서의 텍스트 방향성 왼쪽 or 오른쪽을 나타내는 속성
        for (let r = 0; r < currentBlock.shape.length; r++) {
            for (let c = 0; c < currentBlock.shape[r].length; c++) {
                if (currentBlock.shape[r][c]) {
                    board[currentBlock.row + r][currentBlock.col + c] = 0;
                }
            }
        }
        currentBlock.col += dir;

        // 벽 충돌 검사
        if (checkCollision()) {
            currentBlock.col -= dir;
        }

        drawBlock();
        DrawBoard();
    }

    // 블록 회전
    function rotationBlock() {
        const { shape, row: br, col: bc } = currentBlock;
        const rotated = shape[0].map((_, i) => shape.map(row => row[i]).reverse());

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    board[currentBlock.row + r][currentBlock.col + c] = 0;
                }
            }
        }
        currentBlock.shape = rotated;

        // 충돌시 취소
        if (checkCollision()) {
            currentBlock.shape = shape;
        }
        drawBlock();
        DrawBoard();
    }
    // 블록 조작
    document.addEventListener("keydown", (e) => {
        switch (e.key) {
            case "ArrowLeft": // ←
                ControlBlock(-1);
                break;
            case "ArrowRight": // →
                ControlBlock(1);
                break;
            case "ArrowDown": // ↓
                MovingBlock();
                break;
            case "ArrowUp": // ↑
                rotationBlock();
                break;
        }
    })

    //시간에 따라서 블록이 떨어지는 속도 증가
    function ICBlockSpeed() {
        const second = window.increaseSpeed();
        const min = Math.floor(second / 60);
        if (min >= 2) {
            dropSpeed = 400;
        }
        if (min >= 4) {   //3
            dropSpeed = 300;
        }
        if (min >= 6) {   //6       
            dropSpeed = 200;
        }
        if (min >= 8) {
            10
            dropSpeed = 150;
        }
        if (min >= 10) {
            15
            dropSpeed = 100;
        }
        clearInterval(gameInterval); // 기존 interval 제거
        gameInterval = setInterval(MovingBlock, dropSpeed);

    }


    // 시작 시 초기화
    initBlocks();
    drawBlock();
    DrawBoard();
});

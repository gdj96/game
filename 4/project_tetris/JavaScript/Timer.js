let second = 0; // 시작값

const timerElement = document.getElementById("Timer");

setInterval(() =>{  // 일정 시간마다 반복 실행되는 함수
    second++;
    
    const min = Math.floor(second/60);  //분
    const sec = second % 60;            //초

    const timermin = min < 10 ? "0" + min : min;    // 조건식 참이면 "0" + min입력 아니면 min 출력
    const timersec = sec < 10 ? "0" + sec : sec;    // 조건식 참이면 "0" + sec입력 아니면 sec 출력

    timerElement.textContent = `${timermin}:${timersec}`;
}, 1000);   // 1000 => 1s 마다 실행

// Tetris.js에서 접근 가능하게 전역으로 추출
window.increaseSpeed = () => second;


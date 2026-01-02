let countdownInterval;
let totalSeconds = 0;

const hoursInput = document.getElementById('hours');
const minutesInput = document.getElementById('minutes');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const setupScreen = document.getElementById('setup-screen');
const timerScreen = document.getElementById('timer-screen');
const timerDisplay = document.getElementById('timer-display');
const alarmSound = document.getElementById('alarm-sound');

function updateDisplay() {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const hDisplay = h < 10 ? '0' + h : h;
    const mDisplay = m < 10 ? '0' + m : m;
    const sDisplay = s < 10 ? '0' + s : s;

    if (h > 0) {
        timerDisplay.innerText = `${hDisplay}:${mDisplay}:${sDisplay}`;
    } else {
        timerDisplay.innerText = `${mDisplay}:${sDisplay}`;
    }
}

function startTimer() {
    const hours = parseInt(hoursInput.value) || 0;
    const minutes = parseInt(minutesInput.value) || 0;

    totalSeconds = (hours * 3600) + (minutes * 60);

    if (totalSeconds <= 0) {
        alert("Inserisci almeno un minuto o un'ora!");
        return;
    }

    setupScreen.classList.add('hidden');
    timerScreen.classList.remove('hidden');

    updateDisplay();

    countdownInterval = setInterval(() => {
        totalSeconds--;
        updateDisplay();

        if (totalSeconds <= 0) {
            clearInterval(countdownInterval);
            timerDisplay.innerText = "00:00:00";
            
            alarmSound.play().catch(e => console.log("Audio play failed:", e));
            
            timerDisplay.style.color = "var(--secondary-color)";
            timerDisplay.style.textShadow = "0 0 40px rgba(var(--secondary-rgb), 0.6)";
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(countdownInterval);
    
    alarmSound.pause();
    alarmSound.currentTime = 0;
    
    timerDisplay.style.color = "";
    timerDisplay.style.textShadow = "";

    setupScreen.classList.remove('hidden');
    timerScreen.classList.add('hidden');
}

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
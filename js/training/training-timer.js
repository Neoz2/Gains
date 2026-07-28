//training-timer.js

// =========================================================
// CONSTANTS
// =========================================================

const startBeep = new Audio("sounds/startBeep.mp3");
const middleBeep = new Audio("sounds/middleBeep.mp3");
const endBeep = new Audio("sounds/endBeep.mp3");

const TIMER_STATES = Object.freeze({
    IDLE: "IDLE",
    COUNTDOWN: "COUNTDOWN",
    RUNNING: "RUNNING",
});

// =========================================================
// SETUP
// =========================================================

function createTimerState() {
    return {
        startedAt: null,
        intervalId: null,
        elapsedSeconds: 0
    };
}

function createSetTimerState() {
    return {
        currentState: TIMER_STATES.IDLE,
        countdownStartTime: null,
        setStartTime: null,
        intervalId: null,
        remainingCountdownSeconds: null,
        elapsedSetSeconds: 0,
        lastPlayedCountdownSecond: null
    }
}

// =========================================================
// SET TIMER LOGIC
// =========================================================

function startSetTimer(timer, button, displayElement, formatter, intervalSpeed = 1000, timerHeader) {
    timer.currentState = TIMER_STATES.RUNNING;
    timer.countdownStartTime = null;
    timer.remainingCountdownSeconds = null;
    timer.setStartTime = Date.now();
    timer.elapsedSetSeconds = 0;
    button.textContent = "Stop set";
    button.classList.remove("cancel-state");
    timerHeader.textContent = "Time under load";

    updateSetTimer(timer, displayElement, formatter)

    if (timer.intervalId === null) {
        timer.intervalId = setInterval(function () {
            updateSetTimer(timer, displayElement, formatter);
        }, intervalSpeed);
    } else {
        console.error("A timer is already running");
    }
}

function updateSetTimer(timer, displayElement, formatter) {
    const elapsedMilliseconds = Date.now() - timer.setStartTime;
    const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

    timer.elapsedSetSeconds = elapsedSeconds;

    displayElement.textContent = formatter(timer.elapsedSetSeconds);
}

function stopSetTimer(timer, exercise, card, weightInput) {
    saveWorkoutSet(exercise, timer.elapsedSetSeconds, weightInput.value);

    timer.currentState = TIMER_STATES.IDLE;
    timer.setStartTime = null;
    timer.elapsedSetSeconds = null;
    appState.activeSetTimer = false;

    stopTimerInterval(timer);

    refreshWorkoutInputRow(exercise, card);
}

// =========================================================
// COUNTDOWN TIMER LOGIC
// =========================================================

function startCountdownTimer(timer, button, displayElement, intervalSpeed = 1000, timerHeader) {
    timer.currentState = TIMER_STATES.COUNTDOWN;
    timer.countdownStartTime = Date.now();
    timer.remainingCountdownSeconds = 10;
    appState.activeSetTimer = true;

    button.textContent = "Cancel countdown";
    button.classList.add("cancel-state");
    timerHeader.textContent = "Get ready";

    playAudioFromStart(startBeep);
    timer.lastPlayedCountdownSecond = 10;

    updateCountdownTimer(timer, button, displayElement, timerHeader);

    if (timer.intervalId === null) {
        timer.intervalId = setInterval(function () {
            updateCountdownTimer(timer, button, displayElement, timerHeader);
        }, intervalSpeed);
    } else {
        console.error("A timer is already running");
    }
}

function updateCountdownTimer(timer, button, displayElement, timerHeader) {
    const elapsedMilliseconds = Date.now() - timer.countdownStartTime;
    const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

    if (10 - elapsedSeconds <= 0) {
        timer.remainingCountdownSeconds = 0;
    } else {
        timer.remainingCountdownSeconds = 10 - elapsedSeconds;
    }

    displayElement.textContent = timer.remainingCountdownSeconds;

    if (timer.remainingCountdownSeconds !== timer.lastPlayedCountdownSecond) {
        playCountdownSounds(timer.remainingCountdownSeconds);
        timer.lastPlayedCountdownSecond = timer.remainingCountdownSeconds;
    }

    if (timer.remainingCountdownSeconds <= 0) {
        stopTimerInterval(timer);
        startSetTimer(timer, button, displayElement, formatTimer, 250, timerHeader);
    }
}

function stopCountdownTimer(timer, button, displayElement, timerHeader) {
    timer.currentState = TIMER_STATES.IDLE;
    timer.remainingCountdownSeconds = null;
    timer.countdownStartTime = null;
    timer.lastPlayedCountdownSecond = null;
    appState.activeSetTimer = false;

    button.textContent = "Start set";
    button.classList.remove("cancel-state");
    timerHeader.textContent = "Time under load";
    displayElement.textContent = formatTimer(0);

    stopTimerInterval(timer);
}


// =========================================================
// WORKOUT TIMER LOGIC
// =========================================================

function startWorkoutTimer(timer, displayElement, formatter, intervalSpeed = 1000) {
    timer.startedAt = new Date(appState.activeWorkout.startedAt).getTime();
    timer.elapsedSeconds = 0;

    updateWorkoutTimer(timer, displayElement, formatter);

    if (timer.intervalId === null) {
        timer.intervalId = setInterval(function () {
            updateWorkoutTimer(timer, displayElement, formatter);
        }, intervalSpeed);
    } else {
        console.error("A timer is already running");
    }
}

function updateWorkoutTimer(timer, displayElement, formatter) {
    const elapsedMilliseconds = Date.now() - timer.startedAt;
    timer.elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

    displayElement.textContent = formatter(timer.elapsedSeconds);
}

// =========================================================
// HELPERS
// =========================================================

function playCountdownSounds(secondsRemaining) {
    if (
        secondsRemaining === 3 ||
        secondsRemaining === 2 ||
        secondsRemaining === 1
    ) {
        playAudioFromStart(middleBeep);
    }

    if (secondsRemaining === 0) {
        playAudioFromStart(endBeep);
    }
}

function playAudioFromStart(audio) {
    audio.currentTime = 0;

    audio.play().catch(function (error) {
        console.error("Could not play countdown sound:", error);
    });
}

function stopTimerInterval(timer) {
    clearInterval(timer.intervalId);
    timer.intervalId = null;
}

function formatTimer(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(seconds).padStart(2, "0");

    return `${formattedMinutes}:${formattedSeconds}`;
}

function formatWorkoutSessionTime(totalSeconds) {
    const totalMinutes = Math.floor(totalSeconds / 60);

    if (totalMinutes < 1) {
        return "< 1 min";
    }

    if (totalMinutes < 60) {
        return `${totalMinutes} min`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `Session ${hours}h ${String(minutes).padStart(2, "0")}m`;
}
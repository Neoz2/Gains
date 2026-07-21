//training-timer.js

function createTimerState() {
    return {
        startedAt: null,
        intervalId: null,
        elapsedSeconds: 0
    };
}

function startTimer(timer, displayElement, formatter, intervalSpeed = 1000) {
    timer.startedAt = new Date(appState.activeWorkout.startedAt).getTime();
    timer.elapsedSeconds = 0;

    updateTimer(timer, displayElement, formatter);

    timer.intervalId = setInterval(function () {
        updateTimer(timer, displayElement, formatter);
    }, intervalSpeed);
}

function updateTimer(timer, displayElement, formatter) {
    const elapsedMilliseconds = Date.now() - timer.startedAt;
    timer.elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

    displayElement.textContent = formatter(timer.elapsedSeconds);
}

function stopTimerInterval(intervalId) {
    clearInterval(intervalId);
}

function startSetTimer(timer, button, displayElement) {
    appState.activeSetTimer = true;

    button.textContent = "Stop set";

    startTimer(timer, displayElement, formatTimer, 250);
}

function stopSetTimer(timer, exercise, card, weightInput) {
    appState.activeSetTimer = false;

    stopTimerInterval(timer.intervalId);

    saveWorkoutSet(exercise, timer.elapsedSeconds, weightInput.value);
    refreshWorkoutInputRow(exercise, card);
}

function startWorkoutSessionTimer(timer, displayElement) {
    startTimer(timer, displayElement, formatWorkoutSessionTime, 1000);
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
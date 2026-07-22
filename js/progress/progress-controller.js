// progress-controller.js

// =========================================================
// DOM REFERENCES
// =========================================================

//states
const progressSelectionState = document.querySelector(".graph-exercise-selection-state");
const progressEmptyState = document.getElementById("progress-empty-state");
const progressGraphState = document.querySelector(".graphs-state");

//mode titles
const progressModeTitle = document.getElementById("progress-page-title");
const progressModeSubtitle = document.getElementById("progress-page-subtitle");

//buttons
const exerciseDropdownButton = document.getElementById("progress-exercise-dropdown");

//content
const progressSelectionSpan = document.getElementById("progress-current-exercise");
const progressChartContent = document.getElementById("progress-chart-content");

// =========================================================
// PROGRESS CONTROLLER
// =========================================================

const PROGRESS_MODES = [];

let weightChart = null;
let tulChart = null;

let selectedSet = 0;

// --- Controller entry points --- //

function setupProgressController() {
    setupExerciseDropdownButton();
    setupSetButtons();
    setupProgressModes();
}

function refreshProgressScreen(mode = null) {
    if (mode === "progress-selection-mode") {
        enterSelectExerciseToAnalyseMode();
    } else {
        enterGraphsMode();
    }
}

// --- Setup --- //

function setupProgressModes() {
    PROGRESS_MODES.push(createMode(progressGraphState, "progress-graph-mode", "Exercise progress", "Track weight and time under load over time"));
    PROGRESS_MODES.push(createMode(progressSelectionState, "progress-selection-mode", "Analyse progress", "Select an exercise to view your trends"));
}

function setupExerciseDropdownButton() {
    navigateOnClick(exerciseDropdownButton, "analyse-progress-screen", "progress-selection-mode");
}

function setupSetButtons() {
    const buttons = document.querySelectorAll(".segmented-control");

    for (let buttonIndex = 0; buttonIndex < buttons.length; buttonIndex++) {
        const button = buttons[buttonIndex];

        button.addEventListener("click", function () {
            showPressFeedback(button);

            setButtonSelectionStatus(button, buttons);
            selectedSet = Number(buttons[buttonIndex].dataset.setIndex);

            enterGraphsMode();
        });
    }
}

// --- Modes --- //

function showProgressMode(mode) {
    hideAllStates(PROGRESS_MODES);
    showCurrentMode(mode, PROGRESS_MODES, progressModeTitle, progressModeSubtitle);
}

async function enterGraphsMode() {
    let selectedExercise = getSelectedProgressExercise();

    if (selectedExercise === null) {
        const exercises = loadExercises();

        if (exercises.length === 0) {
            destroyProgressCharts();
            progressSelectionSpan.textContent = "-";
            showProgressMode("progress-graph-mode");
            showProgressEmptyContent();
            return;
        }

        await saveSelectedProgressExerciseId(exercises[0].id);
        selectedExercise = exercises[0];
    }

    const points = loadGraphExerciseData(selectedExercise);

    if (points.length === 0) {
        destroyProgressCharts();
        progressSelectionSpan.textContent = selectedExercise.name;
        showProgressMode("progress-graph-mode");
        showProgressEmptyContent();
        return;
    }

    showProgressMode("progress-graph-mode");
    showProgressChartContent();
    renderProgressGraphs(selectedExercise, points);
}

function enterSelectExerciseToAnalyseMode() {
    renderAvailableExercisesForGraphs();
    showProgressMode("progress-selection-mode");
}

// --- Helpers --- //

function setButtonSelectionStatus(button, buttons) {
    for (let buttonIndex = 0; buttonIndex < buttons.length; buttonIndex++) {
        const button = buttons[buttonIndex];

        button.classList.remove("selected");
    }

    button.classList.add("selected");
}

function loadGraphExerciseData(selectedExercise) {
    const points = [];

    const workouts = getAscendingArrayOfWorkouts();

    for (let workoutIndex = 0; workoutIndex < workouts.length; workoutIndex++) {
        const workout = workouts[workoutIndex];

        const workoutExercise = workout.exercises.find(function (exercise) {
            return exercise.exerciseId === selectedExercise.id;
        });

        if (workoutExercise === undefined) {
            continue;
        }

        const set = workoutExercise.sets[selectedSet];

        if (set === undefined) {
            continue;
        }

        points.push({
            label: formatWorkoutDate(workout.startedAt),
            weight: Number(set.weight),
            timeUnderLoad: Number(set.timeUnderLoad)
        });
    }

    return points;
}

function destroyProgressCharts() {
    if (weightChart !== null) {
        weightChart.destroy();
        weightChart = null;
    }

    if (tulChart !== null) {
        tulChart.destroy();
        tulChart = null;
    }
}

function showProgressChartContent() {
    progressEmptyState.classList.add("hidden");
    progressChartContent.classList.remove("hidden");
}

function showProgressEmptyContent() {
    progressChartContent.classList.add("hidden");
    progressEmptyState.classList.remove("hidden");
}

// --- Rendering --- //

function renderAvailableExercisesForGraphs() {
    const availableExercisesList = document.querySelector(".graphs-unselected-items");

    availableExercisesList.innerHTML = "";

    const exercises = loadExercises();
    const selectedExerciseId = loadSelectedProgressExerciseId();

    for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
        const exercise = exercises[exerciseIndex];

        const isSelected = exercise.id === selectedExerciseId;
        const row = createExercisePickerRow(exercise, isSelected);

        row.addEventListener("click", function () {
            runWithPressFeedback(row, async function () {
                await saveSelectedProgressExerciseId(exercise.id);
                navigateToScreen("analyse-progress-screen", "progress-graph-mode");
            }, 90);
        });

        availableExercisesList.append(row);
    }
}

function renderProgressGraphs(selectedExercise, points) {
    progressSelectionSpan.textContent = selectedExercise.name;

    const labels = points.map(point => point.label);

    const weightCanvas = document.getElementById("weight-graph");
    const weightGradient = createChartFillGradient(weightCanvas);
    const weightTitle = "Weight";
    const weightData = points.map(point => point.weight);

    if (weightChart !== null) {
        weightChart.destroy();
    }

    weightChart = createProgressChart(weightCanvas, weightTitle, weightData, labels, weightGradient, false);

    const tulCanvas = document.getElementById("tul-graph");
    const tulGradient = createChartFillGradient(tulCanvas);
    const tulTitle = "Time under load";
    const tulData = points.map(point => point.timeUnderLoad);

    if (tulChart !== null) {
        tulChart.destroy();
    }

    tulChart = createProgressChart(tulCanvas, tulTitle, tulData, labels, tulGradient, true);
}

function createProgressChart(canvas, title, data, labels, gradient, showTargetLines) {
    return new Chart(canvas, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    data: data,
                    borderColor: "#EA2266",
                    backgroundColor: gradient,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    min: 0,
                    grid: {
                        display: false
                    },
                    grace: "25%"
                }
            },
            layout: {
                padding: {
                    top: 4,
                    bottom: 4,
                    left: 8,
                    right: 8
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: title,
                    align: "start",
                    color: "floralwhite",
                    font: {
                        size: 14
                    },
                    padding: {
                        top: 4,
                        bottom: 15
                    }
                },
                annotation: {
                    annotations: {
                        minTargetLine: {
                            display: showTargetLines,
                            type: "line",
                            yMin: 50,
                            yMax: 50,
                            borderColor: "rgba(255, 157, 46, 0.8)",
                            borderWidth: 2,
                            borderDash: [6, 6]
                        },
                        maxTargetLine: {
                            display: showTargetLines,
                            type: "line",
                            yMin: 70,
                            yMax: 70,
                            borderColor: "rgba(93, 227, 109, 0.8)",
                            borderWidth: 2,
                            borderDash: [6, 6]
                        }
                    }
                }
            }
        }
    });
}

function createChartFillGradient(canvas) {
    const context = canvas.getContext("2d");

    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);

    gradient.addColorStop(0, "rgba(234, 34, 102, 0.3)");
    gradient.addColorStop(0.25, "rgba(234, 34, 102, 0.1)");
    gradient.addColorStop(0.5, "rgba(234, 34, 102, 0.02)");
    gradient.addColorStop(1, "rgba(234, 34, 102, 0)");

    return gradient;
}
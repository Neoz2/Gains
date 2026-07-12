// progress-controller.js

// =========================================================
// DOM REFERENCES
// =========================================================

const exerciseDropdownButton = document.getElementById("progress-exercise-dropdown");
const progressSelectionSpan = document.getElementById("progress-current-exercise");
const graphSelectionState = document.querySelector(".graph-exercise-selection-state");
const graphState = document.querySelector(".graphs-state");
const progressPageTitle = document.getElementById("progress-page-title");
const progressPageSubtitle = document.getElementById("progress-page-subtitle");
const progressEmptyState = document.getElementById("progress-empty-state");
const progressChartContent = document.getElementById("progress-chart-content");

// =========================================================
// EXERCISE CONTROLLER
// =========================================================

let weightChart = null;
let tulChart = null;

let selectedSet = 0;
let points = [];

// --- Controller entry points --- //

function setupProgressController() {
    setupExerciseDropdownButton();
    setupSetButtons();
}

function refreshProgressScreen(mode = null) {
    if (mode === "selection") {
        enterSelectExerciseToAnalyseMode();
    } else {
        enterGraphsMode();
    }
}

// --- Setup --- //

function setupExerciseDropdownButton() {
    navigateOnClick(exerciseDropdownButton, "analyse-progress-screen", "selection");
}

function setupSetButtons() {
    const buttons = document.querySelectorAll(".segmented-control");

    for (let buttonIndex = 0; buttonIndex < buttons.length; buttonIndex++) {
        const button = buttons[buttonIndex];

        button.addEventListener("click", function () {
            setButtonSelectionStatus(button, buttons);
            selectedSet = Number(buttons[buttonIndex].dataset.setIndex);

            enterGraphsMode();
        });
    }
}

// --- Modes --- //

function showProgressMode(mode) {
    graphSelectionState.classList.add("hidden");
    graphState.classList.add("hidden");
    progressEmptyState.classList.add("hidden");
    progressChartContent.classList.add("hidden");

    if (mode === "graphs") {
        graphState.classList.remove("hidden");
        progressChartContent.classList.remove("hidden");

        updatePageHeader(
            progressPageTitle,
            progressPageSubtitle,
            "Analyse progress",
            "Track performance over time"
        );
    } else if (mode === "empty") {
        graphState.classList.remove("hidden");
        progressEmptyState.classList.remove("hidden");

        updatePageHeader(
            progressPageTitle,
            progressPageSubtitle,
            "Analyse progress",
            "Track performance over time"
        );
    } else if (mode === "selection") {
        graphSelectionState.classList.remove("hidden");

        updatePageHeader(
            progressPageTitle,
            progressPageSubtitle,
            "Choose exercise",
            "Select an exercise to analyse"
        );
    }
}

function enterGraphsMode() {
    let selectedExercise = getSelectedProgressExercise();

    if (selectedExercise === null) {
        const exercises = loadExercises();

        if (exercises.length === 0) {
            destroyProgressCharts();
            progressSelectionSpan.textContent = "-";
            showProgressMode("empty");
            return;
        }

        saveSelectedProgressExerciseId(exercises[0].id);
        selectedExercise = exercises[0];
    }

    loadGraphExerciseData();

    if (points.length === 0) {
        destroyProgressCharts();
        progressSelectionSpan.textContent = selectedExercise.name;
        showProgressMode("empty");
        return;
    }

    showProgressMode("graphs");
    loadGraphs();
}

function enterSelectExerciseToAnalyseMode() {
    renderAvailableExercisesForGraphs();
    showProgressMode("selection");
}

// --- Helpers --- //

function setButtonSelectionStatus(button, buttons) {
    for (let buttonIndex = 0; buttonIndex < buttons.length; buttonIndex++) {
        const button = buttons[buttonIndex];

        button.classList.remove("selected");
    }

    button.classList.add("selected");
}

function loadGraphExerciseData() {
    points = [];

    const selectedExercise = getSelectedProgressExercise();

    if (selectedExercise === null) {
        return;
    }

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
            saveSelectedProgressExerciseId(exercise.id);
            navigateToScreen("analyse-progress-screen", "graphs");
        });

        availableExercisesList.appendChild(row);
    }
}

// --- Graphs --- //

function loadGraphs() {
    const selectedExercise = getSelectedProgressExercise();

    if (selectedExercise === null) {
        return;
    }

    progressSelectionSpan.textContent = selectedExercise.name;

    // --- Graph configs --- //

    const weightCanvas = document.getElementById("weight-graph");
    const weightGradient = createChartFillGradient(weightCanvas);
    const weightTitle = "Weight";
    const weightData = points.map(point => point.weight);

    if (weightChart !== null) {
        weightChart.destroy();
    }

    weightChart = createProgressChart(weightCanvas, weightTitle, weightData, weightGradient, false);

    const tulCanvas = document.getElementById("tul-graph");
    const tulGradient = createChartFillGradient(tulCanvas);
    const tulTitle = "Time under load";
    const tulData = points.map(point => point.timeUnderLoad);

    if (tulChart !== null) {
        tulChart.destroy();
    }

    tulChart = createProgressChart(tulCanvas, tulTitle, tulData, tulGradient, true);
}

function createProgressChart(canvas, title, data, gradient, showTargetLines) {
    return new Chart(canvas, {
        type: "line",
        data: {
            labels: points.map(point => point.label),
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


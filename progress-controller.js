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

// =========================================================
// EXERCISE CONTROLLER
// =========================================================

let weightChart = null;
let tulChart = null;

let selectedExercise = null;
let selectedSet = 0;

// --- Controller entry points --- //

function setupProgressController() {
    setupExerciseDropdownButton()
    setupSetButtons();

    selectedExercise = loadExercises()[0];
}

function refreshProgressScreen() {
    enterGraphsMode(selectedExercise, selectedSet);
}

// --- Setup --- //

function setupExerciseDropdownButton() {
    exerciseDropdownButton.addEventListener("click", enterSelectExerciseToAnalyseMode);
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

    if (mode === "graphs") {
        graphState.classList.remove("hidden");
        updatePageHeader(progressPageTitle, progressPageSubtitle, "Analyse progress", "Track performance over time");
    } else if (mode === "selection") {
        graphSelectionState.classList.remove("hidden");
        updatePageHeader(progressPageTitle, progressPageSubtitle, "Choose exercise", "Select an exercise to analyse");
    }
}

function enterGraphsMode() {
    loadGraphs();
    showProgressMode("graphs");
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

//function findMinMax()

function loadGraphExerciseData() {

}

// --- Rendering --- //

function renderAvailableExercisesForGraphs() {
    const availableExercisesList = document.querySelector(".graphs-unselected-items");

    availableExercisesList.innerHTML = "";

    const exercises = loadExercises();

    for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
        const exercise = exercises[exerciseIndex];

        const row = createExercisePickerRow(exercise, false);

        row.addEventListener("click", function () {
            enterGraphsMode(exercise);
        });

        availableExercisesList.appendChild(row);
    }
}

// --- Graphs --- //

function loadGraphs() {
    const workouts = loadWorkouts();

    progressSelectionSpan.textContent = selectedExercise.name;

    const points = [];

    for (let workoutIndex = 0; workoutIndex < workouts.length; workoutIndex++) {
        const workout = workouts[workoutIndex];

        const exercise = workout.exercises.find(function (exercise) {
            return exercise.name === selectedExercise.name;
        });

        if (exercise === undefined) {
            continue;
        }

        const set = exercise.sets[selectedSet];

        if (set === undefined) {
            continue;
        }

        points.push({
            workoutNumber: points.length + 1,
            weight: Number(set.weight),
            timeUnderLoad: Number(set.timeUnderLoad)
        });
    }

    // --- Graph configs --- //

    const weightCanvas = document.getElementById("weight-graph");
    const weightGradient = createChartFillGradient(weightCanvas);

    if (weightChart !== null) {
        weightChart.destroy();
    }

    weightChart = new Chart(weightCanvas, {
        type: "line",
        data: {
            labels: points.map(point => point.workoutNumber),
            datasets: [
                {
                    data: points.map(point => point.weight),
                    borderColor: "#EA2266",
                    backgroundColor: weightGradient,
                    fill: true
                }
            ]
        },
        options: {
            scales: {
                y: {
                    suggestedMin: 0
                }
            },
            layout: {
                padding: {
                    top:4,
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
                    text: "Weight",
                    align: "start",
                    color: "floralwhite",
                    font: {
                        size: 14
                    },
                    padding: {
                        top: 4,
                        bottom: 15
                    }
                }
            }
        }
    });

    const tulCanvas = document.getElementById("tul-graph");
    const tulGradient = createChartFillGradient(tulCanvas);

    if (tulChart !== null) {
        tulChart.destroy();
    }

    tulChart = new Chart(tulCanvas, {
        type: "line",
        data: {
            labels: points.map(point => point.workoutNumber),
            datasets: [
                {
                    data: points.map(point => point.timeUnderLoad),
                    borderColor: "#EA2266",
                    backgroundColor: tulGradient,
                    fill: true
                }
            ]
        },
        options: {            
            scales: {
                y: {
                    suggestedMin: 0
                }
            },
            layout: {
                padding: {
                    top:4,
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
                    text: "Time under load",
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
                            type: "line",
                            yMin: 50,
                            yMax: 50,
                            borderColor: "rgba(255, 157, 46, 0.8)",
                            borderWidth: 2,
                            borderDash: [6, 6]
                        },
                        maxTargetLine: {
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

};

function createChartFillGradient(canvas) {
    const context = canvas.getContext("2d");

    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);

    gradient.addColorStop(0, "rgba(234, 34, 102, 0.3)");
    gradient.addColorStop(0.25, "rgba(234, 34, 102, 0.1)");
    gradient.addColorStop(0.5, "rgba(234, 34, 102, 0.02)");
    gradient.addColorStop(1, "rgba(234, 34, 102, 0)");

    return gradient;
}


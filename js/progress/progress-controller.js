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
let selectedAggregation = 0;

// --- Controller entry points --- //

function setupProgressController() {
    setupExerciseDropdownButton();
    setupSetButtons();
    setupAggregationButtons();
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

function setupAggregationButtons() {
    const buttons = document.querySelectorAll(".pill-segmented-control");

    for (let buttonIndex = 0; buttonIndex < buttons.length; buttonIndex++) {
        const button = buttons[buttonIndex];

        button.addEventListener("click", function () {
            showPressFeedback(button);

            setButtonSelectionStatus(button, buttons);
            selectedAggregation = Number(buttons[buttonIndex].dataset.setIndex);

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
            timeUnderLoad: Number(set.timeUnderLoad),
            periodKey: createPeriodKey(workout.startedAt)
        });
    }

    const filteredPoints = filterHighestInPeriod(points);

    return filteredPoints;
}

function createPeriodKey(startedAt) {
    const date = new Date(startedAt);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    const monday = getMondayOfWeek(date);

    const mondayYear = monday.getFullYear();
    const mondayMonth = String(monday.getMonth() + 1).padStart(2, "0");
    const mondayDay = String(monday.getDate()).padStart(2, "0");

    return {
        day: `${year}-${month}-${day}`,
        week: `${mondayYear}-${mondayMonth}-${mondayDay}`,
        month: `${year}-${month}`,

        dayLabel: formatWorkoutDate(date),
        weekLabel: formatWorkoutDate(monday),
        monthLabel: date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric"
        })
    };
}

function getMondayOfWeek(date) {
    const day = date.getDay();

    const daysSinceMonday = day === 0
        ? 6
        : day - 1;

    const monday = new Date(date);
    monday.setDate(monday.getDate() - daysSinceMonday);

    return monday;
}

function filterHighestInPeriod(points) {

    if (selectedAggregation === 0) {
        return points;
    }

    if (selectedAggregation === 1) {
        const weekEntries = [];

        for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
            const weekKey = points[pointIndex].periodKey.week;

            const existingWeek = weekEntries.find(function (entry) {
                return entry.key === weekKey;
            });

            if (!existingWeek) {
                weekEntries.push({
                    key: weekKey,
                    points: [points[pointIndex]]
                });
            }
            else {
                existingWeek.points.push(points[pointIndex]);
            }
        }

        const filteredWeek = [];

        for (let weekIndex = 0; weekIndex < weekEntries.length; weekIndex++) {
            const week = weekEntries[weekIndex];

            let bestPoint = null;

            for (let pointIndex = 0; pointIndex < week.points.length; pointIndex++) {
                const point = week.points[pointIndex];

                if (bestPoint === null) {
                    bestPoint = point;
                } else if (bestPoint.weight === point.weight) {
                    if (bestPoint.timeUnderLoad < point.timeUnderLoad) {
                        bestPoint = point;
                    }
                } else if (bestPoint.weight < point.weight) {
                    bestPoint = point;
                }
            }

            filteredWeek.push({
                ...bestPoint,
                label: week.points[0].periodKey.weekLabel
            });
        }

        return filteredWeek;
    }

    if (selectedAggregation === 2) {
        const monthEntries = [];

        for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
            const monthKey = points[pointIndex].periodKey.month;

            const existingMonth = monthEntries.find(function (entry) {
                return entry.key === monthKey;
            });

            if (!existingMonth) {
                monthEntries.push({
                    key: monthKey,
                    points: [points[pointIndex]]
                });
            }
            else {
                existingMonth.points.push(points[pointIndex]);
            }
        }

        const filteredMonth = [];

        for (let monthIndex = 0; monthIndex < monthEntries.length; monthIndex++) {
            const month = monthEntries[monthIndex];

            let bestPoint = null;

            for (let pointIndex = 0; pointIndex < month.points.length; pointIndex++) {
                const point = month.points[pointIndex];

                if (bestPoint === null) {
                    bestPoint = point;
                } else if (bestPoint.weight === point.weight) {
                    if (bestPoint.timeUnderLoad < point.timeUnderLoad) {
                        bestPoint = point;
                    }
                } else if (bestPoint.weight < point.weight) {
                    bestPoint = point;
                }
            }

            filteredMonth.push({
                ...bestPoint,
                label: month.points[0].periodKey.monthLabel
            });
        }

        return filteredMonth;
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

    const labels = points.map(function (point) {
        return point.label;
    });

    const weightCanvas = document.getElementById("weight-graph");
    const weightTitle = "Weight";

    const weightData = points.map(function (point) {
        return point.weight;
    });

    if (weightChart !== null) {
        weightChart.destroy();
    }

    weightChart = createProgressChart(
        weightCanvas,
        weightTitle,
        weightData,
        labels,
        false
    );

    const tulCanvas = document.getElementById("tul-graph");
    const tulTitle = "Time under load";

    const tulData = points.map(function (point) {
        return point.timeUnderLoad;
    });

    if (tulChart !== null) {
        tulChart.destroy();
    }

    tulChart = createProgressChart(
        tulCanvas,
        tulTitle,
        tulData,
        labels,
        true
    );
}

function createProgressChart(canvas, title, data, labels, showTargetLines) {
    return new Chart(canvas, {
        type: "line",

        data: {
            labels: labels,

            datasets: [
                {
                    data: data,

                    borderColor: "#EA2266",
                    borderWidth: 2,

                    backgroundColor: function (context) {
                        const chart = context.chart;
                        const chartArea = chart.chartArea;

                        if (!chartArea) {
                            return "rgba(234, 34, 102, 0.1)";
                        }

                        const gradient = chart.ctx.createLinearGradient(
                            0,
                            chartArea.top,
                            0,
                            chartArea.bottom
                        );

                        gradient.addColorStop(0, "rgba(234, 34, 102, 0.55)");
                        gradient.addColorStop(0.25, "rgba(234, 34, 102, 0.3)");
                        gradient.addColorStop(0.6, "rgba(234, 34, 102, 0.12)");
                        gradient.addColorStop(1, "rgba(234, 34, 102, 0)");

                        return gradient;
                    },

                    fill: true,
                    tension: 0.25,

                    pointRadius: 3,
                    pointHoverRadius: 5
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
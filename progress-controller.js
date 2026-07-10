// progress-controller.js

// =========================================================
// DOM REFERENCES
// =========================================================

    const exerciseDropdownButton = document.getElementById("progress-exercise-dropdown");
    const progressSelectionSpan = document.getElementById("progress-current-exercise");
    const graphSelectionState = document.querySelector(".graph-exercise-selection-state");
    const graphState = document.querySelector(".graphs-state");

// =========================================================
// EXERCISE CONTROLLER
// =========================================================

    let weightChart = null;
    let tulChart = null;

    // --- Controller entry points --- //

    function setupProgressController() {
        setupExerciseDropdownButton()
        setupSetButtons();
    }

    function refreshProgressScreen() {
        enterGraphsMode();
    }

    // --- Setup --- //

    function setupExerciseDropdownButton() {
        exerciseDropdownButton.addEventListener("click", enterSelectExerciseToAnalyseMode);
    }

    function setupSetButtons() {
        const buttons = document.querySelectorAll(".segmented-control");
        console.log(buttons);

        for (let buttonIndex = 0; buttonIndex < buttons.length; buttonIndex++){
            const button = buttons[buttonIndex];

            button.addEventListener("click", function() {
                setButtonSelectionStatus(button, buttons);
            });
        }
    }

    // --- Modes --- //

    function showProgressMode(mode) {
        graphSelectionState.classList.add("hidden");
        graphState.classList.add("hidden");

        if (mode === "graphs") {
            graphState.classList.remove("hidden");
        } else if (mode === "selection") {
            graphSelectionState.classList.remove("hidden");
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
        for (let buttonIndex = 0; buttonIndex < buttons.length; buttonIndex++){
            const button = buttons[buttonIndex];

            button.classList.remove("selected");
        } 

        button.classList.add("selected");
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
                console.log("selected");
            });

            availableExercisesList.appendChild(row);
        }
    }

    // --- Graphs --- //

    function loadGraphs() {
        const workouts = loadWorkouts();

        const firstExercise = loadExercises()[0];   

        progressSelectionSpan.textContent = firstExercise.name;

        const points = [];

        for (let workoutIndex = 0; workoutIndex < workouts.length; workoutIndex++) {
            const workout = workouts[workoutIndex];

            const exercise = workout.exercises.find(function (exercise) {
                return exercise.name === firstExercise.name;
            });

            if (exercise === undefined) {
                continue;
            }

            const set = exercise.sets[0];

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
            plugins: {
                legend: {
                    display: false
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
            plugins: {
                legend: {
                    display: false
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


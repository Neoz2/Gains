//training-controller.js

// =========================================================
// DOM REFERENCES
// =========================================================

const overviewStartTrainingButton = document.getElementById("choice-start-training");
const workoutEmptyStateAddExerciseButton = document.getElementById("empty-create-exercise");
const trainingEmptyState = document.querySelector(".training-empty-state");
const trainingOverviewState = document.querySelector(".training-overview-state");
const addExercisesToWorkoutState = document.querySelector(".training-add-exercises-state");

// =========================================================
// EXERCISE CONTROLLER
// =========================================================

// --- Controller entry points --- //

function setupTrainingController() {
    setupOverviewStartTrainingButton();
    setupAddExerciseToWorkoutButton();
}

function refreshTrainingScreen() {
    clearWorkoutForm();
    showTrainingMode("overview");
}

// --- Setup --- //

function setupOverviewStartTrainingButton() {
    overviewStartTrainingButton.addEventListener("click", enterStartEmptyTrainingMode);
}

function setupAddExerciseToWorkoutButton() {
    workoutEmptyStateAddExerciseButton.addEventListener("click", enterAddExercisesToWorkoutMode);
}

// --- Modes --- //

function showTrainingMode(mode) {
    trainingEmptyState.classList.add("hidden");
    trainingOverviewState.classList.add("hidden");
    addExercisesToWorkoutState.classList.add("hidden");

    if (mode === "empty") {
        trainingEmptyState.classList.remove("hidden");
    } else if (mode === "overview") {
        trainingOverviewState.classList.remove("hidden");
    } else if (mode === "addExercises") {
        addExercisesToWorkoutState.classList.remove("hidden");
    }
}

function enterStartEmptyTrainingMode() {
    //appState.editingExerciseId = null;

    //clearExerciseForm();
    //updateSettingsRowsVisibility();
    //updateSaveExerciseButtonText();

    showTrainingMode("empty");
}

function enterAddExercisesToWorkoutMode() {
    showTrainingMode("addExercises");
}

// --- Selection actions --- //

function selectWorkoutExercise(exercise) {
    removeExerciseFromArray(appState.workoutUnselectedExercises, exercise);
    addExerciseToArray(appState.workoutSelectedExercises, exercise);

    renderWorkoutExerciseLists();
}

function unselectWorkoutExercise(exercise) {
    removeExerciseFromArray(appState.workoutSelectedExercises, exercise);
    addExerciseToArray(appState.workoutUnselectedExercises, exercise);

    renderWorkoutExerciseLists();
}

// --- Rendering --- //

function renderWorkoutExerciseLists() {
    renderSelectedWorkoutExercises();
    renderAvailableWorkoutExercises();
}

function renderAvailableWorkoutExercises() {
    const availableExercisesList = document.querySelector(".training-unselected-items");

    availableExercisesList.innerHTML = "";

    for (let exerciseIndex = 0; exerciseIndex < appState.workoutUnselectedExercises.length; exerciseIndex++) {
        const exercise = appState.workoutUnselectedExercises[exerciseIndex];

        const row = createExercisePickerRow(exercise, false);

        row.addEventListener("click", function () {
            selectWorkoutExercise(exercise);
        });

        availableExercisesList.appendChild(row);
    }
}

function renderSelectedWorkoutExercises() {
    const selectedExercisesList = document.querySelector(".training-selected-items");

    selectedExercisesList.innerHTML = "";

    for (let exerciseIndex = 0; exerciseIndex < appState.workoutSelectedExercises.length; exerciseIndex++) {
        const exercise = appState.workoutSelectedExercises[exerciseIndex];

        const row = createExercisePickerRow(exercise, true);

        row.addEventListener("click", function () {
            unselectWorkoutExercise(exercise);
        });

        selectedExercisesList.appendChild(row);
    }
}

// --- Form helpers --- //

function clearWorkoutForm() {
    appState.workoutSelectedExercises.length = 0;
    appState.workoutUnselectedExercises.length = 0;

    const exercises = loadExercises();

    for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
        appState.workoutUnselectedExercises.push(exercises[exerciseIndex]);
    }

    renderWorkoutExerciseLists();
}
//training-controller.js

// =========================================================
// DOM REFERENCES
// =========================================================

const overviewStartTrainingButton = document.getElementById("choice-start-training");
const workoutEmptyStateAddExerciseButton = document.getElementById("empty-add-exercise");
const addToWorkoutButton = document.getElementById("add-to-workout");
const trainingPageTitle = document.getElementById("training-page-title");
const trainingPageSubtitle = document.getElementById("training-page-subtitle");
const workoutExerciseList = document.getElementById("workout-exercise-list");
const trainingEmptyState = document.querySelector(".training-empty-state");
const trainingOverviewState = document.querySelector(".training-overview-state");
const addExercisesToWorkoutState = document.querySelector(".training-add-exercises-state");
const workoutState = document.querySelector(".training-workout-state");

// =========================================================
// EXERCISE CONTROLLER
// =========================================================

// --- Controller entry points --- //

function setupTrainingController() {
    setupOverviewStartTrainingButton();
    setupAddExerciseToWorkoutButton();
    setupAddToWorkoutButton();
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

function setupAddToWorkoutButton() {
    addToWorkoutButton.addEventListener("click", enterWorkoutState);
}

// --- Modes --- //

function showTrainingMode(mode) {
    trainingEmptyState.classList.add("hidden");
    trainingOverviewState.classList.add("hidden");
    addExercisesToWorkoutState.classList.add("hidden");
    workoutState.classList.add("hidden");

    if (mode === "empty") {
        updatePageHeader(trainingPageTitle, trainingPageSubtitle, "Start training", "Start a new session");
        trainingEmptyState.classList.remove("hidden");
    } else if (mode === "overview") {
        updatePageHeader(trainingPageTitle, trainingPageSubtitle, "Start training", "Start a new session");
        trainingOverviewState.classList.remove("hidden");
    } else if (mode === "addExercises") {
        updatePageHeader(trainingPageTitle, trainingPageSubtitle, "Build from scratch", "Select exercises for your workout");
        addExercisesToWorkoutState.classList.remove("hidden");
    } else if (mode === "workout") {
        updatePageHeader(trainingPageTitle, trainingPageSubtitle, "Active training", "");
        workoutState.classList.remove("hidden");
    }
}

function enterStartEmptyTrainingMode() {
    clearWorkoutForm()

    showTrainingMode("empty");
}

function enterAddExercisesToWorkoutMode() {
    showTrainingMode("addExercises");
}

function enterWorkoutState() {
    const workout = createWorkout(appState.workoutSelectedExercises);
    renderWorkoutExerciseList(workout);

    showTrainingMode("workout");
}

// --- Selection actions --- //

function selectWorkoutExercise(exercise) {
    removeExerciseFromArray(appState.workoutUnselectedExercises, exercise);
    addExerciseToArray(appState.workoutSelectedExercises, exercise);

    renderWorkoutExercisePickerLists();
}

function unselectWorkoutExercise(exercise) {
    removeExerciseFromArray(appState.workoutSelectedExercises, exercise);
    addExerciseToArray(appState.workoutUnselectedExercises, exercise);

    renderWorkoutExercisePickerLists();
}

// --- Form helpers --- //

function clearWorkoutForm() {
    appState.workoutSelectedExercises.length = 0;
    appState.workoutUnselectedExercises.length = 0;

    const exercises = loadExercises();

    for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
        appState.workoutUnselectedExercises.push(exercises[exerciseIndex]);
    }

    renderWorkoutExercisePickerLists();
}

// --- Rendering --- //

function renderWorkoutExercisePickerLists() {
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

function renderWorkoutExerciseList(workout) {
    workoutExerciseList.innerHTML = "";

    for (let exerciseIndex = 0; exerciseIndex < workout.exercises.length; exerciseIndex++) {
        const exerciseCard = createWorkoutExerciseCard(workout.exercises[exerciseIndex], exerciseIndex);
        workoutExerciseList.appendChild(exerciseCard);
    }
}

// --- DOM builders --- //

function createWorkoutExerciseCard(exercise, exerciseIndex) {
    const card = createElement("li", "item-card", "workout-card");
    const dragIcon = createIcon("fa-solid", "fa-grip-vertical", "drag-handle");
    const index = createText(exerciseIndex + 1, "workout-exercise-index");
    const main = createElement("div", "workout-card-main");
    const title = createText(exercise.name, "item-title");
    const settings = createWorkoutExerciseCardSettings(exercise);
    const chevron = createIconButton("fa-solid", "fa-chevron-right", "chevron-button");

    main.appendChild(title);
    main.appendChild(settings);

    card.appendChild(dragIcon);
    card.appendChild(index);
    card.appendChild(main);
    card.appendChild(chevron);

    return card;
}

function createWorkoutExerciseCardSettings(exercise) {
    const settings = createElement("div", "workout-card-settings");

    for (let i = 0; i < exercise.settings.length; i++) {
        const setting = exercise.settings[i];
        const settingText = createText(`${setting.name} · ${setting.value}`, "item-subtitle", "workout-card-setting");
        settings.appendChild(settingText);
    }

    return settings;
}
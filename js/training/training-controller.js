//training-controller.js

// =========================================================
// DOM REFERENCES
// =========================================================

//states
const trainingExerciseEmptyState = document.querySelector(".training-exercise-empty-state");
const trainingTemplateEmptyState = document.querySelector(".training-template-empty-state");
const trainingStartState = document.querySelector(".training-overview-state");
const trainingFromScratchState = document.querySelector(".training-add-exercises-state");
const trainingFromTemplateState = document.querySelector(".select-template-state");
const trainingWorkoutState = document.querySelector(".training-workout-state");
const trainingEndOfWorkoutState = document.querySelector(".training-end-of-workout-state");

//mode titles
const trainingModeTitle = document.getElementById("training-page-title");
const trainingModeSubtitle = document.getElementById("training-page-subtitle");

//buttons
const overviewStartTrainingButton = document.getElementById("choice-start-training");
const overviewFromTemplateButton = document.getElementById("choice-from-template");
const workoutEmptyStateAddExerciseButton = document.getElementById("empty-add-exercise");
const workoutEmptyStateAddTemplateButton = document.getElementById("empty-add-template");
const addToWorkoutButton = document.getElementById("add-to-workout");
const finishWorkoutButton = document.getElementById("finish-workout");
const trainingBackButton = document.querySelector("#start-training-screen .back-button");
const editWorkoutButton = document.getElementById("edit-workout");

// =========================================================
// TRAINING CONTROLLER
// =========================================================

const TRAINING_MODES = [];

const workoutSessionTimer = createTimerState();
let finishWorkoutHoldTimer = null;

// --- Controller entry points --- //

function setupTrainingController() {
    setupTrainingChoiceButtons();
    setupTrainingEmptyStateButtons();
    setupWorkoutButtons();
    setupEndOfTrainingActions();
    setupTrainingModes();
}

function refreshTrainingScreen(mode = null) {
    if (mode === "training-edit-workout-mode") {
        enterEditWorkoutMode();
        return;
    }

    if (appState.activeWorkout !== null) {
        showTrainingMode("training-workout-mode");
        updateTimer(workoutSessionTimer, trainingModeSubtitle, formatWorkoutSessionTime);

        renderWorkoutExerciseList(appState.activeWorkout);
        openStoredWorkoutCard();
        return;
    }

    if (mode === null || mode === "training-workout-mode") {
        showTrainingMode("training-start-workout-mode");
        return;
    }

    if (mode === "training-from-template-mode") {
        renderWorkoutTemplateList();
    }

    showTrainingMode(mode);
}

// --- Setup --- //

function setupTrainingModes() {
    TRAINING_MODES.push(createMode(trainingEndOfWorkoutState, "training-end-of-workout-mode", "", ""));
    TRAINING_MODES.push(createMode(trainingWorkoutState, "training-workout-mode", "Active training", ""));
    TRAINING_MODES.push(createMode(trainingFromTemplateState, "training-from-template-mode", "Start from template", "Select a template for your workout"));
    TRAINING_MODES.push(createMode(trainingFromScratchState, "training-from-scratch-mode", "Build from scratch", "Select exercises for your workout"));
    TRAINING_MODES.push(createMode(trainingStartState, "training-start-workout-mode", "Start training", "Choose how you want to begin"));
    TRAINING_MODES.push(createMode(trainingTemplateEmptyState, "training-no-available-templates-mode", "Start training", "Select a template for your workout"));
    TRAINING_MODES.push(createMode(trainingExerciseEmptyState, "training-no-available-exercises-mode", "Start training", "Select exercises for your workout"));
    TRAINING_MODES.push(createMode(trainingFromScratchState, "training-edit-workout-mode", "Edit workout", ""));
}

function setupTrainingChoiceButtons() {
    overviewStartTrainingButton.addEventListener("click", function () {
        runWithPressFeedback(overviewStartTrainingButton, enterFromScratchMode, 90);
    });

    overviewFromTemplateButton.addEventListener("click", function () {
        runWithPressFeedback(overviewFromTemplateButton, enterFromTemplateMode, 90);
    });
}

function setupTrainingEmptyStateButtons() {
    navigateOnClick(workoutEmptyStateAddExerciseButton, "create-exercises-screen", "exercise-create-mode");
    navigateOnClick(workoutEmptyStateAddTemplateButton, "create-templates-screen", "template-create-mode");
}

function setupWorkoutButtons() {
    addToWorkoutButton.addEventListener("click", function () {
        runWithPressFeedback(addToWorkoutButton, saveWorkoutSelection);
    });

    finishWorkoutButton.addEventListener("pointerdown", function () {
        finishWorkoutButton.textContent = "Release to cancel";
        finishWorkoutButton.classList.add("is-holding");

        finishWorkoutHoldTimer = setTimeout(function () {
            enterEndOfWorkoutMode();
        }, 2000);
    });

    finishWorkoutButton.addEventListener("pointerup", cancelFinishWorkoutHold);
    finishWorkoutButton.addEventListener("pointerleave", cancelFinishWorkoutHold);
    finishWorkoutButton.addEventListener("pointercancel", cancelFinishWorkoutHold);

    editWorkoutButton.addEventListener("click", function () {
        runWithPressFeedback(editWorkoutButton, function () {
            navigateToScreen("start-training-screen", "training-edit-workout-mode");
        });
    });
}

function cancelFinishWorkoutHold() {
    finishWorkoutButton.classList.remove("is-holding");
    clearTimeout(finishWorkoutHoldTimer);
    finishWorkoutButton.textContent = "Finish workout";
}

function setupEndOfTrainingActions() {
    navigateOnClick(trainingEndOfWorkoutState, "home-screen");
}

// --- Modes --- //

function showTrainingMode(mode) {
    hideAllStates(TRAINING_MODES);
    showCurrentMode(mode, TRAINING_MODES, trainingModeTitle, trainingModeSubtitle);
    updateTrainingBackButtonVisibility(mode);
}

function updateTrainingBackButtonVisibility(mode) {
    const shouldHideBackButton =
        mode === "training-workout-mode" ||
        mode === "training-end-of-workout-mode";

    trainingBackButton.classList.toggle("invisible", shouldHideBackButton);
}

// --- Workout lifecycle --- //

function enterEditWorkoutMode() {
    if (appState.activeWorkout === null) {
        showTrainingMode("training-start-workout-mode");
        return;
    }

    addToWorkoutButton.textContent = "Update workout";
    setupEditWorkoutPicker();
    showTrainingMode("training-edit-workout-mode");
}

function enterFromScratchMode() {
    addToWorkoutButton.textContent = "Add to workout";
    resetWorkoutExercisePicker();

    const exercises = loadExercises();

    if (exercises.length > 0) {
        navigateToScreen("start-training-screen", "training-from-scratch-mode");
    } else {
        navigateToScreen("start-training-screen", "training-no-available-exercises-mode");
    }
}

function enterFromTemplateMode() {
    const usableTemplates = getUsableTemplates();

    if (usableTemplates.length === 0) {
        navigateToScreen("start-training-screen", "training-no-available-templates-mode");
    } else {
        navigateToScreen("start-training-screen", "training-from-template-mode");
    }
}
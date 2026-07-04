//training-controller.js

// =========================================================
// DOM REFERENCES
// =========================================================

const overviewStartTrainingButton = document.getElementById("choice-start-training");
const trainingEmptyState = document.querySelector(".training-empty-state");
const trainingOverviewState = document.querySelector(".training-overview-state");

// =========================================================
// EXERCISE CONTROLLER
// =========================================================

// --- Controller entry points --- //

function setupTrainingController() {
    setupOverviewStartTrainingButton();
}

function refreshTrainingScreen() {
    showTrainingMode("overview");
}

// --- Setup --- //

function setupOverviewStartTrainingButton() {
	overviewStartTrainingButton.addEventListener("click", enterStartEmptyTrainingMode);
}

// --- Modes --- //

function showTrainingMode(mode) {
    trainingEmptyState.classList.add("hidden");
    trainingOverviewState.classList.add("hidden");

    if (mode === "empty") {
        trainingEmptyState.classList.remove("hidden");
    } else if (mode === "overview") {
        trainingOverviewState.classList.remove("hidden");
    } 
}

function enterStartEmptyTrainingMode() {
    //appState.editingExerciseId = null;

    //clearExerciseForm();
    //updateSettingsRowsVisibility();
    //updateSaveExerciseButtonText();

    showTrainingMode("empty");
}


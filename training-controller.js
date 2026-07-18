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

//content
const workoutExerciseList = document.getElementById("workout-exercise-list");

// =========================================================
// TRAINING CONTROLLER
// =========================================================

const TRAINING_MODES = [];

const workoutSessionTimer = createTimerState();

let unfoldedWorkoutCardIndex = 0;

// --- Controller entry points --- //

function setupTrainingController() {
    setupTrainingChoiceButtons();
    setupTrainingEmptyStateButtons();
    setupWorkoutButtons();
    setupEndOfTrainingActions();
    setupTrainingModes();
}

function refreshTrainingScreen(mode = null) {
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
}

function setupTrainingChoiceButtons() {
    overviewStartTrainingButton.addEventListener("click", enterFromScratchMode);
    overviewFromTemplateButton.addEventListener("click", enterFromTemplateMode);
}

function setupTrainingEmptyStateButtons() {
    navigateOnClick(workoutEmptyStateAddExerciseButton, "create-exercises-screen", "form");
    navigateOnClick(workoutEmptyStateAddTemplateButton, "create-templates-screen", "form");
}

function setupWorkoutButtons() {
    addToWorkoutButton.addEventListener("click", function () {
        enterWorkoutState(appState.workoutSelectedExercises);
    });

    finishWorkoutButton.addEventListener("click", enterEndOfWorkoutMode);
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
    const shouldHideBackButton = hasActiveWorkout() || mode === "training-end-of-workout-mode";

    trainingBackButton.classList.toggle("invisible", shouldHideBackButton);
}

// --- Workout lifecycle --- //

function enterFromScratchMode() {
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

function enterWorkoutState(exercises) {
    const workout = createWorkout(exercises);

    if (workout.exercises.length === 0) {
        return;
    }

    appState.activeWorkout = workout;
    addWorkout(workout);

    unfoldedWorkoutCardIndex = 0;

    navigateToScreen("start-training-screen", "training-workout-mode");

    startWorkoutSessionTimer(workoutSessionTimer, trainingModeSubtitle);
}

function enterEndOfWorkoutMode() {
    updateWorkout(appState.activeWorkout);

    stopTimerInterval(workoutSessionTimer.intervalId);

    appState.activeWorkout = null;

    navigateToScreen("start-training-screen", "training-end-of-workout-mode");
}

// --- Mutate actions --- //

function saveWorkoutSet(exercise, elapsedTime, weight) {
    const set = createWorkoutExerciseSet(Number(weight), elapsedTime);

    exercise.sets.push(set);

    updateWorkout(appState.activeWorkout);
}

function deleteWorkoutSet(setNumber, exercise, card) {
    exercise.sets.splice(setNumber - 1, 1);

    updateWorkout(appState.activeWorkout);
    renderWorkoutSets(exercise, card);
}

function decreaseSetTimeUnderLoad(set, exercise, card) {
    if (set.timeUnderLoad > 0) {
        set.timeUnderLoad -= 1;
    }

    updateWorkout(appState.activeWorkout);
    renderWorkoutSets(exercise, card);
}

function increaseSetTimeUnderLoad(set, exercise, card) {
    set.timeUnderLoad += 1;

    updateWorkout(appState.activeWorkout);
    renderWorkoutSets(exercise, card);
}

// --- Exercise picker actions --- //

function selectWorkoutExercise(exercise) {
    removeSelectedExercise(appState.workoutUnselectedExercises, exercise);
    addSelectedExercise(appState.workoutSelectedExercises, exercise);

    renderWorkoutExercisePickerLists();
}

function unselectWorkoutExercise(exercise) {
    removeSelectedExercise(appState.workoutSelectedExercises, exercise);
    addSelectedExercise(appState.workoutUnselectedExercises, exercise);

    renderWorkoutExercisePickerLists();
}

// --- Exercise picker helpers --- //

function resetWorkoutExercisePicker() {
    appState.workoutSelectedExercises.length = 0;
    appState.workoutUnselectedExercises.length = 0;

    const exercises = loadExercises();

    for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
        appState.workoutUnselectedExercises.push(exercises[exerciseIndex]);
    }

    renderWorkoutExercisePickerLists();
}

function getUsableTemplates() {
    const templates = loadTemplates();

    return templates.filter(function (template) {
        return template.exerciseIds.length > 0;
    });
}

// --- Workout card UI helpers --- //

function closeAllWorkoutCardsExcept(activeCard) {
    const workoutCards = document.querySelectorAll(".workout-card");

    for (let cardIndex = 0; cardIndex < workoutCards.length; cardIndex++) {
        const card = workoutCards[cardIndex];

        if (card !== activeCard) {
            const details = card.querySelector(".workout-card-details");
            const inputRow = card.querySelector(".workout-input-row");
            const chevron = card.querySelector(".chevron-button");

            details.classList.add("hidden");
            inputRow.classList.add("hidden");
            chevron.classList.remove("chevron-rotate");
        }
    }
}

function openStoredWorkoutCard() {
    const workoutCards = document.querySelectorAll(".workout-card");

    if (workoutCards.length === 0) {
        return;
    }

    const safeIndex = Math.min(unfoldedWorkoutCardIndex, workoutCards.length - 1);
    const card = workoutCards[safeIndex];

    openWorkoutCard(card);
    closeAllWorkoutCardsExcept(card);
}

function openWorkoutCard(card) {
    const details = card.querySelector(".workout-card-details");
    const inputRow = card.querySelector(".workout-input-row");
    const chevron = card.querySelector(".chevron-button");

    details.classList.remove("hidden");
    inputRow.classList.remove("hidden");
    chevron.classList.add("chevron-rotate");
}

function openSelectedWorkoutCard(card, exerciseIndex) {
    if (appState.activeSetTimer === true) {
        return;
    }

    unfoldedWorkoutCardIndex = exerciseIndex;

    openWorkoutCard(card);
    closeAllWorkoutCardsExcept(card);
}

// --- Rendering --- //

function renderWorkoutTemplateList() {
    const availableTemplateList = document.getElementById("workout-template-list");
    availableTemplateList.innerHTML = "";

    const usableTemplates = getUsableTemplates();

    for (let templateIndex = 0; templateIndex < usableTemplates.length; templateIndex++) {
        const templateCard = createTemplateOption(usableTemplates[templateIndex]);
        availableTemplateList.append(templateCard);
    }
}

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

        availableExercisesList.append(row);
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

        selectedExercisesList.append(row);
    }
}

function renderWorkoutExerciseList(workout) {
    workoutExerciseList.innerHTML = "";

    for (let exerciseIndex = 0; exerciseIndex < workout.exercises.length; exerciseIndex++) {
        const exerciseCard = createWorkoutExerciseCard(workout.exercises[exerciseIndex], exerciseIndex);
        workoutExerciseList.append(exerciseCard);
    }
}

function renderWorkoutSets(exercise, card) {
    const setCounter = card.querySelector(".workout-set-count");
    const workoutSetBlock = card.querySelector(".workout-sets-block");
    const workoutSetList = card.querySelector(".workout-sets-list");

    setCounter.textContent = formatCountLabel(exercise.sets.length, "set");

    if (exercise.sets.length > 0) {
        setCounter.classList.add("has-sets");
        workoutSetBlock.classList.remove("hidden");
    } else {
        setCounter.classList.remove("has-sets");
        workoutSetBlock.classList.add("hidden");
    }

    workoutSetList.innerHTML = "";

    for (let setIndex = 0; setIndex < exercise.sets.length; setIndex++) {
        const set = exercise.sets[setIndex];
        const setRow = createSetRow(setIndex + 1, set, exercise, card);

        workoutSetList.append(setRow);
    }
}

function refreshWorkoutInputRow(exercise, card) {
    const oldInputRow = card.querySelector(".workout-input-row");
    const newInputRow = createWeightInputRow(exercise, card);

    newInputRow.classList.remove("hidden");

    card.replaceChild(newInputRow, oldInputRow);

    renderWorkoutSets(exercise, card);
}

// --- DOM builders --- //

function createWorkoutExerciseCard(exercise, exerciseIndex) {
    const card = createElement("li", "item-card", "workout-card");
    const dragIcon = createIcon("fa-solid", "fa-grip-vertical", "drag-handle");

    const content = createElement("div", "workout-card-content");
    const body = createWorkoutExerciseCardBody(exercise, exerciseIndex);
    const details = createWorkoutExerciseCardDetails(exercise);
    const inputRow = createWeightInputRow(exercise, card);

    body.addEventListener("click", function () {
        openSelectedWorkoutCard(card, exerciseIndex);
    });

    content.append(body);
    card.append(dragIcon, content, details, inputRow);

    renderWorkoutSets(exercise, card);

    return card;
}

function createWorkoutExerciseCardBody(exercise, exerciseIndex) {
    const body = createElement("div", "workout-card-body");

    const index = createText(exerciseIndex + 1, "workout-exercise-index");
    const title = createText(exercise.name, "workout-exercise-title");
    const numberOfSets = createText("0 sets", "workout-set-count");
    const chevron = createIconButton("fa-solid", "fa-chevron-right", "chevron-button");

    body.append(index, title, numberOfSets, chevron);

    return body;
}

function createWorkoutExerciseCardDetails(exercise) {
    const details = createElement("div", "workout-card-details", "hidden");
    const settings = createWorkoutExerciseCardSettings(exercise);

    details.append(settings);

    return details;
}

function createWorkoutExerciseCardSettings(exercise) {
    const settings = createElement("div", "workout-card-settings");

    for (let i = 0; i < exercise.settings.length; i++) {
        const setting = exercise.settings[i];
        const settingText = createText(`${setting.name} · ${setting.value}`, "workout-card-setting-pill");
        settings.append(settingText);
    }

    return settings;
}

function createWeightInputRow(exercise, card) {
    const inputRow = createElement("div", "workout-input-row", "hidden");
    const headers = createElement("div", "workout-input-headers");
    const content = createElement("div", "workout-inputs");

    const weightHeader = createText("Weight (kg)", "field-name");
    const timerHeader = createText("Time under load", "field-name");

    const weightInput = createWeightInput(exercise);
    const bigTimer = createText("00:00", "workout-big-timer");

    const button = createTimerButton(weightInput, bigTimer, exercise, card);
    const setContainer = createSetContainer();

    const recommendation = createRecommendationCard(exercise);

    headers.append(weightHeader, timerHeader);
    content.append(weightInput, bigTimer);

    if (recommendation !== null) {
        inputRow.append(recommendation);
    }

    inputRow.append(headers, content, button, setContainer);

    return inputRow;
}

function createWeightInput(exercise) {
    const nextSetNumber = exercise.sets.length + 1;
    const ignoredWorkoutId = appState.activeWorkout === null ? null : appState.activeWorkout.id;
    const lastSet = getSetOfLastSession(exercise, nextSetNumber, ignoredWorkoutId);

    const weightInput = createElement("input", "workout-weight-input");
    weightInput.type = "number";
    weightInput.min = "0";
    weightInput.placeholder = "-";

    if (lastSet !== null) {
        weightInput.value = lastSet.weight;
    }

    weightInput.addEventListener("input", function () {
        if (!weightInput.validity.valid) {
            weightInput.value = "";
        }
        if (weightInput.value !== "") {
            weightInput.value = parseInt(weightInput.value);
        }
    });

    return weightInput;
}

function createTimerButton(weightInput, bigTimer, exercise, card) {
    const button = createButton("button-large");
    button.textContent = "Start set";

    let isStarted = false;
    const setTimer = createTimerState();

    button.addEventListener("click", function () {
        if (isStarted === false && weightInput.value !== "") {
            isStarted = true;
            startSetTimer(setTimer, button, bigTimer);
            return;
        }

        if (isStarted === true) {
            isStarted = false;
            stopSetTimer(setTimer, exercise, card, weightInput);
        }
    });

    return button;
}

function createSetContainer() {
    const setContainer = createElement("div", "workout-sets-block", "hidden");
    const header = createText("Completed sets", "field-name");
    const setList = createElement("div", "workout-sets-list");

    setContainer.append(header, setList);

    return setContainer;
}

function createSetRow(setNumber, set, exercise, card) {
    const setRow = createElement("div", "workout-set-row");
    const setTimeControl = createElement("div", "workout-set-time-control");
    const weightText = createElement("div", "workout-weight");

    const deleteButton = createIconButton("fa-regular", "fa-trash-can", "workout-set-delete-button");
    const setNumberText = createText(`Set ${setNumber}`, "workout-set-muted", "workout-set-index");
    const weightValue = createText(set.weight, "workout-set-value");
    const weightKg = createText("kg", "workout-set-muted");
    const timeUnderLoadText = createText(formatTimer(set.timeUnderLoad), "workout-set-value");
    const plusButton = createIconButton("fa-solid", "fa-plus", "workout-set-action-button");
    const minusButton = createIconButton("fa-solid", "fa-minus", "workout-set-action-button");

    deleteButton.addEventListener("click", function () {
        deleteWorkoutSet(setNumber, exercise, card);
    });

    minusButton.addEventListener("click", function () {
        decreaseSetTimeUnderLoad(set, exercise, card);
    });

    plusButton.addEventListener("click", function () {
        increaseSetTimeUnderLoad(set, exercise, card);
    });

    weightText.append(weightValue, weightKg);
    setTimeControl.append(minusButton, timeUnderLoadText, plusButton);
    setRow.append(deleteButton, setNumberText, weightText, setTimeControl);

    return setRow;
}

function createTemplateOption(template) {
    const card = createElement("li", "item-card");
    const header = createElement("div", "card-header");

    const iconBadge = createElement("span", "icon-badge");
    const icon = createIcon("fa-solid", "fa-clipboard-list", "item-icon");

    const main = createElement("div", "item-text");

    const title = createText(template.name, "item-title");
    const subtitle = createText(formatCountLabel(template.exerciseIds.length, "exercise"), "item-subtitle");

    const startButton = createButton("action-button");
    startButton.textContent = "Start";

    iconBadge.append(icon);
    main.append(title, subtitle);
    header.append(iconBadge, main, startButton);
    card.append(header);

    card.addEventListener("click", function () {
        const templateExercises = getExercisesFromTemplate(template);
        enterWorkoutState(templateExercises);
    });

    return card;
}
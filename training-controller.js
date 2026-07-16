//training-controller.js

// =========================================================
// DOM REFERENCES
// =========================================================

const overviewStartTrainingButton = document.getElementById("choice-start-training");
const overviewFromTemplateButton = document.getElementById("choice-from-template");
const workoutEmptyStateAddExerciseButton = document.getElementById("empty-add-exercise");
const workoutEmptyStateAddTemplateButton = document.getElementById("empty-add-template");
const addToWorkoutButton = document.getElementById("add-to-workout");
const finishWorkoutButton = document.getElementById("finish-workout");
const trainingBackButton = document.querySelector("#start-training-screen .back-button");
const trainingPageTitle = document.getElementById("training-page-title");
const trainingPageSubtitle = document.getElementById("training-page-subtitle");
const workoutExerciseList = document.getElementById("workout-exercise-list");
const trainingExerciseEmptyState = document.querySelector(".training-exercise-empty-state");
const trainingTemplateEmptyState = document.querySelector(".training-template-empty-state");
const trainingOverviewState = document.querySelector(".training-overview-state");
const addExercisesToWorkoutState = document.querySelector(".training-add-exercises-state");
const selectTemplateState = document.querySelector(".select-template-state");
const workoutState = document.querySelector(".training-workout-state");
const summaryState = document.querySelector(".summary-state");

// =========================================================
// TRAINING CONTROLLER
// =========================================================

let timerStartedAt = null;
let timerIntervalId = null;
let elapsedSeconds = 0;

// --- Controller entry points --- //

function setupTrainingController() {
    setupTrainingChoiceButtons();
    setupTrainingEmptyStateButtons();
    setupWorkoutButtons();
    setupSummaryActions();
}

function refreshTrainingScreen(mode = null) {
    if (modeUsesExistingWorkoutState(mode)) {
        showTrainingMode(mode);
        return;
    }

    clearWorkoutFormAndLoadPicker();

    if (mode === "empty-exercises") {
        showTrainingMode("empty-exercises");
    } else if (mode === "empty-templates") {
        showTrainingMode("empty-templates");
    } else if (mode === "addExercises") {
        showTrainingMode("addExercises");
    } else if (mode === "selectTemplate") {
        renderWorkoutTemplateList();
        showTrainingMode("selectTemplate");
    } else {
        showTrainingMode("overview");
    }
}

// --- Setup --- //

function setupTrainingChoiceButtons() {
    overviewStartTrainingButton.addEventListener("click", enterStartEmptyTrainingMode);
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

    finishWorkoutButton.addEventListener("click", enterSummaryMode);
}

function setupSummaryActions() {
    navigateOnClick(summaryState, "home-screen");
}

// --- Modes --- //

function showTrainingMode(mode) {
    hideAllTrainingStates();

    if (appState.activeWorkout !== null) {
        showActiveWorkoutMode();
        updateTrainingBackButtonVisibility(mode);
        return;
    }

    if (appState.activeWorkout === null) {
        if (mode === "empty-exercises") {
            updatePageHeader(trainingPageTitle, trainingPageSubtitle, "Start training", "Start a new session");
            trainingExerciseEmptyState.classList.remove("hidden");
        } else if (mode === "overview") {
            updatePageHeader(trainingPageTitle, trainingPageSubtitle, "Start training", "Start a new session");
            trainingOverviewState.classList.remove("hidden");
        } else if (mode === "addExercises") {
            updatePageHeader(trainingPageTitle, trainingPageSubtitle, "Build from scratch", "Select exercises for your workout");
            addExercisesToWorkoutState.classList.remove("hidden");
        } else if (mode === "workout") {
            updatePageHeader(trainingPageTitle, trainingPageSubtitle, "Active training", "");
            workoutState.classList.remove("hidden");
        } else if (mode === "selectTemplate") {
            updatePageHeader(trainingPageTitle, trainingPageSubtitle, "Start from template", "Select a template for your workout");
            selectTemplateState.classList.remove("hidden");
        } else if (mode === "summary") {
            updatePageHeader(trainingPageTitle, trainingPageSubtitle, "", "");
            summaryState.classList.remove("hidden");
        } else if (mode === "empty-templates") {
            updatePageHeader(trainingPageTitle, trainingPageSubtitle, "Start from template", "Select a template for your workout");
            trainingTemplateEmptyState.classList.remove("hidden");
        }
    }

    updateTrainingBackButtonVisibility(mode);
}

function enterStartEmptyTrainingMode() {
    clearWorkoutFormAndLoadPicker()

    const exercises = loadExercises();

    if (exercises.length > 0) {
        navigateToScreen("start-training-screen", "addExercises");
    } else {
        navigateToScreen("start-training-screen", "empty-exercises");
    }
}

function enterFromTemplateMode() {
    const usableTemplates = getUsableTemplates();

    if (usableTemplates.length === 0) {
        navigateToScreen("start-training-screen", "empty-templates");
    } else {
        navigateToScreen("start-training-screen", "selectTemplate");
    }
}

function enterWorkoutState(exercises) {
    const workout = createWorkout(exercises);

    if (workout.exercises.length === 0) {
        return;
    }

    appState.activeWorkout = workout;
    addWorkout(workout);

    navigateToScreen("start-training-screen", "workout");

    const firstWorkoutCard = document.querySelector(".workout-card");

    if (firstWorkoutCard === null) {
        return;
    }

    openWorkoutCard(firstWorkoutCard);
    closeAllWorkoutCardsExcept(firstWorkoutCard);
}

function enterSummaryMode() {
    updateWorkout(appState.activeWorkout);

    appState.activeWorkout = null;

    navigateToScreen("start-training-screen", "summary");
}

function showActiveWorkoutMode() {
    updatePageHeader(trainingPageTitle, trainingPageSubtitle, "Active training", "");
    renderWorkoutExerciseList(appState.activeWorkout);
    workoutState.classList.remove("hidden");
}

// --- Mutate actions --- //

function saveWorkoutSet(exercise, elapsedTime, weight) {
    const set = createWorkoutExerciseSet(Number(weight), elapsedTime);

    exercise.sets.push(set);

    updateWorkout(appState.activeWorkout);
}

// --- Selection actions --- //

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

// --- Form helpers --- //

function clearWorkoutFormAndLoadPicker() {
    appState.workoutSelectedExercises.length = 0;
    appState.workoutUnselectedExercises.length = 0;

    const exercises = loadExercises();

    for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
        appState.workoutUnselectedExercises.push(exercises[exerciseIndex]);
    }

    renderWorkoutExercisePickerLists();
}

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

function openWorkoutCard(card) {
    const details = card.querySelector(".workout-card-details");
    const inputRow = card.querySelector(".workout-input-row");
    const chevron = card.querySelector(".chevron-button");

    details.classList.remove("hidden");
    inputRow.classList.remove("hidden");
    chevron.classList.add("chevron-rotate");
}

function updateTrainingBackButtonVisibility(mode) {
    const shouldHideBackButton = appState.activeWorkout !== null || mode === "summary";

    trainingBackButton.classList.toggle("invisible", shouldHideBackButton);
}

function getUsableTemplates() {
    const templates = loadTemplates();

    return templates.filter(function (template) {
        return template.exerciseIds.length > 0;
    });
}

function refreshWorkoutInputRow(exercise, card) {
    const oldInputRow = card.querySelector(".workout-input-row");
    const newInputRow = createWeightInputRow(exercise, card);

    newInputRow.classList.remove("hidden");

    card.replaceChild(newInputRow, oldInputRow);

    renderWorkoutSets(exercise, card);
}

function modeUsesExistingWorkoutState(mode) {
    return mode === "workout" || mode === "summary";
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

function hideAllTrainingStates() {
    trainingExerciseEmptyState.classList.add("hidden");
    trainingTemplateEmptyState.classList.add("hidden");
    trainingOverviewState.classList.add("hidden");
    addExercisesToWorkoutState.classList.add("hidden");
    selectTemplateState.classList.add("hidden");
    workoutState.classList.add("hidden");
    summaryState.classList.add("hidden");
}

// --- Timer --- //

function startTimer(button, bigTimer) {
    appState.activeTimer = true;
    elapsedSeconds = 0;

    bigTimer.textContent = "00:00";
    button.textContent = "Stop set";
    timerStartedAt = Date.now();

    timerIntervalId = setInterval(function () {
        const currentTime = Date.now();
        const elapsedMilliseconds = currentTime - timerStartedAt;

        elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

        bigTimer.textContent = formatTimer(elapsedSeconds);
    }, 250)
}

function stopTimer(exercise, card, button, bigTimer, weightInput) {
    appState.activeTimer = false;
    clearInterval(timerIntervalId);

    saveWorkoutSet(exercise, elapsedSeconds, weightInput.value);

    refreshWorkoutInputRow(exercise, card);
}

function formatTimer(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(seconds).padStart(2, "0");

    return `${formattedMinutes}:${formattedSeconds}`;
}

// --- DOM builders --- //

function createWorkoutExerciseCard(exercise, exerciseIndex) {
    const card = createElement("li", "item-card", "workout-card");
    const dragIcon = createIcon("fa-solid", "fa-grip-vertical", "drag-handle");

    const content = createElement("div", "workout-card-content");
    const body = createWorkoutExerciseCardBody(exercise, exerciseIndex);
    const details = createWorkoutExerciseCardDetails(exercise);
    const inputRow = createWeightInputRow(exercise, card);
    const chevron = body.querySelector(".chevron-button");

    body.addEventListener("click", function () {
        if (appState.activeTimer === true) {
            return;
        }

        const currentDetails = card.querySelector(".workout-card-details");
        const currentInputRow = card.querySelector(".workout-input-row");
        const currentChevron = card.querySelector(".chevron-button");

        rotateChevron(currentChevron);
        changeVisibility(currentDetails);
        changeVisibility(currentInputRow);

        closeAllWorkoutCardsExcept(card);
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

    const recommendation = createRecommendation(exercise);

    headers.append(weightHeader, timerHeader);
    content.append(weightInput, bigTimer);

    if (recommendation !== null) {
        inputRow.append(recommendation);
    }

    inputRow.append(headers, content, button, setContainer);

    return inputRow;
}

function createRecommendation(exercise) {
    const nextSetNumber = exercise.sets.length + 1;
    const ignoredWorkoutId = appState.activeWorkout === null ? null : appState.activeWorkout.id;
    const lastSet = getSetOfLastSession(exercise, nextSetNumber, ignoredWorkoutId);

    if (lastSet === null) {
        return null;
    }

    let recommendationState = null;
    let indicationIconStyle = null;
    let title = null;
    let baseText = null;
    let TULtext = null;
    let endText = null;

    if (lastSet.timeUnderLoad < 50) {
        title = "Decrease weight this workout";
        baseText = "Below ";
        TULtext = "0:50";
        endText = " minimum";
        indicationIconStyle = "fa-arrow-trend-down";
        recommendationState = "bad";
    } else if (lastSet.timeUnderLoad >= 70) {
        title = "Increase weight this workout";
        baseText = "Above ";
        TULtext = "1:10";
        endText = " target";
        indicationIconStyle = "fa-arrow-trend-up";
        recommendationState = "good";
    } else {
        title = "Stick to weight this workout";
        baseText = "Within ";
        TULtext = "0:50 - 1:10";
        endText = " range";
        indicationIconStyle = "fa-arrow-right-arrow-left";
        recommendationState = "same";
    }

    const recommendationContainer = createElement("div", "recommendation-container", recommendationState);
    const infoContainer = createElement("div", "info-container");

    const indicationIcon = createElement("div", "indication-icon");
    const indicationIconSymbol = createIcon("fa-solid", indicationIconStyle, "indication-icon-symbol");

    const titleText = createText(title, "text-field", "info-container-title");

    const lastSessionTextContainer = createElement("div", "last-session-text-container");
    const lastSessionIcon = createIcon("fa-regular", "fa-clock", "recommendation-text-icon");
    const lastSessionStartText = createText("Last session: ", "text-field");
    const lastSessionMidText = createText(formatTimer(lastSet.timeUnderLoad), "text-field", "recommend-highlight");
    const lastSessionEndText = createText(" TUL", "text-field");

    const targetTextContainer = createElement("div", "target-text-container");
    const targetIcon = createIcon("fa-solid", "fa-bullseye", "recommendation-text-icon");
    const targetStartText = createText(baseText, "text-field");
    const targetMidText = createText(TULtext, "text-field", "recommend-highlight");
    const targetEndText = createText(endText, "text-field");

    indicationIcon.append(indicationIconSymbol);
    lastSessionTextContainer.append(lastSessionIcon, lastSessionStartText, lastSessionMidText, lastSessionEndText);
    targetTextContainer.append(targetIcon, targetStartText, targetMidText, targetEndText);
    infoContainer.append(titleText, lastSessionTextContainer, targetTextContainer);
    recommendationContainer.append(indicationIcon, infoContainer);

    return recommendationContainer;
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

    button.addEventListener("click", function () {
        if (isStarted === false && weightInput.value !== "") {
            isStarted = true;
            startTimer(button, bigTimer);
        } else if (isStarted === true) {
            isStarted = false;
            stopTimer(exercise, card, button, bigTimer, weightInput);
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
        exercise.sets.splice(setNumber - 1, 1);

        updateWorkout(appState.activeWorkout);
        renderWorkoutSets(exercise, card);
    });

    minusButton.addEventListener("click", function () {
        if (set.timeUnderLoad > 0) {
            set.timeUnderLoad -= 1;
        }

        updateWorkout(appState.activeWorkout);
        renderWorkoutSets(exercise, card);
    });

    plusButton.addEventListener("click", function () {
        set.timeUnderLoad += 1;

        updateWorkout(appState.activeWorkout);
        renderWorkoutSets(exercise, card);
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
//training-controller.js

// =========================================================
// DOM REFERENCES
// =========================================================

const overviewStartTrainingButton = document.getElementById("choice-start-training");
const overviewFromTemplateButton = document.getElementById("choice-from-template");
const workoutEmptyStateAddExerciseButton = document.getElementById("empty-add-exercise");
const addToWorkoutButton = document.getElementById("add-to-workout");
const finishWorkoutButton = document.getElementById("finish-workout");
const trainingBackButton = document.querySelector("#start-training-screen .back-button");
const trainingPageTitle = document.getElementById("training-page-title");
const trainingPageSubtitle = document.getElementById("training-page-subtitle");
const workoutExerciseList = document.getElementById("workout-exercise-list");
const trainingEmptyState = document.querySelector(".training-empty-state");
const trainingOverviewState = document.querySelector(".training-overview-state");
const addExercisesToWorkoutState = document.querySelector(".training-add-exercises-state");
const selectTemplateState = document.querySelector(".select-template-state");
const workoutState = document.querySelector(".training-workout-state");
const summaryState = document.querySelector(".summary-state");

// --- global variables --- ///
let timerStartedAt = null;
let timerIntervalId = null;

// =========================================================
// EXERCISE CONTROLLER
// =========================================================

// --- Controller entry points --- //

function setupTrainingController() {
    setupOverviewStartTrainingButton();
    setupOverviewFromTemplateButton();
    setupAddExerciseToWorkoutButton();
    setupAddToWorkoutButton();
    setupFinishWorkoutButton();
}

function refreshTrainingScreen(mode = null) {
    if (mode === "workout") {
        showTrainingMode("workout");
        updateTrainingBackButtonVisibility();
        return;
    }

    if (mode === "summary") {
        showTrainingMode("summary");
        updateTrainingBackButtonVisibility();
        return;
    }

    clearWorkoutFormAndLoadPicker();

    if (mode === "empty") {
        showTrainingMode("empty");
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

function setupOverviewStartTrainingButton() {
    overviewStartTrainingButton.addEventListener("click", enterStartEmptyTrainingMode);
}

function setupOverviewFromTemplateButton() {
    overviewFromTemplateButton.addEventListener("click", enterFromTemplateMode);
}

function setupAddExerciseToWorkoutButton() {
    workoutEmptyStateAddExerciseButton.addEventListener("click", createNewExercise);
}

function setupAddToWorkoutButton() {
    addToWorkoutButton.addEventListener("click", function () {
        enterWorkoutState(appState.workoutSelectedExercises);
    });
}

function setupFinishWorkoutButton() {
    finishWorkoutButton.addEventListener("click", enterSummaryMode);
}

// --- Modes --- //

function showTrainingMode(mode) {
    trainingEmptyState.classList.add("hidden");
    trainingOverviewState.classList.add("hidden");
    addExercisesToWorkoutState.classList.add("hidden");
    selectTemplateState.classList.add("hidden");
    workoutState.classList.add("hidden");
    summaryState.classList.add("hidden");

    if (appState.activeWorkout === null) {
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
        } else if (mode === "selectTemplate") {
            updatePageHeader(trainingPageTitle, trainingPageSubtitle, "Start from template", "Select a template for your workout");
            selectTemplateState.classList.remove("hidden");
        } else if (mode === "summary") {
            updatePageHeader(trainingPageTitle, trainingPageSubtitle, "", "");
            summaryState.classList.remove("hidden");
        }
    }

    else {
        updatePageHeader(trainingPageTitle, trainingPageSubtitle, "Active training", "");
        renderWorkoutExerciseList(appState.activeWorkout);
        workoutState.classList.remove("hidden");
    }

    updateTrainingBackButtonVisibility();
}

function enterStartEmptyTrainingMode() {
    clearWorkoutFormAndLoadPicker()

    const exercises = loadExercises();

    if (exercises.length > 0) {
        navigateToScreen("start-training-screen", "addExercises");
    } else {
        navigateToScreen("start-training-screen", "empty");
    }
}

function enterFromTemplateMode() {
    navigateToScreen("start-training-screen", "selectTemplate");
}

function enterAddExercisesToWorkoutMode() {
    navigateToScreen("start-training-screen", "addExercises");
}

function createNewExercise() {
    navigateToScreen("create-exercises-screen", "form");
}

function enterWorkoutState(exercises) {
    const workout = createWorkout(exercises);

    appState.activeWorkout = workout;

    addWorkout(workout);
    renderWorkoutExerciseList(workout);
    navigateToScreen("start-training-screen", "workout");

    const firstWorkoutCard = document.querySelector(".workout-card");

    if (firstWorkoutCard !== null) {
        openWorkoutCard(firstWorkoutCard);
        closeAllWorkoutCardsExcept(firstWorkoutCard);
    }
}

function enterSummaryMode() {
    updateWorkout(appState.activeWorkout);

    appState.activeWorkout = null;

    navigateToScreen("start-training-screen", "summary");
}

// --- Mutate actions --- //

function saveWorkoutSet(exercise, card, elapsedTime, weight) {
    const set = createWorkoutExerciseSet(Number(weight), elapsedTime);

    exercise.sets.push(set);

    updateWorkout(appState.activeWorkout);
    renderWorkoutSets(exercise, card);
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

function updateTrainingBackButtonVisibility() {
    if (trainingBackButton === null) {
        return;
    }

    if (appState.activeWorkout !== null) {
        trainingBackButton.classList.add("invisible");
    } else {
        trainingBackButton.classList.remove("invisible");
    }
}

// --- Rendering --- //

function renderWorkoutTemplateList() {
    const availableTemplateList = document.getElementById("workout-template-list");
    availableTemplateList.innerHTML = "";

    const templates = loadTemplates();

    for (let templateIndex = 0; templateIndex < templates.length; templateIndex++) {
        const templateCard = createTemplateOption(templates[templateIndex]);
        availableTemplateList.appendChild(templateCard);
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

        workoutSetList.appendChild(setRow);
    }
}

// --- Timer --- //

function startTimer(button, bigTimer) {
    appState.activeTimer = true;
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

function stopTimer(exercise, card, button, bigTimer, weight) {
    appState.activeTimer = false;
    clearInterval(timerIntervalId);
    button.textContent = "Start set";

    elapsedTime = elapsedSeconds;

    bigTimer.textContent = "00:00";

    saveWorkoutSet(exercise, card, elapsedTime, weight);
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
        if (appState.activeTimer === false) {
            rotateChevron(chevron);
            changeVisibility(details);
            changeVisibility(inputRow);

            closeAllWorkoutCardsExcept(card);
        }
    });

    content.appendChild(body);

    card.appendChild(dragIcon);
    card.appendChild(content);
    card.appendChild(details);
    card.appendChild(inputRow);

    return card;
}

function createWorkoutExerciseCardBody(exercise, exerciseIndex) {
    const body = createElement("div", "workout-card-body");

    const index = createText(exerciseIndex + 1, "workout-exercise-index");
    const title = createText(exercise.name, "workout-exercise-title");
    const numberOfSets = createText("0 sets", "workout-set-count");
    const chevron = createIconButton("fa-solid", "fa-chevron-right", "chevron-button");

    body.appendChild(index);
    body.appendChild(title);
    body.appendChild(numberOfSets);
    body.appendChild(chevron);

    return body;
}

function createWorkoutExerciseCardDetails(exercise) {
    const details = createElement("div", "workout-card-details", "hidden");
    const settings = createWorkoutExerciseCardSettings(exercise);

    details.appendChild(settings);

    return details;
}

function createWorkoutExerciseCardSettings(exercise) {
    const settings = createElement("div", "workout-card-settings");

    for (let i = 0; i < exercise.settings.length; i++) {
        const setting = exercise.settings[i];
        const settingText = createText(`${setting.name} · ${setting.value}`, "workout-card-setting-pill");
        settings.appendChild(settingText);
    }

    return settings;
}

function createWeightInputRow(exercise, card) {
    const inputRow = createElement("div", "workout-input-row", "hidden");
    const headers = createElement("div", "workout-input-headers");
    const content = createElement("div", "workout-inputs");

    const weightHeader = createText("Weight (kg)", "field-name");
    const timerHeader = createText("Time under load", "field-name");

    const weightInput = createWeightInput();
    const bigTimer = createText("00:00", "workout-big-timer");

    const button = createTimerButton(weightInput, bigTimer, exercise, card);
    const setContainer = createSetContainer();

    headers.appendChild(weightHeader);
    headers.appendChild(timerHeader);

    content.appendChild(weightInput);
    content.appendChild(bigTimer);

    inputRow.appendChild(headers);
    inputRow.appendChild(content);
    inputRow.appendChild(button);
    inputRow.appendChild(setContainer);

    return inputRow;
}

function createWeightInput() {
    const weightInput = createElement("input", "workout-weight-input");
    weightInput.type = "number";
    weightInput.min = "0";
    weightInput.placeholder = "80";

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
            stopTimer(exercise, card, button, bigTimer, weightInput.value);
        }
    });

    return button;
}

function createSetContainer() {
    const setContainer = createElement("div", "workout-sets-block", "hidden");
    const header = createText("Completed sets", "field-name");
    const setList = createElement("div", "workout-sets-list");

    setContainer.appendChild(header);
    setContainer.appendChild(setList);

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
    })

    minusButton.addEventListener("click", function () {
        if (set.timeUnderLoad > 0) {
            set.timeUnderLoad -= 1;
        }

        updateWorkout(appState.activeWorkout);
        renderWorkoutSets(exercise, card);
    })

    plusButton.addEventListener("click", function () {
        set.timeUnderLoad += 1;

        updateWorkout(appState.activeWorkout);
        renderWorkoutSets(exercise, card);
    })

    weightText.appendChild(weightValue);
    weightText.appendChild(weightKg);

    setTimeControl.appendChild(minusButton);
    setTimeControl.appendChild(timeUnderLoadText);
    setTimeControl.appendChild(plusButton);

    setRow.appendChild(deleteButton);
    setRow.appendChild(setNumberText);
    setRow.appendChild(weightText);
    setRow.appendChild(setTimeControl);

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

    iconBadge.appendChild(icon);

    main.appendChild(title);
    main.appendChild(subtitle);

    header.appendChild(iconBadge);
    header.appendChild(main);
    header.appendChild(startButton);

    card.appendChild(header);

    card.addEventListener("click", function () {
        const templateExercises = getExercisesFromTemplate(template);
        enterWorkoutState(templateExercises);
    });

    return card;
}
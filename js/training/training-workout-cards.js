//training-workout-cards.js

//content
const workoutExerciseList = document.getElementById("workout-exercise-list");

let unfoldedWorkoutCardIndex = 0;

// --- Rendering --- //

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

// --- DOM builders --- //

function createWorkoutExerciseCard(exercise, exerciseIndex) {
    const card = createElement("li", "item-card", "workout-card");
    const dragIcon = createIcon("fa-solid", "fa-grip-vertical", "drag-handle");

    const content = createElement("div", "workout-card-content");
    const body = createWorkoutExerciseCardBody(exercise, exerciseIndex);
    const details = createWorkoutExerciseCardDetails(exercise);
    const inputRow = createWeightInputRow(exercise, card);

    body.addEventListener("click", function () {
        showPressFeedback(body);
        openSelectedWorkoutCard(card, exerciseIndex);
    });

    content.append(body);
    card.append(dragIcon, content, details, inputRow);

    renderWorkoutSets(exercise, card);

    return card;
}

function createWorkoutExerciseCardBody(exercise, exerciseIndex) {
    const body = createElement("div", "workout-card-body", "interactive-row");

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
        if (isStarted === false && weightInput.value === "") {
            showPressFeedback(button);
            showInputError(weightInput);
            return;
        }

        if (isStarted === false) {
            if ("vibrate" in navigator) {
                navigator.vibrate(100);
            }

            showPressFeedback(button);
            isStarted = true;
            startSetTimer(setTimer, button, bigTimer);
            return;
        }

        if (isStarted === true) {
            isStarted = false;
            runWithPressFeedback(button, function () {
                stopSetTimer(setTimer, exercise, card, weightInput);
            })
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
        runWithPressFeedback(deleteButton, function () {
            deleteWorkoutSet(setNumber, exercise, card);
        }, 80);
    });

    minusButton.addEventListener("click", function () {
        showPressFeedback(minusButton);
        decreaseSetTimeUnderLoad(set, exercise, card);
    });

    plusButton.addEventListener("click", function () {
        showPressFeedback(plusButton);
        increaseSetTimeUnderLoad(set, exercise, card);
    });

    weightText.append(weightValue, weightKg);
    setTimeControl.append(minusButton, timeUnderLoadText, plusButton);
    setRow.append(deleteButton, setNumberText, weightText, setTimeControl);

    return setRow;
}
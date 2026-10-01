//training-workout-cards.js

//content
const workoutExerciseList = document.getElementById("workout-exercise-list");

let unfoldedWorkoutCardIndex = 0;
let workoutExerciseSortable = null;

// --- Sorting helpers --- //

function setupWorkoutExerciseSorting(workout) {
    if (workout.finishedAt !== null || workout.exercises.length < 2) {
        return;
    }

    workoutExerciseSortable = Sortable.create(workoutExerciseList, {
        animation: 150,
        handle: ".workout-drag-handle",
        forceFallback: true,
        fallbackOnBody: true,
        fallbackTolerance: 0,

        delay: 80,
        delayOnTouchOnly: true,

        onEnd: function (event) {
            const wasMoved = moveArrayItem(
                workout.exercises,
                event.oldIndex,
                event.newIndex
            );

            if (!wasMoved) {
                return;
            }

            updateWorkoutExerciseIndexes();
            updateStoredWorkoutCardIndex();

            updateWorkout(workout).catch(function (error) {
                console.error(
                    "Could not save workout order:",
                    error
                );
            });
        }
    });
}

function updateWorkoutExerciseIndexes() {
    const workoutCards = workoutExerciseList.querySelectorAll(".workout-card");

    for (let cardIndex = 0; cardIndex < workoutCards.length; cardIndex++) {
        const index = workoutCards[cardIndex].querySelector(".workout-exercise-index");

        if (index !== null) {
            index.textContent = cardIndex + 1;
        }
    }
}

function updateStoredWorkoutCardIndex() {
    const workoutCards = workoutExerciseList.querySelectorAll(".workout-card");

    for (let cardIndex = 0; cardIndex < workoutCards.length; cardIndex++) {
        const inputRow = workoutCards[cardIndex].querySelector(".workout-input-row");

        if (inputRow !== null && !inputRow.classList.contains("hidden")) {
            unfoldedWorkoutCardIndex = cardIndex;
            return;
        }
    }
}

// --- Rendering --- //

function renderWorkoutExerciseList(workout) {
    if (workoutExerciseSortable !== null) {
        workoutExerciseSortable.destroy();
        workoutExerciseSortable = null;
    }

    workoutExerciseList.innerHTML = "";

    for (let exerciseIndex = 0; exerciseIndex < workout.exercises.length; exerciseIndex++) {
        const exerciseCard = createWorkoutExerciseCard(workout.exercises[exerciseIndex], exerciseIndex);
        workoutExerciseList.append(exerciseCard);
    }

    setupWorkoutExerciseSorting(workout);
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

    requestAnimationFrame(function () {
        scrollWorkoutCardIntoView(card);
    });
}

function scrollWorkoutCardIntoView(card) {
    const rect = card.getBoundingClientRect();

    const topPadding = 10;
    const bottomPadding = 190;

    const visibleBottom =
        window.innerHeight - bottomPadding;

    if (rect.bottom > visibleBottom) {
        const scrollAmount =
            rect.bottom - visibleBottom;

        window.scrollBy({
            top: scrollAmount,
            behavior: "smooth"
        });

        return;
    }

    if (rect.top < topPadding) {
        window.scrollBy({
            top: rect.top - topPadding,
            behavior: "smooth"
        });
    }
}

function createSetWeightInput(
    weightText,
    set,
    exercise,
    card
) {
    const input = document.createElement("input");

    input.type = "text";
    input.inputMode = "decimal";
    input.value = String(set.weight).replace(".", ",");
    input.classList.add("workout-set-weight-input");

    weightText.replaceWith(input);

    input.focus();
    input.select();

    input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            input.blur();
        }
    });

    input.addEventListener("blur", async function () {
        const newWeight = getNumericWeight(input.value);

        if (newWeight === null) {
            renderWorkoutSets(exercise, card);
            return;
        }

        if (newWeight === set.weight) {
            renderWorkoutSets(exercise, card);
            return;
        }

        set.weight = newWeight;

        renderWorkoutSets(exercise, card);

        try {
            await updateWorkout(appState.activeWorkout);
        } catch (error) {
            console.error(
                "Could not update set weight:",
                error
            );
        }
    });
}

// --- DOM builders --- //

function createWorkoutExerciseCard(exercise, exerciseIndex) {
    const card = createElement("li", "item-card", "workout-card");
    const dragHandle = createElement("span", "workout-drag-handle");
    const dragIcon = createIcon("fa-solid", "fa-grip-vertical");

    dragHandle.append(dragIcon);

    const content = createElement("div", "workout-card-content");
    const body = createWorkoutExerciseCardBody(exercise, exerciseIndex);
    const details = createWorkoutExerciseCardDetails(exercise);
    const inputRow = createWeightInputRow(exercise, card);

    body.addEventListener("click", function () {
        showPressFeedback(body);
        openSelectedWorkoutCard(card, exerciseIndex);
    });

    content.append(body);
    card.append(dragHandle, content, details, inputRow);

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

    const button = createTimerButton(weightInput, bigTimer, exercise, card, timerHeader);
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
    const ignoredWorkoutId =
        appState.activeWorkout === null
            ? null
            : appState.activeWorkout.id;

    const lastSet = getSetOfLastSession(
        exercise,
        nextSetNumber,
        ignoredWorkoutId
    );

    const weightInput = createElement(
        "input",
        "workout-weight-input"
    );

    weightInput.type = "text";
    weightInput.inputMode = "decimal";
    weightInput.placeholder = "-";
    weightInput.autocomplete = "off";

    if (lastSet !== null) {
        weightInput.value = String(lastSet.weight).replace(".", ",");
    }

    weightInput.addEventListener("input", function () {
        let value = weightInput.value;

        value = value.replace(/[^0-9.,]/g, "");

        const separatorIndex = value.search(/[.,]/);

        if (separatorIndex !== -1) {
            const wholePart = value.slice(0, separatorIndex);
            const decimalPart = value.slice(separatorIndex + 1).replace(/[.,]/g, "");

            value = wholePart + value[separatorIndex] + decimalPart;
        }

        weightInput.value = value;
    });

    weightInput.addEventListener("blur", function () {
        const numericWeight = getNumericWeight(weightInput.value);

        if (numericWeight === null) {
            weightInput.value = "";
            return;
        }

        weightInput.value = String(numericWeight).replace(".", ",");
    });

    return weightInput;
}

function getNumericWeight(value) {
    const normalizedValue = value.trim().replace(",", ".");

    if (normalizedValue === "") {
        return null;
    }

    const numericWeight = Number(normalizedValue);

    if (!Number.isFinite(numericWeight) || numericWeight < 0) {
        return null;
    }

    return numericWeight;
}

function createTimerButton(weightInput, bigTimer, exercise, card, timerHeader) {
    const button = createButton("button-large");
    button.textContent = "Start set";
    button.classList.remove("cancel-state");

    const setTimer = createSetTimerState();

    button.addEventListener("click", function () {
        if (setTimer.currentState === TIMER_STATES.IDLE) {
            if (weightInput.value === "") {
                showPressFeedback(button);
                showInputError(weightInput);
                return;
            }

            showPressFeedback(button);
            startCountdownTimer(setTimer, button, bigTimer, 250, timerHeader);
            return;
        }

        if (setTimer.currentState === TIMER_STATES.COUNTDOWN) {
            showPressFeedback(button);
            stopCountdownTimer(setTimer, button, bigTimer, timerHeader);
            return;
        }

        if (setTimer.currentState === TIMER_STATES.RUNNING) {
            runWithPressFeedback(button, function () {
                return stopSetTimer(setTimer, exercise, card, weightInput);
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
    const weightValue = createText(set.weight, "workout-set-value", "editable-set-weight");
    const weightKg = createText("kg", "workout-set-muted");
    const timeUnderLoadText = createText(formatTimer(set.timeUnderLoad), "workout-set-value");
    const plusButton = createIconButton("fa-solid", "fa-plus", "workout-set-action-button");
    const minusButton = createIconButton("fa-solid", "fa-minus", "workout-set-action-button");

    weightValue.addEventListener("click", function () {
        createSetWeightInput(
            weightValue,
            set,
            exercise,
            card
        );
    });

    deleteButton.addEventListener("click", function () {
        runWithPressFeedback(deleteButton, function () {
            return deleteWorkoutSet(setNumber, exercise, card);
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
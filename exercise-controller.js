//exercise-controller.js

// =========================================================
// DOM REFERENCES
// =========================================================

const exerciseNameInput = document.getElementById("exercise-name-input");
const emptyCreateExerciseButton = document.getElementById("empty-create-exercise");
const overviewCreateExerciseButton = document.getElementById("overview-create-exercise");
const saveExerciseButton = document.getElementById("save-exercise");
const exerciseList = document.getElementById("exercise-list");
const addSetting = document.getElementById("add-setting");
const settingsContainer = document.getElementById("settings-container");
const exercisesEmptyState = document.querySelector(".exercises-empty-state");
const exercisesFormState = document.querySelector(".exercises-form-state");
const exercisesOverviewState = document.querySelector(".exercises-overview-state");

// =========================================================
// EXERCISE CONTROLLER
// =========================================================

// --- Controller entry points --- //

function setupExerciseController() {
    setupExerciseCreateButtons();
    setupExerciseForm();
    setupSettingsForm();
}

function refreshExerciseScreen(mode = null) {
    if (mode === "form") {
        enterCreateExerciseMode();
        return;
    }

    resetExerciseFormAndShowOverview();
}

// --- Setup --- //

function setupExerciseCreateButtons() {
    navigateOnClick(overviewCreateExerciseButton, "create-exercises-screen", "form");
    navigateOnClick(emptyCreateExerciseButton, "create-exercises-screen", "form");
}

function setupExerciseForm() {
    clearErrorWhenTyping(exerciseNameInput);

    saveExerciseButton.addEventListener("click", saveExerciseFromForm);
}

function setupSettingsForm() {
    addSetting.addEventListener("click", function () {
        const settingsRows = settingsContainer.querySelectorAll(".settings-row");

        if (settingsRows.length >= 3) {
            return;
        }

        const settingIndex = settingsRows.length + 1;
        const settingsRow = createSettingRow(settingIndex);

        settingsContainer.append(settingsRow);
        updateSettingsRowsVisibility();
    });
}

// --- Modes --- //

function showExerciseMode(mode) {
    exercisesEmptyState.classList.add("hidden");
    exercisesFormState.classList.add("hidden");
    exercisesOverviewState.classList.add("hidden");

    if (mode === "empty") {
        exercisesEmptyState.classList.remove("hidden");
    } else if (mode === "overview") {
        exercisesOverviewState.classList.remove("hidden");
    } else if (mode === "form") {
        exercisesFormState.classList.remove("hidden");
    }
}

function enterCreateExerciseMode() {
    appState.editingExerciseId = null;

    clearExerciseForm();
    updateSettingsRowsVisibility();
    updateSaveExerciseButtonText();

    showExerciseMode("form");
}

function enterEditExerciseMode(exercise) {
    appState.editingExerciseId = exercise.id;

    clearExerciseForm();
    showExerciseMode("form");

    exerciseNameInput.value = exercise.name;

    for (let settingIndex = 0; settingIndex < exercise.settings.length; settingIndex++) {
        const setting = exercise.settings[settingIndex];
        const settingsRow = createSettingRow(settingIndex + 1);

        const settingNameInput = settingsRow.querySelector(".setting-name");
        settingNameInput.value = setting.name;

        const settingValueInput = settingsRow.querySelector(".setting-value");
        settingValueInput.value = setting.value;

        settingsContainer.append(settingsRow);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    updateSettingsRowsVisibility();
    updateSaveExerciseButtonText();
}

function resetExerciseFormAndShowOverview() {
    appState.editingExerciseId = null;

    updateSaveExerciseButtonText();
    clearExerciseForm();
    updateSettingsRowsVisibility();

    renderExerciseOverview();
}

// --- Mutate actions --- //

function saveExerciseFromForm() {
    const exercises = loadExercises();
    const exerciseName = exerciseNameInput.value.trim();
    const settings = readSettingsFromPage();

    if (settings === null) {
        return;
    }

    if (!exerciseFormIsValid(exerciseName, exercises)) {
        return;
    }

    const exerciseWasSaved = saveExerciseToList(exercises, exerciseName);

    if (!exerciseWasSaved) {
        return;
    }

    saveExercises(exercises);
    resetExerciseFormAndShowOverview();
}

function saveExerciseToList(exercises, exerciseName, settings) {
    if (appState.editingExerciseId === null) {
        const exercise = createExercise(exerciseName, settings);
        exercises.push(exercise);
        return true;
    }

    const exerciseIndex = exercises.findIndex(function (exercise) {
        return exercise.id === appState.editingExerciseId;
    });

    if (exerciseIndex === -1) {
        return false;
    }

    const existingExercise = exercises[exerciseIndex];

    exercises[exerciseIndex] = {
        ...existingExercise,
        name: exerciseName,
        settings: settings
    };

    return true;
}

function deleteExercise(exerciseId) {
    const exercises = loadExercises();

    const updatedExercises = exercises.filter(function (exercise) {
        return exercise.id !== exerciseId;
    });

    saveExercises(updatedExercises);
    removeExerciseFromTemplates(exerciseId);

    renderExerciseOverview();
}

// --- Form helpers --- //

function readSettingsFromPage() {
    const settingsRows = settingsContainer.querySelectorAll(".settings-row");
    const settings = [];
    let settingsAreValid = true;

    for (let i = 0; i < settingsRows.length; i++) {
        const row = settingsRows[i];

        const nameInput = row.querySelector(".setting-name");
        const valueInput = row.querySelector(".setting-value");

        const name = nameInput.value.trim();
        const value = valueInput.value.trim();

        if (name === "") {
            showInputError(nameInput);
            settingsAreValid = false;
        } else {
            clearInputError(nameInput);
        }

        if (value === "") {
            showInputError(valueInput);
            settingsAreValid = false;
        } else {
            clearInputError(valueInput);
        }

        settings.push({
            name: name,
            value: value
        });
    }

    if (!settingsAreValid) {
        return null;
    }

    return settings;
}

function clearExerciseForm() {
    exerciseNameInput.value = "";
    settingsContainer.innerHTML = "";
}

function updateSaveExerciseButtonText() {
    if (appState.editingExerciseId !== null) {
        saveExerciseButton.textContent = "Update exercise";
    } else {
        saveExerciseButton.textContent = "Save exercise";
    }
}

function updateSettingsRowsVisibility() {
    const settingsRows = settingsContainer.querySelectorAll(".settings-row");

    if (settingsRows.length > 0) {
        settingsContainer.classList.remove("hidden");
    } else {
        settingsContainer.classList.add("hidden");
    }
}

function exerciseFormIsValid(exerciseName, exercises, settings) {
    let formIsValid = true;

    if (exerciseName === "") {
        showInputError(exerciseNameInput);
        formIsValid = false;
    } else if (nameExistsInListExceptId(exercises, exerciseName, appState.editingExerciseId)) {
        showInputError(exerciseNameInput);
        formIsValid = false;
    } else {
        clearInputError(exerciseNameInput);
    }

    return formIsValid;
}

// --- Rendering --- //

function renderExerciseOverview() {
    const exercises = loadExercises();

    renderExerciseList(exercises);

    if (exercises.length === 0) {
        showExerciseMode("empty");
    } else {
        showExerciseMode("overview");
    }
}

function renderExerciseList(exercises) {
    exerciseList.innerHTML = "";

    for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
        const exercise = exercises[exerciseIndex];
        const exerciseCard = createExerciseCard(exercise);

        exerciseList.append(exerciseCard);
    }
}

// --- DOM builders --- //

function createSettingRow(settingIndex) {
    const settingsRow = createElement("div", "settings-row");
    const topRow = createElement("div", "setting-top-row");
    const settingIndexCounter = createText(settingIndex, "setting-index");
    const settingsHeader = createText("Machine setting", "item-text");
    const settingNameLabel = createText("Setting name", "field-name");
    const settingNameInput = createTextInput("Name...", "setting-name");
    const settingValueLabel = createText("Value", "field-name");
    const settingValueInput = createTextInput("Setting value...", "setting-value");

    clearErrorWhenTyping(settingNameInput);
    clearErrorWhenTyping(settingValueInput);

    const deleteButton = createIconButton("fa-regular", "fa-trash-can", "icon-button");
    deleteButton.addEventListener("click", function () {
        settingsRow.remove();
        updateSettingsRowsVisibility();
    });

    topRow.append(settingIndexCounter, settingsHeader, deleteButton);
    settingsRow.append(topRow, settingNameLabel, settingNameInput, settingValueLabel, settingValueInput);

    return settingsRow;
}

function createExerciseCard(exercise) {
    const card = createElement("li", "item-card");
    const header = createExerciseCardHeader(exercise);
    const details = createExerciseCardDetails(exercise);
    const actions = createExerciseCardActions(exercise);

    const chevron = header.querySelector(".chevron-button");
    header.addEventListener("click", function () {
        rotateChevron(chevron);
        changeVisibility(details);
    });

    details.append(actions);
    card.append(header, details);

    return card;
}

function createExerciseCardHeader(exercise) {
    const header = createElement("div", "card-header");

    const iconBadge = createElement("span", "icon-badge");
    const icon = createIcon("fa-solid", "fa-dumbbell", "item-icon");

    const main = createExerciseCardMain(exercise);
    const chevron = createIconButton("fa-solid", "fa-chevron-right", "chevron-button");

    iconBadge.append(icon);
    header.append(iconBadge, main, chevron);

    return header;
}

function createExerciseCardMain(exercise) {
    const main = createElement("div", "item-text");

    const title = createText(exercise.name, "item-title");

    const settingCount = exercise.settings.length;
    const subtitleText = formatCountLabel(settingCount, "machine setting");
    const subtitle = createText(subtitleText, "item-subtitle");

    main.append(title, subtitle);

    return main;
}

function createExerciseCardDetails(exercise) {
    const details = createElement("div", "card-details");
    details.classList.add("hidden");

    for (let settingIndex = 0; settingIndex < exercise.settings.length; settingIndex++) {
        const setting = exercise.settings[settingIndex];
        const settingRow = createSavedExerciseSettingRow(setting);
        details.append(settingRow);
    }

    return details;
}

function createSavedExerciseSettingRow(setting) {
    const settingRow = createElement("div", "card-row");
    const settingName = createText(setting.name, "setting-name");
    const settingValue = createText(setting.value, "setting-value");

    settingRow.append(settingName, settingValue);

    return settingRow;
}

function createExerciseCardActions(exercise) {
    const actions = createElement("div", "card-actions");
    const editButton = createActionButton("fa-solid", "fa-pencil", "Edit");

    editButton.addEventListener("click", function () {
        enterEditExerciseMode(exercise);
    });

    const deleteButton = createActionButton("fa-regular", "fa-trash-can", "Delete");
    deleteButton.addEventListener("click", function () {
        deleteExercise(exercise.id);
    });

    actions.append(editButton, deleteButton);

    return actions;
}
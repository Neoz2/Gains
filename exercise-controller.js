// =========================================================
// DOM REFERENCES
// =========================================================

const exerciseNameInput = document.getElementById("exercise-name-input");
const emptyCreateExerciseButton = document.getElementById("empty-create-exercise");
const saveExerciseButton = document.getElementById("save-exercise");
const exerciseList = document.getElementById("exercise-list");
const addSetting = document.getElementById("add-setting");
const settingsContainer = document.getElementById("settings-container");
const exercisesEmptyState = document.querySelector(".exercises-empty-state");
const exercisesFormState = document.querySelector(".exercises-form-state");

// =========================================================
// EXERCISE CONTROLLER
// =========================================================

// --- Controller entry points --- //

function setupExerciseController() {
	setupExerciseForm();
	setupSettingsForm();
}

function refreshExerciseScreen() {
	appState.editingExerciseId = null;
	clearExerciseForm();
	updateSaveExerciseButtonText();
	updateSettingsRowsVisibility();
	renderExerciseScreen();
}

// --- Setup --- //

function setupExerciseForm() {
	emptyCreateExerciseButton.addEventListener("click", enterCreateExerciseMode);

	clearErrorWhenTyping(exerciseNameInput);

	saveExerciseButton.addEventListener("click", saveExerciseFromForm);
}

function setupSettingsForm() {
	addSetting.addEventListener("click", function () {
		const settingsRows = settingsContainer.querySelectorAll(".settings-row");

		if (settingsRows.length >= 3) {
			return;
		}

		const settingsRow = createSettingRow();

		settingsContainer.appendChild(settingsRow);
		updateSettingsRowsVisibility();
	});
}

// --- Modes --- //

function showExerciseMode(mode) {
	exercisesEmptyState.classList.add("hidden");
	exercisesFormState.classList.add("hidden");

	if (mode === "empty") {
		exercisesEmptyState.classList.remove("hidden");
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

	exerciseNameInput.value = exercise.name;

	for (let settingIndex = 0; settingIndex < exercise.settings.length; settingIndex++) {
		const setting = exercise.settings[settingIndex];
		const settingsRow = createSettingRow();

		const settingNameInput = settingsRow.querySelector(".setting-name");
		settingNameInput.value = setting.name;
		const settingValueInput = settingsRow.querySelector(".setting-value");
		settingValueInput.value = setting.value;

		settingsContainer.appendChild(settingsRow);

	}
	window.scrollTo({ top: 0, behavior: "smooth" });
	updateSettingsRowsVisibility();
	updateSaveExerciseButtonText();
}

function exitEditExerciseMode() {
	appState.editingExerciseId = null;
	updateSaveExerciseButtonText();
	clearExerciseForm();
	updateSettingsRowsVisibility();
}

// --- Mutate actions --- //

function saveExerciseFromForm() {
	const exercises = loadExercises();
	const exerciseName = exerciseNameInput.value.trim();

	let formIsValid = true;

	if (exerciseName === "") {
		showInputError(exerciseNameInput);
		formIsValid = false;
	} else if (nameExistsInList(exercises, exerciseName) && appState.editingExerciseId === null) {
		showInputError(exerciseNameInput);
		formIsValid = false;
	} else {
		clearInputError(exerciseNameInput);
	}

	const settings = readSettingsFromPage();

	if (settings === null) {
		formIsValid = false;
	}

	if (!formIsValid) {
		return;
	}

	if (appState.editingExerciseId === null) {
		const exercise = createExercise(exerciseName, settings);
		exercises.push(exercise);
	} else {
		const exerciseIndex = exercises.findIndex(function (exercise) {
			return exercise.id === appState.editingExerciseId;
		});

		if (exerciseIndex === -1) {
			return;
		}

		exercises[exerciseIndex] = {
			id: appState.editingExerciseId,
			name: exerciseName,
			settings: settings
		};
	}

	saveExercises(exercises);
	exitEditExerciseMode();
	renderExerciseScreen();
}

function deleteExercise(exercises, exerciseIndex) {
	const deletedExerciseId = exercises[exerciseIndex].id;

	exercises.splice(exerciseIndex, 1);
	saveExercises(exercises);
	renderExerciseScreen();

	removeExerciseFromTemplates(deletedExerciseId);
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
		saveExerciseButton.textContent = "Update exercise"
	} else {
		saveExerciseButton.textContent = "Save exercise"
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

// --- Rendering --- //

function renderExerciseScreen() {
	const exercises = loadExercises();

	renderExerciseList(exercises);
	updateExerciseScreenVisibility(exercises);
}

function renderExerciseList(exercises) {
	exerciseList.innerHTML = "";

	for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
		const exerciseCard = createExerciseCard(exercises, exerciseIndex);
		exerciseList.appendChild(exerciseCard);
	}
}

function updateExerciseScreenVisibility(exercises) {
	if (exercises.length === 0) {
		showExerciseMode("empty");
	} else {
		showExerciseMode("form");
	}
}

// --- DOM builders --- //

function createSettingRow() {
	const settingsRow = createElement("div", "settings-row");
	const settingNameDeleteRow = createElement("div", "setting-delete-button-row");
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

	settingNameDeleteRow.appendChild(settingNameLabel);
	settingNameDeleteRow.appendChild(deleteButton);

	settingsRow.appendChild(settingNameDeleteRow);
	settingsRow.appendChild(settingNameInput);
	settingsRow.appendChild(settingValueLabel);
	settingsRow.appendChild(settingValueInput);

	return settingsRow;
}

function createExerciseCard(exercises, exerciseIndex) {
	const exercise = exercises[exerciseIndex];

	const card = createElement("li", "exercise-card");
	const header = createExerciseCardHeader(exercise);
	const details = createExerciseCardDetails(exercise);
	const actions = createExerciseCardActions(exercises, exerciseIndex);

	const chevron = header.querySelector(".chevron-button");
	header.addEventListener("click", function () {
		rotateChevron(chevron);
		changeVisibility(details);
	});

	details.appendChild(actions);

	card.appendChild(header);
	card.appendChild(details);

	return card;
}

function createExerciseCardHeader(exercise) {
	const header = createElement("div", "exercise-card-header");
	const icon = createIcon("fa-solid", "fa-dumbbell", "exercise-card-icon");
	const main = createExerciseCardMain(exercise);
	const chevron = createIconButton("fa-solid", "fa-chevron-right", "chevron-button");

	header.appendChild(icon);
	header.appendChild(main);
	header.appendChild(chevron);

	return header;
}

function createExerciseCardMain(exercise) {
	const main = createElement("div", "exercise-card-main");
	const title = createText(exercise.name, "exercise-card-title");

	const settingCount = exercise.settings.length;
	const pluralAdjuster = settingCount === 1 ? "" : "s";
	const subtitleText = `${settingCount} machine setting${pluralAdjuster}`;
	const subtitle = createText(subtitleText, "exercise-card-subtitle");

	main.appendChild(title);
	main.appendChild(subtitle);

	return main;
}

function createExerciseCardDetails(exercise) {
	const details = createElement("div", "exercise-card-details");
	details.classList.add("hidden");

	for (let settingIndex = 0; settingIndex < exercise.settings.length; settingIndex++) {
		const setting = exercise.settings[settingIndex];
		const settingRow = createSavedExerciseSettingRow(setting);
		details.appendChild(settingRow);
	}

	return details;
}

function createSavedExerciseSettingRow(setting) {
	const settingRow = createElement("div", "exercise-setting-row");
	const settingName = createText(setting.name, "setting-name");
	const settingValue = createText(setting.value, "setting-value");

	settingRow.appendChild(settingName);
	settingRow.appendChild(settingValue);

	return settingRow;
}

function createExerciseCardActions(exercises, exerciseIndex) {
	const actions = createElement("div", "exercise-card-actions");
	const editButton = createActionButton("fa-solid", "fa-pencil", "Edit");

	editButton.addEventListener("click", function () {
		enterEditExerciseMode(exercises[exerciseIndex]);
	});

	const deleteButton = createActionButton("fa-regular", "fa-trash-can", "Delete");
	deleteButton.addEventListener("click", function () {
		deleteExercise(exercises, exerciseIndex);
	});

	actions.appendChild(editButton);
	actions.appendChild(deleteButton);

	return actions;
}
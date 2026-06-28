// =========================================================
// CONSTANTS + DOM REFERENCES
// =========================================================

const STORAGE_KEYS = {
	exercises: "gym-app-exercises",
	templates: "gym-app-templates",
	workouts: "gym-app-workouts"
}

const exerciseNameInput = document.getElementById("exercise-name-input");
const templateNameInput = document.getElementById("template-name-input");
const saveExerciseButton = document.getElementById("save-exercise");
const saveTemplateButton = document.getElementById("save-template");
const exerciseList = document.getElementById("exercise-list");
const selectedExercises = [];
const unselectedExercises = [];
const addSetting = document.getElementById("add-setting");
const settingsContainer = document.getElementById("settings-container");

const navButtons = document.querySelectorAll(".nav-button");
const goBackButtons = document.querySelectorAll(".back-button");

const exercisesEmptyState = document.querySelector(".exercises-empty-state");
const exercisesDataState = document.querySelector(".exercises-data-state");
const templatesEmptyState = document.querySelector(".templates-empty-state");
const templatesDataState = document.querySelector(".templates-data-state");

let editingExerciseId = null;
let editingTemplateId = null;

const ROUTES = {
	"home-screen": "#home",
	"start-training-screen": "#start-training",
	"create-exercises-screen": "#create-exercises",
	"create-templates-screen": "#create-templates",
	"analyse-progress-screen": "#analyse-progress"
};


// =========================================================
// APP STARTUP
// =========================================================

setupNavigation();
setupExerciseForm();
setupSettingsForm();

const exercises = loadExercises();
renderExerciseList(exercises);
setupTemplatesForm(exercises);
setupTemplateSaveButton();
updateExerciseScreenVisibility(exercises);

history.replaceState({ screenId: "home-screen" }, "", "#home");
showScreen("home-screen");


// =========================================================
// NAVIGATION SETUP
// =========================================================

function setupNavigation() {
	for (let i = 0; i < navButtons.length; i++) {
		navButtons[i].addEventListener("click", function () {
			const screenId = navButtons[i].dataset.screen;
			navigateToScreen(screenId);
		});
	}

	for (let i = 0; i < goBackButtons.length; i++) {
		goBackButtons[i].addEventListener("click", function () {
			history.back();
		});
	}

	window.addEventListener("popstate", function (event) {
		if (event.state && event.state.screenId) {
			showScreen(event.state.screenId);
			refreshScreen(event.state.screenId);
		} else {
			showScreen("home-screen");
			refreshScreen("home-screen");
		}
	});
}


// =========================================================
// NAVIGATION FUNCTIONS
// =========================================================

function navigateToScreen(screenId) {
	showScreen(screenId);

	const route = ROUTES[screenId];

	if (route) {
		history.pushState({ screenId: screenId }, "", route);
	}

	refreshScreen(screenId);
}

function showScreen(screenId) {
	hideAllScreens();
	showSelectedScreen(screenId);
	updateSelectedNavButton(screenId);
}

function hideAllScreens() {
	const screens = document.querySelectorAll("section");

	for (let i = 0; i < screens.length; i++) {
		screens[i].classList.add("hidden");
	}
}

function showSelectedScreen(screenId) {
	const screen = document.getElementById(screenId);

	if (screen === null) {
		console.log("Screen not found:", screenId);
		return;
	}

	screen.classList.remove("hidden");
}

function refreshScreen(screenId) {
	if (screenId === "create-exercises-screen") {
		const exercises = loadExercises();

		renderExerciseList(exercises);
		updateExerciseScreenVisibility(exercises);
	} else if (screenId === "create-templates-screen") {
		const exercises = loadExercises();

		setupTemplatesForm(exercises);
	}
}

function updateSelectedNavButton(screenId) {
	const bottomNavButtons = document.querySelectorAll(".bottom-nav-item");

	for (let i = 0; i < bottomNavButtons.length; i++) {
		if (screenId === bottomNavButtons[i].dataset.screen) {
			bottomNavButtons[i].classList.add("selected");
		} else {
			bottomNavButtons[i].classList.remove("selected");
		}
	}
}

// =========================================================
// DATABASE FUNCTIONS
// =========================================================

function loadItems(storageKey) {
	const savedItems = localStorage.getItem(storageKey);

	if (savedItems === null) {
		return [];
	}

	const items = JSON.parse(savedItems);

	if (!Array.isArray(items)) {
		return [];
	}

	return items;
}

function saveItems(storageKey, items) {
	const json = JSON.stringify(items);
	localStorage.setItem(storageKey, json);
}


// =========================================================
// EXERCISE FORM SETUP
// =========================================================

function setupExerciseForm() {
	const showExerciseFormButton = document.getElementById("create-exercise");

	showExerciseFormButton.addEventListener("click", function () {
		exercisesEmptyState.classList.add("hidden");
		exercisesDataState.classList.remove("hidden");
	});

	clearErrorWhenTyping(exerciseNameInput);

	saveExerciseButton.addEventListener("click", function () {
		const exercises = loadExercises();
		const exerciseName = exerciseNameInput.value.trim();

		let formIsValid = true;

		if (exerciseName === "") {
			showInputError(exerciseNameInput);
			formIsValid = false;
		} else if (nameExistsInList(exercises, exerciseName) && editingExerciseId === null) {
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

		if (editingExerciseId === null) {
			const exercise = createExercise(exerciseName, settings);
			exercises.push(exercise);
		} else {
			const exerciseIndex = exercises.findIndex(function (exercise) {
				return exercise.id === editingExerciseId;
			});

			if (exerciseIndex === -1) {
				return;
			}

			exercises[exerciseIndex] = {
				id: editingExerciseId,
				name: exerciseName,
				settings: settings
			};
		}
		updateExercises(exercises);
		exitEditExerciseMode();

		clearExerciseForm();
		updateSettingsRowsVisibility();
	});
}

// =========================================================
// DATA / STORAGE
// =========================================================

function createExercise(name, settings) {
	return {
		id: crypto.randomUUID(),
		name: name,
		settings: settings
	};
}

function createTemplate(name, selectedExercises) {
	const exerciseIds = [];

	for (let exerciseIndex = 0; exerciseIndex < selectedExercises.length; exerciseIndex++) {
		exerciseIds.push(selectedExercises[exerciseIndex].id);
	}

	return {
		id: crypto.randomUUID(),
		name: name,
		exerciseIds: exerciseIds
	};
}

function loadStorageItems(storageKey) {
	return loadItems(storageKey);
}

function saveStorageItems(storageKey, items) {
	saveItems(storageKey, items);
}

function loadExercises() {
	return loadStorageItems(STORAGE_KEYS.exercises);
}

function saveExercises(exercises) {
	saveStorageItems(STORAGE_KEYS.exercises, exercises);
}

function updateExercises(exercises) {
	saveExercises(exercises);
	renderExerciseList(exercises);
	updateExerciseScreenVisibility(exercises);
}

function loadTemplates() {
	return loadStorageItems(STORAGE_KEYS.templates);
}

function saveTemplates(templates) {
	saveStorageItems(STORAGE_KEYS.templates, templates);
}

function updateTemplates(templates) {
	saveTemplates(templates);
}

// =========================================================
// EXERCISE RENDERING
// =========================================================

function renderExerciseList(exercises) {
	exerciseList.innerHTML = "";

	for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
		const exerciseCard = createExerciseCard(exercises, exerciseIndex);
		exerciseList.appendChild(exerciseCard);
	}
}


// =========================================================
// SETTINGS FORM SETUP
// =========================================================

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


// =========================================================
// SETTINGS FORM FUNCTIONS
// =========================================================

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

function updateSettingsRowsVisibility() {
	const settingsRows = settingsContainer.querySelectorAll(".settings-row");

	if (settingsRows.length > 0) {
		settingsContainer.classList.remove("hidden");
	} else {
		settingsContainer.classList.add("hidden");
	}
}


// =========================================================
// DOM BUILDERS: SETTINGS FORM
// =========================================================

function createSettingRow() {
	const settingsRow = document.createElement("div");
	settingsRow.classList.add("settings-row");

	const settingNameDeleteRow = document.createElement("div");
	settingNameDeleteRow.classList.add("setting-delete-button-row");

	const settingNameLabel = createText("Setting name", "field-name");
	const settingNameInput = createTextInput("Name...", "setting-name");

	const settingValueLabel = createText("Value", "field-name");
	const settingValueInput = createTextInput("Setting value...", "setting-value");

	clearErrorWhenTyping(settingNameInput);
	clearErrorWhenTyping(settingValueInput);

	const deleteButton = createIconButton("icon-button", "fa-regular", "fa-trash-can");
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


// =========================================================
// DOM BUILDERS: EXERCISE CARDS
// =========================================================

function createExerciseCard(exercises, exerciseIndex) {
	const exercise = exercises[exerciseIndex];

	const card = document.createElement("li");
	card.classList.add("exercise-card");

	const header = createExerciseCardHeader(exercise);
	const details = createExerciseCardDetails(exercise);
	const actions = createExerciseCardActions(exercises, exerciseIndex);

	details.appendChild(actions);

	const chevron = header.querySelector(".chevron-button");
	header.addEventListener("click", function () {
		rotateChevron(chevron);
		changeVisibility(details);
	});

	card.appendChild(header);
	card.appendChild(details);

	return card;
}

function createExerciseCardHeader(exercise) {
	const header = document.createElement("div");
	header.classList.add("exercise-card-header");

	const icon = createIcon("exercise-card-icon", "fa-solid", "fa-dumbbell");
	const main = createExerciseCardMain(exercise);
	const chevron = createIconButton("chevron-button", "fa-solid", "fa-chevron-right");

	header.appendChild(icon);
	header.appendChild(main);
	header.appendChild(chevron);

	return header;
}

function createExerciseCardMain(exercise) {
	const main = document.createElement("div");
	main.classList.add("exercise-card-main");

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
	const details = document.createElement("div");
	details.classList.add("exercise-card-details");
	details.classList.add("hidden");

	for (let settingIndex = 0; settingIndex < exercise.settings.length; settingIndex++) {
		const setting = exercise.settings[settingIndex];

		const settingRow = createExerciseSettingRow(setting);
		details.appendChild(settingRow);
	}

	return details;
}

function createExerciseSettingRow(setting) {
	const settingRow = document.createElement("div");
	settingRow.classList.add("exercise-setting-row");

	const settingName = createText(setting.name, "setting-name");
	const settingValue = createText(setting.value, "setting-value");

	settingRow.appendChild(settingName);
	settingRow.appendChild(settingValue);

	return settingRow;
}

function createExerciseCardActions(exercises, exerciseIndex) {
	const actions = document.createElement("div");
	actions.classList.add("exercise-card-actions");

	const editButton = createActionButton("fa-solid", "fa-pencil", "Edit");
	editButton.addEventListener("click", function () {
		enterEditExerciseMode(exercises[exerciseIndex]);
	});

	const deleteButton = createActionButton("fa-regular", "fa-trash-can", "Delete");
	deleteButton.addEventListener("click", function () {
		exercises.splice(exerciseIndex, 1);
		updateExercises(exercises);
	});

	actions.appendChild(editButton);
	actions.appendChild(deleteButton);

	return actions;
}

function updateSaveExerciseButtonText() {
	if (editingExerciseId !== null) {
		saveExerciseButton.textContent = "Update exercise"
	} else {
		saveExerciseButton.textContent = "Save exercise"
	}
}

function enterEditExerciseMode(exercise) {
	editingExerciseId = exercise.id;

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
	editingExerciseId = null;
	updateSaveExerciseButtonText();
	clearExerciseForm();
	updateSettingsRowsVisibility();
}

function updateExerciseScreenVisibility(exercises) {
	if (exercises.length === 0) {
		exercisesEmptyState.classList.remove("hidden");
		exercisesDataState.classList.add("hidden");
	} else {
		exercisesEmptyState.classList.add("hidden");
		exercisesDataState.classList.remove("hidden");
	}
}

// =========================================================
// TEMPLATES SETUP
// =========================================================

function setupTemplatesForm(exercises) {
	selectedExercises.length = 0;
	unselectedExercises.length = 0;

	for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
		unselectedExercises.push(exercises[exerciseIndex]);
	}

	renderTemplateExerciseLists();
}

function setupTemplateSaveButton() {
	clearErrorWhenTyping(templateNameInput);

	saveTemplateButton.addEventListener("click", function () {
		const templates = loadTemplates();
		const templateName = templateNameInput.value.trim();

		let formIsValid = true;

		if (templateName === "") {
			showInputError(templateNameInput);
			formIsValid = false;
		} else if (nameExistsInList(templates, templateName) && editingTemplateId === null) {
			showInputError(templateNameInput);
			formIsValid = false;
		} else {
			clearInputError(templateNameInput);
		}

		if (selectedExercises.length === 0) {
			formIsValid = false;
			console.log("Select at least one exercise");
		}

		if (!formIsValid) {
			return;
		}

		const template = createTemplate(templateName, selectedExercises);

		templates.push(template);
		updateTemplates(templates);

		clearTemplateForm();

		console.log("Template saved:", template);
	});
}

function renderTemplateExerciseLists() {
	renderSelectedExercises();
	renderAvailableExercises();
}

function renderAvailableExercises() {
	const availableExercisesList = document.querySelector(".template-unselected-items");

	availableExercisesList.innerHTML = "";

	for (let exerciseIndex = 0; exerciseIndex < unselectedExercises.length; exerciseIndex++) {
		const exercise = unselectedExercises[exerciseIndex];

		const row = createTemplateExerciseRow(exercise, false);

		row.addEventListener("click", function () {
			selectTemplateExercise(exercise);
		});

		availableExercisesList.appendChild(row);
	}
}

function renderSelectedExercises() {
	const selectedExercisesList = document.querySelector(".template-selected-items");

	selectedExercisesList.innerHTML = "";

	for (let exerciseIndex = 0; exerciseIndex < selectedExercises.length; exerciseIndex++) {
		const exercise = selectedExercises[exerciseIndex];

		const row = createTemplateExerciseRow(exercise, true);

		row.addEventListener("click", function () {
			unselectTemplateExercise(exercise);
		});

		selectedExercisesList.appendChild(row);
	}
}

function createTemplateExerciseRow(exercise, isSelected) {
	const row = document.createElement("button");
	row.type = "button";


	if (isSelected) {
		row.classList.add("selected-exercise-row");

		const barsIcon = document.createElement("i");
		barsIcon.classList.add("fa-solid", "fa-bars");
		row.appendChild(barsIcon);
	} else {
		row.classList.add("available-exercise-row");
	}

	const exerciseName = document.createElement("span");
	exerciseName.textContent = exercise.name;

	const checkIcon = document.createElement("i");

	if (isSelected) {
		checkIcon.classList.add("fa-solid", "fa-circle-check");
	} else {
		checkIcon.classList.add("fa-regular", "fa-circle");
	}

	row.appendChild(exerciseName);
	row.appendChild(checkIcon);

	return row;
}

function selectTemplateExercise(exercise) {
	removeExerciseFromArray(unselectedExercises, exercise);
	addExerciseToArray(selectedExercises, exercise);

	renderTemplateExerciseLists();
}

function unselectTemplateExercise(exercise) {
	removeExerciseFromArray(selectedExercises, exercise);
	addExerciseToArray(unselectedExercises, exercise);

	renderTemplateExerciseLists();
}

function addExerciseToArray(exercises, exercise) {
	const exerciseAlreadyExists = exercises.some(function (existingExercise) {
		return existingExercise.id === exercise.id;
	});

	if (!exerciseAlreadyExists) {
		exercises.push(exercise);
	}
}

function removeExerciseFromArray(exercises, exercise) {
	const exerciseIndex = exercises.findIndex(function (existingExercise) {
		return existingExercise.id === exercise.id;
	});

	if (exerciseIndex !== -1) {
		exercises.splice(exerciseIndex, 1);
	}
}

function clearTemplateForm() {
	templateNameInput.value = "";

	selectedExercises.length = 0;
	unselectedExercises.length = 0;

	const exercises = loadExercises();

	for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
		unselectedExercises.push(exercises[exerciseIndex]);
	}

	renderTemplateExerciseLists();
}

// =========================================================
// DOM BUILDERS: TEMPLATES 
// =========================================================

function updateTemplateScreenVisibility(exercises) {
	if (exercises.length === 0) {
		templatesEmptyState.classList.remove("hidden");
		templatesDataState.classList.add("hidden");
	} else {
		templatesEmptyState.classList.add("hidden");
		templatesDataState.classList.remove("hidden");
	}
}

// =========================================================
// DOM BUILDERS: GENERIC
// =========================================================

function createActionButton(iconClassBase, iconClassIcon, text) {
	const button = document.createElement("button");
	button.classList.add("action-button");

	const icon = document.createElement("i");
	icon.classList.add(iconClassBase);
	icon.classList.add(iconClassIcon);

	const label = createText(text, "action-button-text");

	button.appendChild(icon);
	button.appendChild(label);

	return button;
}

function createText(text, extraClass) {
	const label = document.createElement("span");
	label.textContent = text;
	label.classList.add(extraClass);
	return label;
}

function createTextInput(placeholder, extraClass) {
	const input = document.createElement("input");
	input.placeholder = placeholder;

	input.classList.add("text-input");
	input.classList.add(extraClass);

	return input;
}

function createIconButton(buttonClass, iconClassBase, iconClassIcon) {
	const button = document.createElement("button");
	button.classList.add(buttonClass);

	const icon = document.createElement("i");
	icon.classList.add(iconClassBase);
	icon.classList.add(iconClassIcon);

	button.appendChild(icon);

	return button;
}

function createIcon(iconClass, iconClassBase, iconClassIcon) {
	const icon = document.createElement("i");
	icon.classList.add(iconClass);
	icon.classList.add(iconClassBase);
	icon.classList.add(iconClassIcon);

	return icon;
}


// =========================================================
// HELPERS
// =========================================================

function showInputError(inputElement) {
	inputElement.classList.add("input-error");
}

function clearInputError(inputElement) {
	inputElement.classList.remove("input-error");
}

function inputHasText(inputElement) {
	return inputElement.value.trim().length > 0;
}

function clearErrorWhenTyping(inputElement) {
	inputElement.addEventListener("input", function () {
		if (inputHasText(inputElement)) {
			clearInputError(inputElement);
		}
	});
}

function rotateChevron(chevron) {
	chevron.classList.toggle("chevron-rotate");
}

function changeVisibility(item) {
	if (item.classList.contains("hidden")) {
		item.classList.remove("hidden");
	} else {
		item.classList.add("hidden");
	}
}

function nameExistsInList(list, nameInput) {
	return list.some(function (item) {
		return item.name === nameInput;
	});
}
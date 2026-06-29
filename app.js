// =========================================================
// CONSTANTS
// =========================================================

const STORAGE_KEYS = {
	exercises: "gym-app-exercises",
	templates: "gym-app-templates",
	workouts: "gym-app-workouts"
}

const ROUTES = {
	"home-screen": "#home",
	"start-training-screen": "#start-training",
	"create-exercises-screen": "#create-exercises",
	"create-templates-screen": "#create-templates",
	"analyse-progress-screen": "#analyse-progress"
};

// =========================================================
// DOM REFERENCES
// =========================================================

const exerciseNameInput = document.getElementById("exercise-name-input");
const templateNameInput = document.getElementById("template-name-input");

const saveExerciseButton = document.getElementById("save-exercise");
const saveTemplateButton = document.getElementById("save-template");
const deleteTemplateButton = document.getElementById("delete-template");
const createTemplateButton = document.getElementById("create-template");
const createNewTemplateButton = document.getElementById("create-new-template");

const exerciseList = document.getElementById("exercise-list");
const templateList = document.getElementById("template-list");

const addSetting = document.getElementById("add-setting");
const settingsContainer = document.getElementById("settings-container");

const navButtons = document.querySelectorAll(".nav-button");
const goBackButtons = document.querySelectorAll(".back-button");

const exercisesEmptyState = document.querySelector(".exercises-empty-state");
const exercisesDataState = document.querySelector(".exercises-data-state");
const templatesEmptyState = document.querySelector(".templates-empty-state");
const templatesOverviewState = document.querySelector(".templates-overview-state");
const templatesDataState = document.querySelector(".templates-data-state");

// =========================================================
// APP STATE
// =========================================================

const appState = {
	editingExerciseId: null,
	editingTemplateId: null,
	selectedExercises: [],
	unselectedExercises: []
};

// =========================================================
// APP STARTUP
// =========================================================

setupNavigation();

setupExerciseController();
setupTemplateController();

refreshExerciseScreen();
refreshTemplateScreen();

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
		refreshExerciseScreen();
	} else if (screenId === "create-templates-screen") {
		refreshTemplateScreen();
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
// EXERCISE CONTROLLER
// =========================================================

// --- Setup --- //

function setupExerciseController() {
	setupExerciseForm();
	setupSettingsForm();
}

function setupExerciseForm() {
	const showExerciseFormButton = document.getElementById("create-exercise");

	showExerciseFormButton.addEventListener("click", showExerciseCreateMode);

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

function showExerciseCreateMode() {
	appState.editingExerciseId = null;

	clearExerciseForm();
	updateSettingsRowsVisibility();
	updateSaveExerciseButtonText();

	exercisesEmptyState.classList.add("hidden");
	exercisesDataState.classList.remove("hidden");
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

function refreshExerciseScreen() {
	appState.editingExerciseId = null;
	clearExerciseForm();
	updateSaveExerciseButtonText();
	updateSettingsRowsVisibility();
	renderExerciseScreen();
}

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
		exercisesEmptyState.classList.remove("hidden");
		exercisesDataState.classList.add("hidden");
	} else {
		exercisesEmptyState.classList.add("hidden");
		exercisesDataState.classList.remove("hidden");
	}
}

// --- DOM builders --- //

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

		const settingRow = createSavedExerciseSettingRow(setting);
		details.appendChild(settingRow);
	}

	return details;
}

function createSavedExerciseSettingRow(setting) {
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
		deleteExercise(exercises, exerciseIndex);
	});

	actions.appendChild(editButton);
	actions.appendChild(deleteButton);

	return actions;
}

// =========================================================
// TEMPLATE CONTROLLER
// =========================================================

// --- Setup --- //

function setupTemplateController() {
	setupCreateTemplateButton();
	setupTemplateSaveButton();
	setupTemplateDeleteButton();
}

function setupCreateTemplateButton() {
	createNewTemplateButton.addEventListener("click", enterCreateTemplateMode);
	createTemplateButton.addEventListener("click", enterCreateTemplateMode);
}

function setupTemplateSaveButton() {
	clearErrorWhenTyping(templateNameInput);

	saveTemplateButton.addEventListener("click", saveTemplateFromForm);
}

function setupTemplateDeleteButton() {
	deleteTemplateButton.addEventListener("click", deleteCurrentTemplate);
}

// --- Modes --- //

function showTemplateMode(mode) {
	templatesEmptyState.classList.add("hidden");
	templatesOverviewState.classList.add("hidden");
	templatesDataState.classList.add("hidden");

	if (mode === "empty") {
		templatesEmptyState.classList.remove("hidden");
	} else if (mode === "overview") {
		templatesOverviewState.classList.remove("hidden");
	} else if (mode === "data") {
		templatesDataState.classList.remove("hidden");
	}
}

function enterCreateTemplateMode() {
	appState.editingTemplateId = null;

	clearTemplateForm();
	updateSaveTemplateButtonText();
	showTemplateMode("data");
}

function enterEditTemplateMode(template) {
	clearTemplateForm();
	showTemplateMode("data");

	appState.editingTemplateId = template.id;
	templateNameInput.value = template.name;

	const exercises = loadExercises();

	for (let exerciseIndex = 0; exerciseIndex < template.exerciseIds.length; exerciseIndex++) {
		const exerciseId = template.exerciseIds[exerciseIndex];

		const exercise = exercises.find(function (exercise) {
			return exercise.id === exerciseId;
		});

		if (exercise !== undefined) {
			selectTemplateExercise(exercise);
		}
	}

	updateSaveTemplateButtonText();
}

function exitEditTemplateMode() {
	appState.editingTemplateId = null;
	clearTemplateForm();
	updateSaveTemplateButtonText();
	renderTemplateOverview();
}

// --- Mutate actions --- //

function saveTemplateFromForm() {
	const templates = loadTemplates();
	const templateName = templateNameInput.value.trim();

	let formIsValid = true;

	if (templateName === "") {
		showInputError(templateNameInput);
		formIsValid = false;
	} else if (nameExistsInList(templates, templateName) && appState.editingTemplateId === null) {
		showInputError(templateNameInput);
		formIsValid = false;
	} else {
		clearInputError(templateNameInput);
	}

	if (appState.selectedExercises.length === 0) {
		formIsValid = false;
		console.log("Select at least one exercise");
	}

	if (!formIsValid) {
		return;
	}

	if (appState.editingTemplateId === null) {
		const template = createTemplate(templateName, appState.selectedExercises);
		templates.push(template);
	} else {
		const templateIndex = templates.findIndex(function (template) {
			return template.id === appState.editingTemplateId;
		});


		if (templateIndex === -1) {
			return;
		}

		const updatedTemplate = createTemplate(templateName, appState.selectedExercises);
		updatedTemplate.id = appState.editingTemplateId;

		templates[templateIndex] = updatedTemplate;
	}

	saveTemplates(templates);
	exitEditTemplateMode();
}

function deleteCurrentTemplate() {
	const templates = loadTemplates();

	const templateIndex = templates.findIndex(function (template) {
		return template.id === appState.editingTemplateId;
	});

	if (templateIndex === -1) {
		return;
	}

	templates.splice(templateIndex, 1);

	saveTemplates(templates);
	exitEditTemplateMode();
}

function removeExerciseFromTemplates(deletedExerciseId) {
	const templates = loadTemplates();

	for (let templateIndex = 0; templateIndex < templates.length; templateIndex++) {
		const template = templates[templateIndex];

		template.exerciseIds = template.exerciseIds.filter(function (exerciseId) {
			return exerciseId !== deletedExerciseId;
		});
	}

	saveTemplates(templates);
	renderTemplateOverview();
}

// --- Selection actions --- //

function selectTemplateExercise(exercise) {
	removeExerciseFromArray(appState.unselectedExercises, exercise);
	addExerciseToArray(appState.selectedExercises, exercise);

	renderTemplateExerciseLists();
}

function unselectTemplateExercise(exercise) {
	removeExerciseFromArray(appState.selectedExercises, exercise);
	addExerciseToArray(appState.unselectedExercises, exercise);

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

// --- Form helpers --- //

function clearTemplateForm() {
	templateNameInput.value = "";

	appState.selectedExercises.length = 0;
	appState.unselectedExercises.length = 0;

	const exercises = loadExercises();

	for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
		appState.unselectedExercises.push(exercises[exerciseIndex]);
	}

	renderTemplateExerciseLists();
}

function updateSaveTemplateButtonText() {
	if (appState.editingTemplateId !== null) {
		saveTemplateButton.textContent = "Update template"
	} else {
		saveTemplateButton.textContent = "Save template"
	}
}

// --- Rendering --- //

function refreshTemplateScreen() {
	appState.editingTemplateId = null;
	clearTemplateForm();
	updateSaveTemplateButtonText();
	renderTemplateOverview();
}

function renderTemplateOverview() {
	const templates = loadTemplates();

	renderTemplateList(templates);

	if (templates.length === 0) {
		showTemplateMode("empty");
	} else {
		showTemplateMode("overview");
	}
}

function renderTemplateList(templates) {
	templateList.innerHTML = "";

	for (let templateIndex = 0; templateIndex < templates.length; templateIndex++) {
		const template = templates[templateIndex];
		const savedTemplateRow = createSavedTemplateRow(template);
		templateList.appendChild(savedTemplateRow);
	}
}

function renderTemplateExerciseLists() {
	renderSelectedExercises();
	renderAvailableExercises();
}

function renderAvailableExercises() {
	const availableExercisesList = document.querySelector(".template-unselected-items");

	availableExercisesList.innerHTML = "";

	for (let exerciseIndex = 0; exerciseIndex < appState.unselectedExercises.length; exerciseIndex++) {
		const exercise = appState.unselectedExercises[exerciseIndex];

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

	for (let exerciseIndex = 0; exerciseIndex < appState.selectedExercises.length; exerciseIndex++) {
		const exercise = appState.selectedExercises[exerciseIndex];

		const row = createTemplateExerciseRow(exercise, true);

		row.addEventListener("click", function () {
			unselectTemplateExercise(exercise);
		});

		selectedExercisesList.appendChild(row);
	}
}

// --- DOM builders --- //

function createSavedTemplateRow(template) {
	const row = document.createElement("button");
	row.type = "button";
	row.classList.add("saved-template-row");

	const templateIcon = createIcon("template-row-icon", "fa-solid", "fa-clipboard-list");

	const templateText = document.createElement("span");
	templateText.classList.add("template-row-text");

	const templateName = createText(template.name, "template-row-title");

	const templateExerciseCount = template.exerciseIds.length;
	const pluralAdjuster = templateExerciseCount === 1 ? "" : "s";
	const templateExerciseCountText = `${templateExerciseCount} exercise${pluralAdjuster}`
	const templateExerciseCountSubtitle = createText(templateExerciseCountText, "template-row-subtitle");
	templateText.appendChild(templateName);
	templateText.appendChild(templateExerciseCountSubtitle);

	const chevronIcon = createIconButton("chevron-button", "fa-solid", "fa-chevron-right");

	row.addEventListener("click", function () {
		enterEditTemplateMode(template);
	});

	row.appendChild(templateIcon);
	row.appendChild(templateText);

	row.appendChild(chevronIcon);

	return row;
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

// =========================================================
// DATA STORAGE
// =========================================================

// --- Data storage functions --- //

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

// --- Data models + storage --- //

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

function loadExercises() {
	return loadItems(STORAGE_KEYS.exercises);
}

function saveExercises(exercises) {
	saveItems(STORAGE_KEYS.exercises, exercises);
}

function loadTemplates() {
	return loadItems(STORAGE_KEYS.templates);
}

function saveTemplates(templates) {
	saveItems(STORAGE_KEYS.templates, templates);
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
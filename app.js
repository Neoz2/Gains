// =========================================================
// CONSTANTS + DOM REFERENCES
// =========================================================

const STORAGE_KEY = "gym-app-exercises";

const input = document.getElementById("exercise-name-input");
const saveButton = document.getElementById("save-exercise");
const exerciseList = document.getElementById("exercise-list");
const addSetting = document.getElementById("add-setting");
const settingsContainer = document.getElementById("settings-container");

const navButtons = document.querySelectorAll(".nav-button");
const goBackButtons = document.querySelectorAll(".back-button");

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

renderExerciseList(loadExercises());

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
    } else {
      showScreen("home-screen");
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
// EXERCISE FORM SETUP
// =========================================================

function setupExerciseForm() {
	clearErrorWhenTyping(input);
	
  	saveButton.addEventListener("click", function () {
		const exerciseName = input.value.trim();
		const exercises = loadExercises();

		let formIsValid = true;

		if (exerciseName === "") {
			showInputError(input);
			formIsValid = false;
		} else if (exerciseExists(exercises, exerciseName)) {
			showInputError(input);
			formIsValid = false;
		} else {
			clearInputError(input);
		}

		const settings = readSettingsFromPage();

		if (settings === null) {
			formIsValid = false;
		}

		if (!formIsValid) {
			return;
		}

		const exercise = createExercise(exerciseName, settings);

		exercises.push(exercise);

		updateExercises(exercises);
		clearExerciseForm();
		updateSettingsRowsVisibility();
	});
}


// =========================================================
// EXERCISE DATA / STORAGE
// =========================================================

function createExercise(name, settings) {
  return {
    id: crypto.randomUUID(),
    name: name,
    settings: settings
  };
}

function exerciseExists(exercises, exerciseName) {
  return exercises.some(function (exercise) {
    return exercise.name === exerciseName;
  });
}

function loadExercises() {
  const savedExercises = localStorage.getItem(STORAGE_KEY);

  if (savedExercises === null) {
    return [];
  }

  const exercises = JSON.parse(savedExercises);

  if (!Array.isArray(exercises)) {
    return [];
  }

  return exercises;
}

function saveExercises(exercises) {
  const json = JSON.stringify(exercises);
  localStorage.setItem(STORAGE_KEY, json);
}

function updateExercises(exercises) {
  saveExercises(exercises);
  renderExerciseList(exercises);
}


// =========================================================
// EXERCISE RENDERING
// =========================================================

function renderExerciseList(exercises) {
  exerciseList.innerHTML = "";

  for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
    const exerciseRow = createExerciseRow(exercises, exerciseIndex);
    exerciseList.appendChild(exerciseRow);
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
  input.value = "";
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
// DOM BUILDERS
// =========================================================

function createSettingRow() {
	const settingsRow = document.createElement("div");
	settingsRow.classList.add("settings-row");

	const settingNameDeleteRow = document.createElement("div");
	settingNameDeleteRow.classList.add("setting-delete-button-row");

	const settingNameLabel = createFieldLabel("Setting name");
	const settingNameInput = createTextInput("Name...", "setting-name");

	const settingValueLabel = createFieldLabel("Value");
	const settingValueInput = createTextInput("Setting value...", "setting-value");

  	clearErrorWhenTyping(settingNameInput);
	clearErrorWhenTyping(settingValueInput);

  	const deleteButton = createDeleteButton();
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

function createExerciseRow(exercises, exerciseIndex) {
  const exercise = exercises[exerciseIndex];

  const li = document.createElement("li");
  li.classList.add("exercise-row");

  const contentDiv = createExerciseRowContent(exercise);

  const deleteButton = createDeleteButton();
  deleteButton.addEventListener("click", function () {
    exercises.splice(exerciseIndex, 1);
    updateExercises(exercises);
  });

  li.appendChild(contentDiv);
  li.appendChild(deleteButton);

  return li;
}

function createExerciseRowContent(exercise) {
  const contentDiv = document.createElement("div");

  const nameSpan = document.createElement("span");
  nameSpan.textContent = exercise.name;
  contentDiv.appendChild(nameSpan);

  for (let settingIndex = 0; settingIndex < exercise.settings.length; settingIndex++) {
    const setting = exercise.settings[settingIndex];

    const settingLine = createSettingSummaryLine(setting);
    contentDiv.appendChild(settingLine);
  }

  return contentDiv;
}

function createSettingSummaryLine(setting) {
  const settingLine = document.createElement("div");
  settingLine.textContent = `${setting.name}: ${setting.value}`;
  return settingLine;
}

function createFieldLabel(text) {
  const label = document.createElement("span");
  label.textContent = text;
  label.classList.add("field-name");
  return label;
}

function createTextInput(placeholder, extraClass) {
  const input = document.createElement("input");
  input.placeholder = placeholder;
  input.classList.add("text-input");
  input.classList.add(extraClass);
  return input;
}

function createDeleteButton() {
  const button = document.createElement("button");
  button.classList.add("delete-button");

  const icon = document.createElement("i");
  icon.classList.add("fa-regular");
  icon.classList.add("fa-trash-can");

  button.appendChild(icon);

  return button;
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
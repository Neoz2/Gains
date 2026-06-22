const STORAGE_KEY = "gym-app-exercises";

const input = document.getElementById("exercise-name-input");
const saveButton = document.getElementById("save-exercise");
const deleteAllButton = document.getElementById("delete-all-exercises");
const exerciseList = document.getElementById("exercise-list");
const addSetting = document.getElementById("add-setting");
const settingsContainer = document.getElementById("settings-container");
const goHomeButtons = document.querySelectorAll(".home-button");

console.log("App started...");

//---NAVIGATION---//

const ROUTES = {
	"home-screen": "#home",
	"start-training-screen": "#start-training",
	"create-exercises-screen": "#create-exercises",
	"create-templates-screen": "#create-templates",
	"analyse-progress-screen": "#analyse-progress"
}

function showScreen(screenId) {
  hideAllScreens();
  showSelectedScreen(screenId);
  updateSelectedNavButton(screenId);
}

const navButtons = document.querySelectorAll(".nav-button");

for (let i = 0; i < navButtons.length; i++) {
  navButtons[i].addEventListener("click", function () {
    const screenId = navButtons[i].dataset.screen;
    showScreen(screenId);

	const route = ROUTES[screenId];
	if (route) {
		history.pushState({ screenId: screenId }, "", route);
	}
  });
}

for (let i = 0; i < goHomeButtons.length; i++) {
  goHomeButtons[i].addEventListener("click", function () {
    showScreen("home-screen");
  });
}

window.addEventListener("popstate", function (event) {
  if (event.state && event.state.screenId) {
	showScreen(event.state.screenId);	
  } else {
	showScreen("home-screen");
  }
});

//---EXERCISE INPUT---//

saveButton.addEventListener("click", function () {
	const exerciseName = input.value.trim();

	if (exerciseName === "") {
	    console.log("This entry is empty");
	    return;
	}

	const exercises = loadExercises();

	if (exerciseExists(exercises, exerciseName)){
	  	console.log("This entry already exists");
		return;
	}

	const settings = readSettingsFromPage();

	if (settings === null) {
	  	return;
	}

	const exercise = createExercise(exerciseName, settings);

	exercises.push(exercise);

	updateExercises(exercises);
	clearExerciseForm();
});

deleteAllButton.addEventListener("click", function () {
	updateExercises([]);
});

function loadExercises() {
	const savedExercises = localStorage.getItem(STORAGE_KEY);

	if (savedExercises === null) {
		return []
	}

	const exercises = JSON.parse(savedExercises)

	if (!Array.isArray(exercises)) {
		return [];
	}

	return exercises;
}

function saveExercises(exercises) {
	const json = JSON.stringify(exercises)
  	localStorage.setItem(STORAGE_KEY, json)
}

function renderExerciseList(exercises) {
  exerciseList.innerHTML = "";

  for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
    const exercise = exercises[exerciseIndex];

    const li = document.createElement("li");
    li.classList.add("exercise-row");

    const contentDiv = document.createElement("div");

    const nameSpan = document.createElement("span");
    nameSpan.textContent = exercise.name;
    contentDiv.appendChild(nameSpan);

    for (let settingIndex = 0; settingIndex < exercise.settings.length; settingIndex++) {
      const setting = exercise.settings[settingIndex];

      const settingLine = document.createElement("div");
      settingLine.textContent = `${setting.name}: ${setting.value}`;

      contentDiv.appendChild(settingLine);
    }

    const delButton = createDeleteButton()
    delButton.addEventListener("click", function () {
      exercises.splice(exerciseIndex, 1);
      updateExercises(exercises);
    });

    li.appendChild(contentDiv);
    li.appendChild(delButton);

    exerciseList.appendChild(li);
  }
}

renderExerciseList(loadExercises());

//---SETTINGS INPUT---//

addSetting.addEventListener("click", function() {
	const settingsRows = document.querySelectorAll(".settings-row");

	if (settingsRows.length >= 3) {
		return;
	}

	const settingsRow = document.createElement("div")
	settingsRow.classList.add("settings-row");

	const settingName = document.createElement("input");
	settingName.placeholder = "Setting name...";
	settingName.classList.add("setting-name");

	const settingValue = document.createElement("input");
	settingValue.placeholder = "Setting value...";
	settingValue.classList.add("setting-value");

	const delButton = createDeleteButton()
    delButton.addEventListener("click", function () {
	    settingsRow.remove();
	  });
	
	settingsRow.appendChild(settingName);	
	settingsRow.appendChild(settingValue);
	settingsRow.appendChild(delButton);

	settingsContainer.appendChild(settingsRow);
});

function readSettingsFromPage(){
	const settingsRows = document.querySelectorAll(".settings-row");
	const settings = [];
  	
  	for (let i = 0; i < settingsRows.length; i++) {
  		const row = settingsRows[i];

  		const name = row.querySelector(".setting-name").value.trim();
  		const value = row.querySelector(".setting-value").value.trim();

  		if (name === "" && value === ""){
  			console.log("Setting row is empty");
	      	return null;
  		}

	  	if (name === "" || value === "") {
	      	console.log("Setting row is incomplete");
	      	return null;
	    }

  		settings.push({
  			name: name,
  			value: value
  		});
  	}

  	return settings;
}

//---HELPER FUNCTIONS---//

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

function clearExerciseForm() {
  input.value = "";
  settingsContainer.innerHTML = "";
}

function updateExercises(exercises){
	saveExercises(exercises);
    renderExerciseList(exercises);
}

function createDeleteButton() {
	const button = document.createElement("button");

	button.classList.add("delete-button");
    button.textContent = "X";

    return button;
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

//---------------------//

history.replaceState({ screenId: "home-screen" }, "", "#home");
showScreen("home-screen");

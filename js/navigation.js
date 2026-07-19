//navigation.js

// =========================================================
// DOM REFERENCES
// =========================================================

const navButtons = document.querySelectorAll(".nav-button");
const goBackButtons = document.querySelectorAll(".back-button");

// =========================================================
// CONSTANTS
// =========================================================

const ROUTES = {
	"home-screen": "#home",
	"start-training-screen": "#start-training",
	"create-exercises-screen": "#create-exercises",
	"create-templates-screen": "#create-templates",
	"analyse-progress-screen": "#analyse-progress"
};

// =========================================================
// NAVIGATION SETUP
// =========================================================

function setupNavigation() {
	for (let i = 0; i < navButtons.length; i++) {
		navButtons[i].addEventListener("click", function () {
			const button = navButtons[i];
			const screenId = button.dataset.screen;

			runWithPressFeedback(button, function () {
				navigateToScreen(screenId);
			}, 90);
		});
	}

	for (let i = 0; i < goBackButtons.length; i++) {
		goBackButtons[i].addEventListener("click", function () {
			const button = goBackButtons[i];

			runWithPressFeedback(button, function () {
				history.back();
			}, 90);
		});
	}

	window.addEventListener("popstate", function (event) {
		if (event.state?.screenId) {
			showScreen(event.state.screenId);
			refreshScreen(event.state.screenId, event.state.mode);
			return;
		}

		showScreen("home-screen");
	});
}

function navigateOnClick(element, screen, mode = null) {
	element.addEventListener("click", function () {
		runWithPressFeedback(element, function () {
			navigateToScreen(screen, mode);
		}, 90);
	});
}

// =========================================================
// NAVIGATION FUNCTIONS
// =========================================================

function refreshScreen(screenId, mode = null) {
	if (screenId === "home-screen") {
		return;
	}

	if (screenId === "create-exercises-screen") {
		refreshExerciseScreen(mode);
	} else if (screenId === "create-templates-screen") {
		refreshTemplateScreen(mode);
	} else if (screenId === "start-training-screen") {
		refreshTrainingScreen(mode);
	} else if (screenId === "analyse-progress-screen") {
		refreshProgressScreen(mode);
	}
}

function navigateToScreen(screenId, mode = null) {
	showScreen(screenId);
	pushScreenToHistory(screenId, mode);
	refreshScreen(screenId, mode);
}

// =========================================================
// SCREEN DISPLAY HELPERS
// =========================================================

function showScreen(screenId) {
	hideAllScreens();
	showSelectedScreen(screenId);
	updateSelectedBottomNavButton(screenId);
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
		return;
	}

	screen.classList.remove("hidden");
}

function updateSelectedBottomNavButton(screenId) {
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
// MODE DISPLAY HELPERS
// =========================================================

function createMode(state, mode, title, subtitle) {
	return {
		state: state,
		mode: mode,
		title: title,
		subtitle: subtitle
	};
}

function hideAllStates(modes) {
	modes.forEach(function (mode) {
		mode.state.classList.add("hidden");
	});
}

function showCurrentMode(currentMode, modes, modeTitleElement, modeSubtitleElement) {
	const matchedMode = modes.find(function (mode) {
		return mode.mode === currentMode;
	});

	if (matchedMode === undefined) {
		return;
	}

	updatePageHeader(modeTitleElement, modeSubtitleElement, matchedMode.title, matchedMode.subtitle);
	matchedMode.state.classList.remove("hidden");
}

// =========================================================
// HISTORY HELPERS
// =========================================================

function pushScreenToHistory(screenId, mode) {
	const route = ROUTES[screenId];

	if (route) {
		let url = route;

		if (mode !== null) {
			url += "/" + mode;
		}

		history.pushState(
			{
				screenId: screenId,
				mode: mode
			},
			"",
			url
		);
	}
}
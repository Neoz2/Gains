//navigation.js

// =========================================================
// DOM REFERENCES
// =========================================================

const navButtons = document.querySelectorAll(".nav-button");
const goBackButtons = document.querySelectorAll(".back-button");

// =========================================================
// GLOBALS
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
		navigateToScreen(screen, mode);
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
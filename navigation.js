//navigation.js

// =========================================================
// DOM REFERENCES
// =========================================================

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
	} else if (screenId === "start-training-screen") {
        refreshTrainingScreen();
    } else if (screenId === "analyse-progress-screen") {
		refreshProgressScreen();
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
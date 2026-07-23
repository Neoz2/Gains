//app.js

// =========================================================
// APP STATE
// =========================================================

const appState = {
	editingExerciseId: null,
	editingTemplateId: null,
	templateSelectedExercises: [],
	templateUnselectedExercises: [],
	workoutSelectedExercises: [],
	workoutUnselectedExercises: [],
	activeWorkout: null,
	activeSetTimer: false
};

let appStarted = false;
let authenticatedControllersReady = false;
let authChangeQueue = Promise.resolve();

// =========================================================
// APP STARTUP
// =========================================================

if (window.firebaseStorage) {
	startApp();
} else {
	window.addEventListener(
		"firebaseStorageReady",
		startApp,
		{ once: true }
	);
}

function startApp() {
	if (appStarted) {
		return;
	}

	appStarted = true;

	setupNavigation();
	setupLoginController();

	firebaseStorage.subscribeToAuthChanges(function (user) {
		authChangeQueue = authChangeQueue
			.then(function () {
				return handleAuthState(user);
			})
			.catch(function (error) {
				console.error("Failed to handle auth state:", error);
			});
	});
}

// =========================================================
// AUTH STATE
// =========================================================

async function handleAuthState(user) {
	if (!user) {
		showLoggedOutApp();
		return;
	}

	await showLoggedInApp();
}

function showLoggedOutApp() {
	hideBottomNav();

	replaceScreenInHistory("login-screen");
	showScreen("login-screen");
}

async function showLoggedInApp() {
	await firebaseStorage.setupFirebaseSync();

	if (!authenticatedControllersReady) {
		setupTrainingController();
		setupExerciseController();
		setupTemplateController();
		setupProgressController();

		authenticatedControllersReady = true;
	}

	showBottomNav();
	restoreActiveWorkout();

	if (hasActiveWorkout()) {
		history.replaceState(
			{
				screenId: "start-training-screen",
				mode: "training-workout-mode"
			},
			"",
			"#start-training/training-workout-mode"
		);

		showScreen("start-training-screen");

		refreshScreen(
			"start-training-screen",
			"training-workout-mode"
		);

		return;
	}

	history.replaceState(
		{
			screenId: "home-screen"
		},
		"",
		"#home"
	);

	showScreen("home-screen");
}
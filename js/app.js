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

// =========================================================
// APP STARTUP
// =========================================================

if (window.firebaseStorage) {
	startApp();
} else {
	window.addEventListener("firebaseStorageReady", startApp);
}

async function startApp() {
	await firebaseStorage.waitForAuthReady();

	setupNavigation();
	setupLoginController();

	if (!firebaseStorage.getCurrentUser()) {
		navigateToScreen("login-screen");
		hideBottomNav();
		return;
	}

	showBottomNav();
	setupTrainingController();
	setupExerciseController();
	setupTemplateController();
	setupProgressController();

	await firebaseStorage.setupFirebaseSync();

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
		refreshScreen("start-training-screen", "training-workout-mode");
	}

	history.replaceState({ screenId: "home-screen" }, "", "#home");
	showScreen("home-screen");
}


















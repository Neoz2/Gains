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
	await firebaseStorage.setupFirebaseSync();

	setupNavigation();

	restoreActiveWorkout();

	setupTrainingController();
	setupExerciseController();
	setupTemplateController();
	setupProgressController();

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
	} else {
		history.replaceState({ screenId: "home-screen" }, "", "#home");
		showScreen("home-screen");
	}
}


















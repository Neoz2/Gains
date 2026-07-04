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
	workoutUnselectedExercises: []
};

// =========================================================
// APP STARTUP
// =========================================================

setupNavigation();

setupTrainingController();
setupExerciseController();
setupTemplateController();

refreshTrainingScreen();
refreshExerciseScreen();
refreshTemplateScreen();

history.replaceState({ screenId: "home-screen" }, "", "#home");
showScreen("home-screen");














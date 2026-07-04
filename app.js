//app.js

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

setupTrainingController();
setupExerciseController();
setupTemplateController();

refreshTrainingScreen();
refreshExerciseScreen();
refreshTemplateScreen();

history.replaceState({ screenId: "home-screen" }, "", "#home");
showScreen("home-screen");












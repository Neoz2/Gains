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

setupExerciseController();
setupTemplateController();

refreshExerciseScreen();
refreshTemplateScreen();

history.replaceState({ screenId: "home-screen" }, "", "#home");
showScreen("home-screen");












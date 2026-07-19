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

setupNavigation();

setupTrainingController();
setupExerciseController();
setupTemplateController();
setupProgressController();
setupKeyboardAwareSaveBar();

history.replaceState({ screenId: "home-screen" }, "", "#home");
showScreen("home-screen");

function hasActiveWorkout() {
	return appState.activeWorkout !== null;
}

function setupKeyboardAwareSaveBar() {
    if (!window.visualViewport) {
        console.log("visualViewport not supported");
        return;
    }

    function updateSaveBarPosition() {
        const keyboardHeight = window.innerHeight - window.visualViewport.height;
        const offset = "-250px";
		//keyboardHeight > 0 ? `-${keyboardHeight}px` : "0px";

        const saveBars = document.querySelectorAll(".fixed-save-bar");

        for (let i = 0; i < saveBars.length; i++) {
            saveBars[i].style.setProperty("--keyboard-offset", offset);
        }

        console.log("keyboard height:", keyboardHeight, "offset:", offset);
    }

    window.visualViewport.addEventListener("resize", updateSaveBarPosition);
    window.visualViewport.addEventListener("scroll", updateSaveBarPosition);

    updateSaveBarPosition();
}















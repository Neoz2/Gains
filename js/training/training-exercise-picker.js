//training-exercise-picker.js

// --- Exercise picker actions --- //

function selectWorkoutExercise(exercise) {
    removeSelectedExercise(appState.workoutUnselectedExercises, exercise);
    addSelectedExercise(appState.workoutSelectedExercises, exercise);

    renderWorkoutExercisePickerLists();
}

function unselectWorkoutExercise(exercise) {
    removeSelectedExercise(appState.workoutSelectedExercises, exercise);
    addSelectedExercise(appState.workoutUnselectedExercises, exercise);

    renderWorkoutExercisePickerLists();
}

// --- Exercise picker helpers --- //

function resetWorkoutExercisePicker() {
    appState.workoutSelectedExercises.length = 0;
    appState.workoutUnselectedExercises.length = 0;

    const exercises = loadExercises();

    for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
        appState.workoutUnselectedExercises.push(exercises[exerciseIndex]);
    }

    renderWorkoutExercisePickerLists();
}

function setupEditWorkoutPicker() {
    appState.workoutSelectedExercises.length = 0;
    appState.workoutUnselectedExercises.length = 0;

    const allExercises = loadExercises();
    const activeWorkoutExercises = appState.activeWorkout.exercises;

    for (let exerciseIndex = 0; exerciseIndex < allExercises.length; exerciseIndex++) {
        const exercise = allExercises[exerciseIndex];

        const exerciseIsInWorkout = activeWorkoutExercises.some(function (workoutExercise) {
            return workoutExercise.exerciseId === exercise.id;
        });

        if (exerciseIsInWorkout) {
            appState.workoutSelectedExercises.push(exercise);
        } else {
            appState.workoutUnselectedExercises.push(exercise);
        }
    }

    renderWorkoutExercisePickerLists();
}

// --- Rendering --- //

function renderWorkoutExercisePickerLists() {
    renderSelectedWorkoutExercises();
    renderAvailableWorkoutExercises();
}

function renderAvailableWorkoutExercises() {
    const availableExercisesList = document.querySelector(".training-unselected-items");

    availableExercisesList.innerHTML = "";

    for (let exerciseIndex = 0; exerciseIndex < appState.workoutUnselectedExercises.length; exerciseIndex++) {
        const exercise = appState.workoutUnselectedExercises[exerciseIndex];

        const row = createExercisePickerRow(exercise, false);

        row.addEventListener("click", function () {
            runWithPressFeedback(row, function () {
                selectWorkoutExercise(exercise);
            }, 60);
        });

        availableExercisesList.append(row);
    }
}

function renderSelectedWorkoutExercises() {
    const selectedExercisesList = document.querySelector(".training-selected-items");

    selectedExercisesList.innerHTML = "";

    for (let exerciseIndex = 0; exerciseIndex < appState.workoutSelectedExercises.length; exerciseIndex++) {
        const exercise = appState.workoutSelectedExercises[exerciseIndex];

        const row = createExercisePickerRow(exercise, true);

        row.addEventListener("click", function () {
            runWithPressFeedback(row, function () {
                unselectWorkoutExercise(exercise);
            }, 60);
        });

        selectedExercisesList.append(row);
    }
}
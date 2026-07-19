//training-exercise-picker.js

// --- Exercise picker actions --- //

function selectWorkoutExercise(exercise) {
    removeSelectedExercise(appState.workoutUnselectedExercises, exercise);
    addSelectedExercise(appState.workoutSelectedExercises, exercise);

    renderWorkoutExercisePickerLists();
}

function unselectWorkoutExercise(exercise) {
    if (canRemoveWorkoutExercise(exercise.id)) {
        removeSelectedExercise(appState.workoutSelectedExercises, exercise);
        addSelectedExercise(appState.workoutUnselectedExercises, exercise);

        renderWorkoutExercisePickerLists();
    }
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

function canRemoveWorkoutExercise(exerciseId) {
    if (appState.activeWorkout !== null) {
        for (let workoutExerciseIndex = 0; workoutExerciseIndex < appState.activeWorkout.exercises.length; workoutExerciseIndex++) {
            const workoutExercise = appState.activeWorkout.exercises[workoutExerciseIndex];

            if (workoutExercise.exerciseId === exerciseId && workoutExercise.sets?.length > 0) {
                return false;
            }
        }
    }

    return true;
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
        setToUnlockedAppearance(row);

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

    const activeWorkoutExercises = [...appState.workoutSelectedExercises].sort(function (a, b) {
        return Number(canRemoveWorkoutExercise(a.id)) - Number(canRemoveWorkoutExercise(b.id));
    });

    console.log(activeWorkoutExercises);

    for (let exerciseIndex = 0; exerciseIndex < activeWorkoutExercises.length; exerciseIndex++) {
        const exercise = activeWorkoutExercises[exerciseIndex];

        const row = createExercisePickerRow(exercise, true);
        const canRemove = canRemoveWorkoutExercise(exercise.id);

        if (!canRemove) {
            setToLockedAppearance(row);
        } else {
            row.addEventListener("click", function () {
                runWithPressFeedback(row, function () {
                    unselectWorkoutExercise(exercise);
                }, 60);
            });
        }

        selectedExercisesList.append(row);
    }
}

function setToLockedAppearance(row) {
    row.classList.add("locked");

    const icon = row.querySelector(".exercise-picker-status-icon");

    if (icon !== null) {
        icon.classList.remove("fa-circle-check");
        icon.classList.add("fa-lock");
    }
}

function setToUnlockedAppearance(row) {
    row.classList.remove("locked");

    const icon = row.querySelector(".exercise-picker-status-icon");

    if (icon !== null) {
        icon.classList.remove("fa-lock");
        icon.classList.add("fa-circle");
    }
}
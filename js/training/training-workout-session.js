//training-workout-session.js

let setTimeSaveTimeout = null;

// =========================================================
// Workout lifecycle
// =========================================================

async function enterWorkoutState(exercises) {
    const workout = createWorkout(exercises);

    if (workout.exercises.length === 0) {
        return;
    }

    appState.activeWorkout = workout;
    await addWorkout(workout);

    unfoldedWorkoutCardIndex = 0;

    navigateToScreen("start-training-screen", "training-workout-mode");
}

async function enterEndOfWorkoutMode() {
    if (appState.activeWorkout === null) {
        return;
    }

    const workout = appState.activeWorkout;

    if (!workoutHasRecordedSets(workout)) {
        await deleteWorkout(workout.id);

        stopTimerInterval(workoutSessionTimer);

        appState.activeWorkout = null;

        navigateToScreen(
            "start-training-screen",
            "training-end-of-workout-mode"
        );

        return;
    }

    workout.finishedAt = new Date().toISOString();

    await updateWorkout(workout);

    stopTimerInterval(workoutSessionTimer);

    appState.activeWorkout = null;

    navigateToScreen(
        "start-training-screen",
        "training-end-of-workout-mode"
    );
}

// =========================================================
// Mutate actions
// =========================================================

async function saveWorkoutSelection() {
    if (appState.workoutSelectedExercises.length === 0) {
        showInputError(workoutNoSelectedItems);
        return;
    }

    if (appState.activeWorkout !== null) {
        await updateActiveWorkoutExerciseSelection(appState.workoutSelectedExercises);
        return;
    }

    await enterWorkoutState(appState.workoutSelectedExercises);
}

async function updateActiveWorkoutExerciseSelection(selectedExercises) {
    const updatedWorkoutExercises = [];

    for (let exerciseIndex = 0; exerciseIndex < selectedExercises.length; exerciseIndex++) {
        const selectedExercise = selectedExercises[exerciseIndex];

        const existingWorkoutExercise = appState.activeWorkout.exercises.find(function (workoutExercise) {
            return workoutExercise.exerciseId === selectedExercise.id;
        });

        if (existingWorkoutExercise !== undefined) {
            updatedWorkoutExercises.push(existingWorkoutExercise);
            continue;
        }

        const newWorkoutExercise = createWorkoutExercise(selectedExercise);
        updatedWorkoutExercises.push(newWorkoutExercise);
    }

    appState.activeWorkout.exercises = updatedWorkoutExercises;
    await updateWorkout(appState.activeWorkout);

    unfoldedWorkoutCardIndex = 0;

    navigateToScreen("start-training-screen", "training-workout-mode");
}

async function saveWorkoutSet(exercise, elapsedTime, weight) {
    const numericWeight = getNumericWeight(weight);

    if (numericWeight === null) {
        return false;
    }

    const set = createWorkoutExerciseSet(numericWeight, elapsedTime);

    exercise.sets.push(set);

    await updateWorkout(appState.activeWorkout);

    return true;
}

async function deleteWorkoutSet(setNumber, exercise, card) {
    exercise.sets.splice(setNumber - 1, 1);

    await updateWorkout(appState.activeWorkout);

    renderWorkoutSets(exercise, card);
}

function decreaseSetTimeUnderLoad(set, exercise, card) {
    if (set.timeUnderLoad <= 0) {
        return;
    }

    set.timeUnderLoad -= 1;

    renderWorkoutSets(exercise, card);

    scheduleSetTimeSave();
}

function increaseSetTimeUnderLoad(set, exercise, card) {
    set.timeUnderLoad += 1;
    renderWorkoutSets(exercise, card);

    scheduleSetTimeSave();
}

function scheduleSetTimeSave() {
    const workout = appState.activeWorkout;

    if (workout === null) {
        return;
    }

    clearTimeout(setTimeSaveTimeout);

    setTimeSaveTimeout = setTimeout(function () {
        setTimeSaveTimeout = null;

        updateWorkout(workout)
            .catch(function (error) {
                console.error(
                    "Could not save set time:",
                    error
                );
            });
    }, 1000);
}

// =========================================================
// Helpers
// =========================================================

function workoutHasRecordedSets(workout) {
    return workout.exercises.some(function (exercise) {
        return exercise.sets.length > 0;
    });
}

function cancelPendingSetTimeSave() {
    clearTimeout(setTimeSaveTimeout);
    setTimeSaveTimeout = null;
}

async function flushPendingSetTimeSave() {
    if (setTimeSaveTimeout === null) {
        return;
    }

    clearTimeout(setTimeSaveTimeout);
    setTimeSaveTimeout = null;

    if (appState.activeWorkout === null) {
        return;
    }

    await updateWorkout(appState.activeWorkout);
}
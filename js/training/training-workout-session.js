//training-workout-session.js

// --- Workout lifecycle --- //

function enterWorkoutState(exercises) {
    const workout = createWorkout(exercises);

    if (workout.exercises.length === 0) {
        return;
    }

    appState.activeWorkout = workout;
    appState.activeWorkout.startedAt = Date.now();
    addWorkout(workout);

    unfoldedWorkoutCardIndex = 0;

    navigateToScreen("start-training-screen", "training-workout-mode");

    startWorkoutSessionTimer(workoutSessionTimer, trainingModeSubtitle);
}

function enterEndOfWorkoutMode() {
    appState.activeWorkout.finishedAt = new Date().toISOString();

    updateWorkout(appState.activeWorkout);

    stopTimerInterval(workoutSessionTimer.intervalId);

    appState.activeWorkout = null;

    navigateToScreen("start-training-screen", "training-end-of-workout-mode");
}

// --- Mutate actions --- //

function saveWorkoutSelection() {
    if (appState.workoutSelectedExercises.length === 0) {
        showInputError(workoutNoSelectedItems);
        return;
    }

    if (appState.activeWorkout !== null) {
        updateActiveWorkoutExerciseSelection(appState.workoutSelectedExercises);
        return;
    }

    enterWorkoutState(appState.workoutSelectedExercises);
}

function updateActiveWorkoutExerciseSelection(selectedExercises) {
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
    updateWorkout(appState.activeWorkout);

    unfoldedWorkoutCardIndex = 0;

    navigateToScreen("start-training-screen", "training-workout-mode");
}

function saveWorkoutSet(exercise, elapsedTime, weight) {
    const set = createWorkoutExerciseSet(Number(weight), elapsedTime);

    exercise.sets.push(set);

    updateWorkout(appState.activeWorkout);
}

function deleteWorkoutSet(setNumber, exercise, card) {
    exercise.sets.splice(setNumber - 1, 1);

    updateWorkout(appState.activeWorkout);
    renderWorkoutSets(exercise, card);
}

function decreaseSetTimeUnderLoad(set, exercise, card) {
    if (set.timeUnderLoad > 0) {
        set.timeUnderLoad -= 1;
    }

    updateWorkout(appState.activeWorkout);
    renderWorkoutSets(exercise, card);
}

function increaseSetTimeUnderLoad(set, exercise, card) {
    set.timeUnderLoad += 1;

    updateWorkout(appState.activeWorkout);
    renderWorkoutSets(exercise, card);
}
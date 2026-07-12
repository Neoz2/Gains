//storage.js

// =========================================================
// CONSTANTS
// =========================================================

const STORAGE_KEYS = {
    exercises: "gym-app-exercises",
    templates: "gym-app-templates",
    workouts: "gym-app-workouts",
    selectedProgressExerciseId: "gym-app-selected-progress-exercise-id"
};

// =========================================================
// DATA STORAGE
// =========================================================

// --- Data storage functions --- //
function loadItems(storageKey) {
    const savedItems = localStorage.getItem(storageKey);

    if (savedItems === null) {
        return [];
    }

    try {
        const items = JSON.parse(savedItems);

        if (!Array.isArray(items)) {
            return [];
        }

        return items;
    } catch (error) {
        console.log("Could not load items from localStorage:", storageKey, error);
        return [];
    }
}

function saveItems(storageKey, items) {
    const json = JSON.stringify(items);
    localStorage.setItem(storageKey, json);
}

// --- Data models + storage --- //

function createExercise(name, settings) {
    return {
        id: createId(),
        name: name,
        isArchived: false,
        settings: settings
    };
}

function createTemplate(name, selectedExercises) {
    const exerciseIds = [];

    for (let exerciseIndex = 0; exerciseIndex < selectedExercises.length; exerciseIndex++) {
        exerciseIds.push(selectedExercises[exerciseIndex].id);
    }

    return {
        id: createId(),
        name: name,
        exerciseIds: exerciseIds
    };
}

function createWorkout(selectedExercises) {
    const workoutExercises = [];

    for (let exerciseIndex = 0; exerciseIndex < selectedExercises.length; exerciseIndex++){
        const exercise = selectedExercises[exerciseIndex];
        const workoutExercise = createWorkoutExercise(exercise);

        workoutExercises.push(workoutExercise);
    }

    return {
        id: createId(),
        startedAt: new Date().toISOString(),
        exercises: workoutExercises
    };
}

function createWorkoutExercise(exercise){
    return {
        id: createId(),
        exerciseId: exercise.id,
        name: exercise.name,
        settings: copySettings(exercise.settings),
        sets: []
    }
}

function createWorkoutExerciseSet(weight, timeUnderLoad){
    return {
        id: createId(),
        weight: weight,
        timeUnderLoad: timeUnderLoad
    }
}

function loadExercises() {
    return loadItems(STORAGE_KEYS.exercises);
}

function getExerciseById(exerciseId) {
    const exercises = loadExercises();

    return exercises.find(function (exercise) {
        return exercise.id === exerciseId;
    });
}

function saveExercises(exercises) {
    saveItems(STORAGE_KEYS.exercises, exercises);
}

function loadTemplates() {
    return loadItems(STORAGE_KEYS.templates);
}

function saveTemplates(templates) {
    saveItems(STORAGE_KEYS.templates, templates);
}

function loadWorkouts() {
    return loadItems(STORAGE_KEYS.workouts);
}

function saveWorkouts(workouts) {
    saveItems(STORAGE_KEYS.workouts, workouts);
}

function loadSelectedProgressExerciseId() {
    return localStorage.getItem(STORAGE_KEYS.selectedProgressExerciseId);
}

function getSelectedProgressExercise() {
    const selectedExerciseId = loadSelectedProgressExerciseId();

    if (selectedExerciseId === null) {
        return null;
    }

    const exercise = getExerciseById(selectedExerciseId);

    if (exercise === undefined) {
        return null;
    }

    return exercise;
}

function saveSelectedProgressExerciseId(exerciseId) {
    localStorage.setItem(STORAGE_KEYS.selectedProgressExerciseId, exerciseId);
}

function addWorkout(workout) {
    const workouts = loadWorkouts();
    workouts.push(workout);
    saveWorkouts(workouts);
}

function updateWorkout(updatedWorkout) {
    const workouts = loadWorkouts();

    for (let workoutIndex = 0; workoutIndex < workouts.length; workoutIndex++) {
        if (workouts[workoutIndex].id === updatedWorkout.id) {
            workouts[workoutIndex] = updatedWorkout;
            saveWorkouts(workouts);
            return;
        }
    }

    workouts.push(updatedWorkout);
    saveWorkouts(workouts);
}

// --- Getters --- //

function getSetOfLastSession(exercise, setNumber) {
    if (exercise === undefined || exercise === null) {
        return null;
    }

    if (exercise.exerciseId === undefined) {
        return null;
    }

    const workoutsDescending = getDescendingArrayOfWorkouts();

    for (let workoutIndex = 0; workoutIndex < workoutsDescending.length; workoutIndex++) {
        const workout = workoutsDescending[workoutIndex];

        if (appState.activeWorkout !== null && workout.id === appState.activeWorkout.id) {
            continue;
        }

        const lastExercise = workout.exercises.find(function (workoutExercise) {
            return workoutExercise.exerciseId === exercise.exerciseId;
        });

        if (lastExercise === undefined) {
            continue;
        }

        const lastSet = lastExercise.sets[setNumber - 1];

        if (lastSet === undefined) {
            continue;
        }

        return lastSet;
    }

    return null;
}

function getDescendingArrayOfWorkouts() {
    const workouts = loadWorkouts();

    return workouts.slice().sort(function (a, b) {
        return new Date(b.startedAt) - new Date(a.startedAt);
    });

}

// --- Storage helpers --- //
function createId() {
    return crypto.randomUUID();
}

function copySettings(settings) {
    const copiedSettings = []

    for (let settingIndex = 0; settingIndex < settings.length; settingIndex++) {
        const setting = settings[settingIndex];

        copiedSettings.push({
            name: setting.name,
            value: setting.value
        });
    }

    return copiedSettings;
}
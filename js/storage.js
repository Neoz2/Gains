//storage.js

// =========================================================
// CONSTANTS
// =========================================================

const STORAGE_KEYS = {
    exercises: "gym-app-exercises",
    templates: "gym-app-templates",
    workouts: "gym-app-workouts",
    settings: "gym-app-settings",
    selectedProgressExerciseId: "gym-app-selected-progress-exercise-id"
};

// =========================================================
// LOCAL STORAGE HELPERS
// =========================================================

function loadItemsFromLocalStorage(storageKey) {
    const savedItems = localStorage.getItem(storageKey);

    if (savedItems === null) {
        return [];
    }

    const items = JSON.parse(savedItems);

    if (!Array.isArray(items)) {
        throw new Error(
            `Invalid localStorage data for ${storageKey}`
        );
    }

    return items;
}

function saveItemsToLocalStorage(storageKey, items) {
    const json = JSON.stringify(items);
    localStorage.setItem(storageKey, json);
}

// =========================================================
// DATA MODELS
// =========================================================

function createExercise(name, settings) {
    return {
        id: createId(),
        name: name,
        isArchived: false,
        settings: settings
    };
}

function createTemplate(name, selectedExerciseIds) {
    return {
        id: createId(),
        name: name,
        exerciseIds: selectedExerciseIds
    };
}

function createWorkout(selectedExercises) {
    const workoutExercises = [];

    for (let exerciseIndex = 0; exerciseIndex < selectedExercises.length; exerciseIndex++) {
        const exercise = selectedExercises[exerciseIndex];
        const workoutExercise = createWorkoutExercise(exercise);

        workoutExercises.push(workoutExercise);
    }

    return {
        id: createId(),
        startedAt: new Date().toISOString(),
        finishedAt: null,
        exercises: workoutExercises
    };
}

function createWorkoutExercise(exercise) {
    return {
        id: createId(),
        exerciseId: exercise.id,
        name: exercise.name,
        settings: copySettings(exercise.settings),
        sets: []
    };
}

function createWorkoutExerciseSet(weight, timeUnderLoad) {
    return {
        id: createId(),
        weight: weight,
        timeUnderLoad: timeUnderLoad
    };
}

function createDefaultSettings() {
    return {
        id: "preferences",
        minTul: 50,
        maxTul: 70,
        countdownSeconds: 10
    };
}

// =========================================================
// EXERCISE STORAGE
// =========================================================

function loadExercises() {
    return loadItemsFromLocalStorage(STORAGE_KEYS.exercises);
}

async function saveExercise(exercises, exercise) {
    saveItemsToLocalStorage(
        STORAGE_KEYS.exercises,
        exercises
    );

    await firebaseStorage.saveExerciseToFirebase(
        exercise
    );
}

function getExerciseById(exerciseId) {
    const exercises = loadExercises();

    return exercises.find(function (exercise) {
        return exercise.id === exerciseId;
    });
}

// =========================================================
// TEMPLATE STORAGE
// =========================================================

function loadTemplates() {
    return loadItemsFromLocalStorage(STORAGE_KEYS.templates);
}

async function saveTemplate(templates, template) {
    saveItemsToLocalStorage(
        STORAGE_KEYS.templates,
        templates
    );

    await firebaseStorage.saveTemplateToFirebase(
        template
    );
}

function getExercisesFromTemplate(template) {
    const exercises = loadExercises();
    const templateExercises = [];

    for (let exerciseIndex = 0; exerciseIndex < template.exerciseIds.length; exerciseIndex++) {
        const exerciseId = template.exerciseIds[exerciseIndex];

        const exercise = exercises.find(function (exercise) {
            return exercise.id === exerciseId;
        });

        if (exercise !== undefined) {
            templateExercises.push(exercise);
        }
    }

    return templateExercises;
}

// =========================================================
// WORKOUT STORAGE
// =========================================================

function loadWorkouts() {
    return loadItemsFromLocalStorage(STORAGE_KEYS.workouts);
}

async function deleteWorkout(workoutId) {
    const workouts = loadWorkouts();

    const updatedWorkouts = workouts.filter(function (workout) {
        return workout.id !== workoutId;
    });

    if (updatedWorkouts.length === workouts.length) {
        return;
    }

    saveItemsToLocalStorage(
        STORAGE_KEYS.workouts,
        updatedWorkouts
    );

    await firebaseStorage.deleteWorkoutFromFirebase(
        workoutId
    );
}

async function addWorkout(workout) {
    const workouts = loadWorkouts();

    workouts.push(workout);

    saveItemsToLocalStorage(
        STORAGE_KEYS.workouts,
        workouts
    );

    await firebaseStorage.saveWorkoutToFirebase(workout);
}

async function updateWorkout(updatedWorkout) {
    const workouts = loadWorkouts();

    const workoutIndex = workouts.findIndex(function (workout) {
        return workout.id === updatedWorkout.id;
    });

    if (workoutIndex === -1) {
        throw new Error(
            `Cannot update missing workout: ${updatedWorkout.id}`
        );
    }

    workouts[workoutIndex] = updatedWorkout;

    saveItemsToLocalStorage(
        STORAGE_KEYS.workouts,
        workouts
    );

    await firebaseStorage.saveWorkoutToFirebase(
        updatedWorkout
    );
}

function getDescendingArrayOfWorkouts() {
    const workouts = loadWorkouts();

    return workouts.slice().sort(function (a, b) {
        return new Date(b.startedAt) - new Date(a.startedAt);
    });
}

function getAscendingArrayOfWorkouts() {
    const workouts = loadWorkouts();

    return workouts.slice().sort(function (a, b) {
        return new Date(a.startedAt) - new Date(b.startedAt);
    });
}

function getSetOfLastSession(exercise, setNumber, ignoredWorkoutId = null) {
    if (exercise === undefined || exercise === null) {
        return null;
    }

    if (exercise.exerciseId === undefined) {
        return null;
    }

    const workoutsDescending = getDescendingArrayOfWorkouts();

    for (let workoutIndex = 0; workoutIndex < workoutsDescending.length; workoutIndex++) {
        const workout = workoutsDescending[workoutIndex];

        if (workout.id === ignoredWorkoutId) {
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

// =========================================================
// SELECTED PROGRESS EXERCISE STORAGE
// =========================================================

function loadSelectedProgressExerciseId() {
    return localStorage.getItem(STORAGE_KEYS.selectedProgressExerciseId);
}

function saveSelectedProgressExerciseId(exerciseId) {
    localStorage.setItem(
        STORAGE_KEYS.selectedProgressExerciseId,
        exerciseId
    );
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

// =========================================================
// SETTINGS STORAGE
// =========================================================

function loadSettings() {
    const savedSettings =
        localStorage.getItem(STORAGE_KEYS.settings);

    if (savedSettings === null) {
        const defaultSettings =
            createDefaultSettings();

        saveSettingsToLocalStorage(
            defaultSettings
        );

        return defaultSettings;
    }

    const settings =
        JSON.parse(savedSettings);

    if (
        settings === null ||
        typeof settings !== "object" ||
        Array.isArray(settings)
    ) {
        throw new Error(
            "Invalid local settings data"
        );
    }

    return settings;
}

function saveSettingsToLocalStorage(settings) {
    localStorage.setItem(
        STORAGE_KEYS.settings,
        JSON.stringify(settings)
    );
}

async function saveSettings(settings) {
    saveSettingsToLocalStorage(settings);

    await firebaseStorage.saveSettingsToFirebase(
        settings
    );
}

// =========================================================
// UTILITY HELPERS
// =========================================================

function createId() {
    return crypto.randomUUID();
}

function copySettings(settings) {
    const copiedSettings = [];

    for (let settingIndex = 0; settingIndex < settings.length; settingIndex++) {
        const setting = settings[settingIndex];

        copiedSettings.push({
            name: setting.name,
            value: setting.value
        });
    }

    return copiedSettings;
}
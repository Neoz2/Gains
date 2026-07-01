//storage.js

// =========================================================
// CONSTANTS
// =========================================================

const STORAGE_KEYS = {
	exercises: "gym-app-exercises",
	templates: "gym-app-templates",
	workouts: "gym-app-workouts"
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
		id: crypto.randomUUID(),
		name: name,
		settings: settings
	};
}

function createTemplate(name, selectedExercises) {
	const exerciseIds = [];

	for (let exerciseIndex = 0; exerciseIndex < selectedExercises.length; exerciseIndex++) {
		exerciseIds.push(selectedExercises[exerciseIndex].id);
	}

	return {
		id: crypto.randomUUID(),
		name: name,
		exerciseIds: exerciseIds
	};
}

function loadExercises() {
	return loadItems(STORAGE_KEYS.exercises);
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
//helpers.js

// =========================================================
// INPUT HELPERS
// =========================================================

function showInputError(inputElement) {
    inputElement.classList.remove("input-attention");

    requestAnimationFrame(function () {
        inputElement.classList.add("input-attention");

        setTimeout(function () {
            inputElement.classList.remove("input-attention");
        }, 900);
    });
}

function inputHasText(inputElement) {
    return inputElement.value.trim().length > 0;
}

// =========================================================
// UI HELPERS
// =========================================================

function rotateChevron(chevron) {
    chevron.classList.toggle("chevron-rotate");
}

function changeVisibility(item) {
    item.classList.toggle("hidden");
}

function runWithPressFeedback(element, action, pressDelay = 120, releaseDelay = 60) {
    element.classList.add("is-pressed");

    setTimeout(function () {
        element.classList.remove("is-pressed");

        setTimeout(function () {
            Promise.resolve()
                .then(action)
                .catch(function (error) {
                    console.error("Action failed:", error);
                });
        }, releaseDelay);
    }, pressDelay);
}

function showPressFeedback(element, delay = 120) {
    element.classList.add("is-pressed");

    setTimeout(function () {
        element.classList.remove("is-pressed");
    }, delay);
}

// =========================================================
// VALIDATION HELPERS
// =========================================================

function nameExistsInListExceptId(list, name, ignoredId) {
    const normalizedName = name.trim().toLowerCase();

    return list.some(function (item) {
        return item.name.trim().toLowerCase() === normalizedName && item.id !== ignoredId;
    });
}

// =========================================================
// FORMAT HELPERS
// =========================================================

function formatCountLabel(count, singularLabel) {
    const pluralAdjuster = count === 1 ? "" : "s";
    return `${count} ${singularLabel}${pluralAdjuster}`;
}

function formatWorkoutDate(isoDate) {
    const date = new Date(isoDate);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
    });
}

// =========================================================
// EXERCISE ARRAY HELPERS
// =========================================================

function addSelectedExercise(exercises, exercise) {
    const exerciseAlreadyExists = exercises.some(function (existingExercise) {
        return existingExercise.id === exercise.id;
    });

    if (!exerciseAlreadyExists) {
        exercises.push(exercise);
    }
}

function removeSelectedExercise(exercises, exercise) {
    const exerciseIndex = exercises.findIndex(function (existingExercise) {
        return existingExercise.id === exercise.id;
    });

    if (exerciseIndex !== -1) {
        exercises.splice(exerciseIndex, 1);
    }
}

// =========================================================
// ARRAY SORTING
// =========================================================

function setupTemplateExerciseSorting(selectedExercisesList) {
    if (templateExerciseSortable !== null) {
        templateExerciseSortable.destroy();
        templateExerciseSortable = null;
    }

    if (appState.templateSelectedExercises.length < 2) {
        return;
    }

    templateExerciseSortable = Sortable.create(selectedExercisesList, {
        animation: 150,
        handle: ".drag-handle",
        forceFallback: true,
        fallbackOnBody: true,
        fallbackTolerance: 0,

        onEnd: function (event) {
            moveArrayItem(
                appState.templateSelectedExercises,
                event.oldIndex,
                event.newIndex
            );
        }
    });
}

function moveArrayItem(items, fromIndex, toIndex) {
    if (
        fromIndex === undefined ||
        toIndex === undefined ||
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= items.length ||
        toIndex >= items.length
    ) {
        return false;
    }

    const movedItem = items.splice(fromIndex, 1)[0];

    items.splice(toIndex, 0, movedItem);

    return true;
}

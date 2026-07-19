//helpers.js

// =========================================================
// INPUT HELPERS
// =========================================================

function showInputError(inputElement) {
    inputElement.classList.add("input-error");
}

function clearInputError(inputElement) {
    inputElement.classList.remove("input-error");
}

function inputHasText(inputElement) {
    return inputElement.value.trim().length > 0;
}

function clearErrorWhenTyping(inputElement) {
    inputElement.addEventListener("input", function () {
        if (inputHasText(inputElement)) {
            clearInputError(inputElement);
        }
    });
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
            action();
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


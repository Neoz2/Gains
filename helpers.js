//helpers.js

// =========================================================
// HELPERS
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

function rotateChevron(chevron) {
    chevron.classList.toggle("chevron-rotate");
}

function changeVisibility(item) {
    if (item.classList.contains("hidden")) {
        item.classList.remove("hidden");
    } else {
        item.classList.add("hidden");
    }
}

function nameExistsInList(list, nameInput) {
    return list.some(function (item) {
        return item.name === nameInput;
    });
}

function formatCountLabel(count, string) {
    const pluralAdjuster = count === 1 ? "" : "s";
    return `${count} ${string}${pluralAdjuster}`;
}

// select from exercises
function addExerciseToArray(exercises, exercise) {
    const exerciseAlreadyExists = exercises.some(function (existingExercise) {
        return existingExercise.id === exercise.id;
    });

    if (!exerciseAlreadyExists) {
        exercises.push(exercise);
    }
}

function removeExerciseFromArray(exercises, exercise) {
    const exerciseIndex = exercises.findIndex(function (existingExercise) {
        return existingExercise.id === exercise.id;
    });

    if (exerciseIndex !== -1) {
        exercises.splice(exerciseIndex, 1);
    }
}
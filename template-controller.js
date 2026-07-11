//template-controller.js

// =========================================================
// DOM REFERENCES
// =========================================================

const templateNameInput = document.getElementById("template-name-input");
const saveTemplateButton = document.getElementById("save-template");
const emptyCreateTemplateButton = document.getElementById("empty-create-template");
const overviewCreateTemplateButton = document.getElementById("overview-create-template");
const templateList = document.getElementById("template-list");
const templatesEmptyState = document.querySelector(".templates-empty-state");
const templatesOverviewState = document.querySelector(".templates-overview-state");
const templatesFormState = document.querySelector(".templates-form-state");

// =========================================================
// TEMPLATE CONTROLLER
// =========================================================

// --- Controller entry points --- //

function setupTemplateController() {
    setupCreateTemplateButton();
    setupTemplateSaveButton();
}

function refreshTemplateScreen(mode = null) {
    appState.editingTemplateId = null;
    clearTemplateForm();
    updateSaveTemplateButtonText();

    if (mode === "form") {
        enterCreateTemplateMode();
        return;
    }

    renderTemplateOverview();
}

// --- Setup --- //

function setupCreateTemplateButton() {
    overviewCreateTemplateButton.addEventListener("click", function () {
        navigateToScreen("create-templates-screen", "form");
    });

    emptyCreateTemplateButton.addEventListener("click", function () {
        navigateToScreen("create-templates-screen", "form");
    });
}

function setupTemplateSaveButton() {
    clearErrorWhenTyping(templateNameInput);

    saveTemplateButton.addEventListener("click", saveTemplateFromForm);
}

// --- Modes --- //

function showTemplateMode(mode) {
    templatesEmptyState.classList.add("hidden");
    templatesOverviewState.classList.add("hidden");
    templatesFormState.classList.add("hidden");

    if (mode === "empty") {
        templatesEmptyState.classList.remove("hidden");
    } else if (mode === "overview") {
        templatesOverviewState.classList.remove("hidden");
    } else if (mode === "form") {
        templatesFormState.classList.remove("hidden");
    }
}

function enterCreateTemplateMode() {
    appState.editingTemplateId = null;

    clearTemplateForm();
    updateSaveTemplateButtonText();
    showTemplateMode("form");
}

function enterEditTemplateMode(template) {
    clearTemplateForm();
    showTemplateMode("form");

    appState.editingTemplateId = template.id;
    templateNameInput.value = template.name;

    const exercises = loadExercises();

    for (let exerciseIndex = 0; exerciseIndex < template.exerciseIds.length; exerciseIndex++) {
        const exerciseId = template.exerciseIds[exerciseIndex];

        const exercise = exercises.find(function (exercise) {
            return exercise.id === exerciseId;
        });

        if (exercise !== undefined) {
            selectTemplateExercise(exercise);
        }
    }

    updateSaveTemplateButtonText();
}

function exitEditTemplateMode() {
    appState.editingTemplateId = null;
    clearTemplateForm();
    updateSaveTemplateButtonText();
    renderTemplateOverview();
}

// --- Mutate actions --- //

function saveTemplateFromForm() {
    const templates = loadTemplates();
    const templateName = templateNameInput.value.trim();

    let formIsValid = true;

    if (templateName === "") {
        showInputError(templateNameInput);
        formIsValid = false;
    } else if (nameExistsInList(templates, templateName) && appState.editingTemplateId === null) {
        showInputError(templateNameInput);
        formIsValid = false;
    } else {
        clearInputError(templateNameInput);
    }

    if (appState.templateSelectedExercises.length === 0) {
        formIsValid = false;
        console.log("Select at least one exercise");
    }

    if (!formIsValid) {
        return;
    }

    if (appState.editingTemplateId === null) {
        const template = createTemplate(templateName, appState.templateSelectedExercises);
        templates.push(template);
    } else {
        const templateIndex = templates.findIndex(function (template) {
            return template.id === appState.editingTemplateId;
        });


        if (templateIndex === -1) {
            return;
        }

        const updatedTemplate = createTemplate(templateName, appState.templateSelectedExercises);
        updatedTemplate.id = appState.editingTemplateId;

        templates[templateIndex] = updatedTemplate;
    }

    saveTemplates(templates);
    exitEditTemplateMode();
}

function deleteCurrentTemplate() {
    const templates = loadTemplates();

    const templateIndex = templates.findIndex(function (template) {
        return template.id === appState.editingTemplateId;
    });

    if (templateIndex === -1) {
        return;
    }

    templates.splice(templateIndex, 1);

    saveTemplates(templates);
    exitEditTemplateMode();
}

function deleteTemplate(templates, templateIndex) {
    const deletedTemplateId = templates[templateIndex].id;

    templates.splice(templateIndex, 1);
    saveTemplates(templates);
    renderTemplateOverview();
}

function removeExerciseFromTemplates(deletedExerciseId) {
    const templates = loadTemplates();

    for (let templateIndex = 0; templateIndex < templates.length; templateIndex++) {
        const template = templates[templateIndex];

        template.exerciseIds = template.exerciseIds.filter(function (exerciseId) {
            return exerciseId !== deletedExerciseId;
        });
    }

    saveTemplates(templates);
    renderTemplateOverview();
}

// --- Selection actions --- //

function selectTemplateExercise(exercise) {
    removeExerciseFromArray(appState.templateUnselectedExercises, exercise);
    addExerciseToArray(appState.templateSelectedExercises, exercise);

    renderTemplateExerciseLists();
}

function unselectTemplateExercise(exercise) {
    removeExerciseFromArray(appState.templateSelectedExercises, exercise);
    addExerciseToArray(appState.templateUnselectedExercises, exercise);

    renderTemplateExerciseLists();
}

// --- Form helpers --- //

function clearTemplateForm() {
    templateNameInput.value = "";

    appState.templateSelectedExercises.length = 0;
    appState.templateUnselectedExercises.length = 0;

    const exercises = loadExercises();

    for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
        appState.templateUnselectedExercises.push(exercises[exerciseIndex]);
    }

    renderTemplateExerciseLists();
}

function updateSaveTemplateButtonText() {
    if (appState.editingTemplateId !== null) {
        saveTemplateButton.textContent = "Update template"
    } else {
        saveTemplateButton.textContent = "Save template"
    }
}

// --- Rendering --- //

function renderTemplateOverview() {
    const templates = loadTemplates();

    renderTemplateList(templates);

    if (templates.length === 0) {
        showTemplateMode("empty");
    } else {
        showTemplateMode("overview");
    }
}

function renderTemplateList(templates) {
    templateList.innerHTML = "";

    for (let templateIndex = 0; templateIndex < templates.length; templateIndex++) {
        const savedTemplateCard = createTemplateCard(templates, templateIndex);
        templateList.appendChild(savedTemplateCard);
    }
}

function renderTemplateExerciseLists() {
    renderSelectedTemplateExercises();
    renderAvailableTemplateExercises();
}

function renderAvailableTemplateExercises() {
    const availableExercisesList = document.querySelector(".template-unselected-items");

    availableExercisesList.innerHTML = "";

    for (let exerciseIndex = 0; exerciseIndex < appState.templateUnselectedExercises.length; exerciseIndex++) {
        const exercise = appState.templateUnselectedExercises[exerciseIndex];

        const row = createExercisePickerRow(exercise, false);

        row.addEventListener("click", function () {
            selectTemplateExercise(exercise);
        });

        availableExercisesList.appendChild(row);
    }
}

function renderSelectedTemplateExercises() {
    const selectedExercisesList = document.querySelector(".template-selected-items");

    selectedExercisesList.innerHTML = "";

    for (let exerciseIndex = 0; exerciseIndex < appState.templateSelectedExercises.length; exerciseIndex++) {
        const exercise = appState.templateSelectedExercises[exerciseIndex];

        const row = createExercisePickerRow(exercise, true);

        row.addEventListener("click", function () {
            unselectTemplateExercise(exercise);
        });

        selectedExercisesList.appendChild(row);
    }
}

// --- DOM builders --- //

function createTemplateCard(templates, templateIndex) {
    const template = templates[templateIndex];

    const card = createElement("li", "item-card");
    const header = createTemplateCardHeader(template);
    const details = createTemplateCardDetails(template);
    const actions = createTemplateCardActions(templates, templateIndex);

    const chevron = header.querySelector(".chevron-button");
    header.addEventListener("click", function () {
        rotateChevron(chevron);
        changeVisibility(details);
    });

    details.appendChild(actions);

    card.appendChild(header);
    card.appendChild(details);

    return card;
}

function createTemplateCardHeader(template) {
    const header = createElement("div", "card-header");
    const icon = createIcon("fa-solid", "fa-clipboard-list", "item-icon");
    const main = createTemplateCardMain(template);
    const chevron = createIconButton("fa-solid", "fa-chevron-right", "chevron-button");

    header.appendChild(icon);
    header.appendChild(main);
    header.appendChild(chevron);

    return header;
}

function createTemplateCardMain(template) {
    const main = createElement("div", "item-text");

    const title = createText(template.name, "item-title");

    const exerciseCount = template.exerciseIds.length;
    const subtitleText = formatCountLabel(exerciseCount, "exercise");
    const subtitle = createText(subtitleText, "item-subtitle");

    main.appendChild(title);
    main.appendChild(subtitle);

    return main;
}

function createTemplateCardDetails(template) {
    const details = createElement("div", "card-details");
    details.classList.add("hidden");

    const exercises = loadExercises();

    for (let exerciseIndex = 0; exerciseIndex < template.exerciseIds.length; exerciseIndex++) {
        const exerciseId = template.exerciseIds[exerciseIndex];

        const exercise = exercises.find(function (exercise) {
            return exercise.id === exerciseId;
        });

        if (exercise !== undefined) {
            const templateExerciseRow = createSavedTemplateExerciseRow(exercise);
            details.appendChild(templateExerciseRow);
        }
    }

    return details;
}

function createSavedTemplateExerciseRow(exercise) {
    const templateExerciseRow = createElement("div", "card-row");
    const templateExerciseName = createText(exercise.name, "setting-name");
    templateExerciseRow.appendChild(templateExerciseName);

    return templateExerciseRow;
}

function createTemplateCardActions(templates, exerciseIndex) {
    const actions = createElement("div", "card-actions");
    const editButton = createActionButton("fa-solid", "fa-pencil", "Edit");

    editButton.addEventListener("click", function () {
        enterEditTemplateMode(templates[exerciseIndex]);
    });

    const deleteButton = createActionButton("fa-regular", "fa-trash-can", "Delete");
    deleteButton.addEventListener("click", function () {
        deleteTemplate(templates, exerciseIndex);
    });

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    return actions;
}

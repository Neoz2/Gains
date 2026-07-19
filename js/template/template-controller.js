//template-controller.js

// =========================================================
// DOM REFERENCES
// =========================================================

//states
const templatesEmptyState = document.querySelector(".templates-empty-state");
const templatesOverviewState = document.querySelector(".templates-overview-state");
const templatesFormState = document.querySelector(".templates-form-state");

//mode titles
const templateModeTitle = document.getElementById("template-page-title");
const templateModeSubtitle = document.getElementById("template-page-subtitle");

//buttons
const saveTemplateButton = document.getElementById("save-template");
const emptyCreateTemplateButton = document.getElementById("empty-create-template");
const overviewCreateTemplateButton = document.getElementById("overview-create-template");

//content
const templateNameInput = document.getElementById("template-name-input");
const templateList = document.getElementById("template-list");


// =========================================================
// TEMPLATE CONTROLLER
// =========================================================

const TEMPLATE_MODES = [];

// --- Controller entry points --- //

function setupTemplateController() {
    setupTemplateCreateButtons();
    setupTemplateSaveButton();
    setupTemplateModes();
}

function refreshTemplateScreen(mode = null) {
    if (mode === "template-create-mode") {
        enterCreateTemplateMode();
        return;
    }

    resetTemplateFormAndShowOverview();
}

// --- Setup --- //

function setupTemplateModes() {
    TEMPLATE_MODES.push(createMode(templatesEmptyState, "template-empty-mode", "Create templates", "Create your first workout template"));
    TEMPLATE_MODES.push(createMode(templatesFormState, "template-create-mode", "Create template", "Combine exercises into a reusable plan"));
    TEMPLATE_MODES.push(createMode(templatesFormState, "template-edit-mode", "Edit template", "Update this reusable workout plan"));
    TEMPLATE_MODES.push(createMode(templatesOverviewState, "template-overview-mode", "Create templates", "Manage your saved workout templates"));
}

function setupTemplateCreateButtons() {
    navigateOnClick(overviewCreateTemplateButton, "create-templates-screen", "template-create-mode");
    navigateOnClick(emptyCreateTemplateButton, "create-templates-screen", "template-create-mode");
}

function setupTemplateSaveButton() {
    clearErrorWhenTyping(templateNameInput);

    saveTemplateButton.addEventListener("click", function () {
        runWithPressFeedback(saveTemplateButton, saveTemplateFromForm);
    });
}

// --- Modes --- //

function showTemplateMode(mode) {
    hideAllStates(TEMPLATE_MODES);
    showCurrentMode(mode, TEMPLATE_MODES, templateModeTitle, templateModeSubtitle);
}

function enterCreateTemplateMode() {
    appState.editingTemplateId = null;

    clearTemplateForm();
    updateSaveTemplateButtonText();

    showTemplateMode("template-create-mode");
}

function enterEditTemplateMode(template) {
    clearTemplateForm();
    showTemplateMode("template-edit-mode");

    appState.editingTemplateId = template.id;
    templateNameInput.value = template.name;

    const exercises = getExercisesFromTemplate(template);

    for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
        const exercise = exercises[exerciseIndex];
        selectTemplateExercise(exercise);
    }

    updateSaveTemplateButtonText();
}

function resetTemplateFormAndShowOverview() {
    appState.editingTemplateId = null;

    clearTemplateForm();
    updateSaveTemplateButtonText();

    renderTemplateOverview();
}

// --- Mutate actions --- //

function saveTemplateFromForm() {
    const templates = loadTemplates();
    const templateName = templateNameInput.value.trim();

    if (!templateFormIsValid(templateName, templates)) {
        return;
    }

    const exerciseIds = getExerciseIdsFromSelectedExercises(appState.templateSelectedExercises);
    const templateWasSaved = saveTemplateToList(templates, templateName, exerciseIds);

    if (!templateWasSaved) {
        return;
    }

    saveTemplates(templates);
    resetTemplateFormAndShowOverview();
}

function saveTemplateToList(templates, templateName, exerciseIds) {
    if (appState.editingTemplateId === null) {
        const template = createTemplate(templateName, exerciseIds);
        templates.push(template);
        return true;
    }

    const templateIndex = templates.findIndex(function (template) {
        return template.id === appState.editingTemplateId;
    });

    if (templateIndex === -1) {
        return false;
    }

    const existingTemplate = templates[templateIndex];

    templates[templateIndex] = {
        ...existingTemplate,
        name: templateName,
        exerciseIds: exerciseIds
    };

    return true;
}

function deleteTemplate(templateId) {
    const templates = loadTemplates();

    const updatedTemplates = templates.filter(function (template) {
        return template.id !== templateId;
    });

    saveTemplates(updatedTemplates);
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
}

// --- Selection actions --- //

function selectTemplateExercise(exercise) {
    removeSelectedExercise(appState.templateUnselectedExercises, exercise);
    addSelectedExercise(appState.templateSelectedExercises, exercise);
    renderTemplateExerciseLists();
}

function unselectTemplateExercise(exercise) {
    removeSelectedExercise(appState.templateSelectedExercises, exercise);
    addSelectedExercise(appState.templateUnselectedExercises, exercise);
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
        saveTemplateButton.textContent = "Update template";
    } else {
        saveTemplateButton.textContent = "Save template";
    }
}

function getExerciseIdsFromSelectedExercises(selectedExercises) {
    return selectedExercises.map(function (exercise) {
        return exercise.id;
    });
}

function templateFormIsValid(templateName, templates) {
    let formIsValid = true;

    if (templateName === "") {
        showInputError(templateNameInput);
        console.log("Empty name not allowed");
        formIsValid = false;
    } else if (nameExistsInListExceptId(templates, templateName, appState.editingTemplateId)) {
        showInputError(templateNameInput);
        console.log("Name exists");
        formIsValid = false;
    } else {
        clearInputError(templateNameInput);
    }

    if (appState.templateSelectedExercises.length === 0) {
        formIsValid = false;
        console.log("Select at least one exercise");
    }

    return formIsValid;
}

// --- Rendering --- //

function renderTemplateOverview() {
    const templates = loadTemplates();

    renderTemplateList(templates);

    if (templates.length === 0) {
        showTemplateMode("template-empty-mode");
    } else {
        showTemplateMode("template-overview-mode");
    }
}

function renderTemplateList(templates) {
    templateList.innerHTML = "";

    for (let templateIndex = 0; templateIndex < templates.length; templateIndex++) {
        const template = templates[templateIndex];
        const savedTemplateCard = createTemplateCard(template);
        templateList.append(savedTemplateCard);
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
            runWithPressFeedback(row, function () {
                selectTemplateExercise(exercise);
            }, 60);
        });

        availableExercisesList.append(row);
    }
}

function renderSelectedTemplateExercises() {
    const selectedExercisesList = document.querySelector(".template-selected-items");

    selectedExercisesList.innerHTML = "";

    for (let exerciseIndex = 0; exerciseIndex < appState.templateSelectedExercises.length; exerciseIndex++) {
        const exercise = appState.templateSelectedExercises[exerciseIndex];

        const row = createExercisePickerRow(exercise, true);

        row.addEventListener("click", function () {
            runWithPressFeedback(row, function () {
                unselectTemplateExercise(exercise);
            }, 60);
        });

        selectedExercisesList.append(row);
    }
}

// --- DOM builders --- //

function createTemplateCard(template) {
    const card = createElement("li", "item-card");
    const header = createTemplateCardHeader(template);
    header.classList.add("interactive", "interactive-row");
    const details = createTemplateCardDetails(template);
    const actions = createTemplateCardActions(template);

    const chevron = header.querySelector(".chevron-button");

    header.addEventListener("click", function () {
        showPressFeedback(header);
        rotateChevron(chevron);
        changeVisibility(details);
    });

    details.append(actions);
    card.append(header, details);

    return card;
}

function createTemplateCardHeader(template) {
    const header = createElement("div", "card-header");

    const iconBadge = createElement("span", "icon-badge");
    const icon = createIcon("fa-solid", "fa-clipboard-list", "item-icon");

    const main = createTemplateCardMain(template);
    const chevron = createIconButton("fa-solid", "fa-chevron-right", "chevron-button");

    iconBadge.append(icon);
    header.append(iconBadge, main, chevron);

    return header;
}

function createTemplateCardMain(template) {
    const main = createElement("div", "item-text");

    const title = createText(template.name, "item-title");

    const exerciseCount = template.exerciseIds.length;
    const subtitleText = formatCountLabel(exerciseCount, "exercise");
    const subtitle = createText(subtitleText, "item-subtitle");

    main.append(title, subtitle);

    return main;
}

function createTemplateCardDetails(template) {
    const details = createElement("div", "card-details");
    details.classList.add("hidden");

    const exercises = getExercisesFromTemplate(template);

    for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
        const exercise = exercises[exerciseIndex];

        const templateExerciseRow = createSavedTemplateExerciseRow(exercise);
        details.append(templateExerciseRow);
    }

    return details;
}

function createSavedTemplateExerciseRow(exercise) {
    const templateExerciseRow = createElement("div", "card-row");
    const templateExerciseName = createText(exercise.name, "setting-name");
    templateExerciseRow.append(templateExerciseName);

    return templateExerciseRow;
}

function createTemplateCardActions(template) {
    const actions = createElement("div", "card-actions");
    const editButton = createActionButton("fa-solid", "fa-pencil", "Edit");

    editButton.addEventListener("click", function () {
        runWithPressFeedback(editButton, function () {
            enterEditTemplateMode(template);
        });
    });

    const deleteButton = createActionButton("fa-regular", "fa-trash-can", "Delete");
    deleteButton.addEventListener("click", function () {
        runWithPressFeedback(deleteButton, function () {
            deleteTemplate(template.id);
        });
    });

    actions.append(editButton, deleteButton);

    return actions;
}
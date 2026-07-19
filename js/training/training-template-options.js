//training-template-options.js

// --- Helpers --- //

function getUsableTemplates() {
    const templates = loadTemplates();

    return templates.filter(function (template) {
        return template.exerciseIds.length > 0;
    });
}

// --- Rendering --- //

function renderWorkoutTemplateList() {
    const availableTemplateList = document.getElementById("workout-template-list");
    availableTemplateList.innerHTML = "";

    const usableTemplates = getUsableTemplates();

    for (let templateIndex = 0; templateIndex < usableTemplates.length; templateIndex++) {
        const templateCard = createTemplateOption(usableTemplates[templateIndex]);
        availableTemplateList.append(templateCard);
    }
}

// --- DOM builders --- //

function createTemplateOption(template) {
    const card = createElement("li", "item-card", "interactive", "interactive-row");
    const header = createElement("div", "card-header");

    const iconBadge = createElement("span", "icon-badge");
    const icon = createIcon("fa-solid", "fa-clipboard-list", "item-icon");

    const main = createElement("div", "item-text");

    const title = createText(template.name, "item-title");
    const subtitle = createText(formatCountLabel(template.exerciseIds.length, "exercise"), "item-subtitle");

    const startButton = createButton("action-button");
    startButton.textContent = "Start";

    iconBadge.append(icon);
    main.append(title, subtitle);
    header.append(iconBadge, main, startButton);
    card.append(header);

    card.addEventListener("click", function () {
        runWithPressFeedback(card, function () {
            const templateExercises = getExercisesFromTemplate(template);
            enterWorkoutState(templateExercises);
        }, 90);
    });

    return card;
}
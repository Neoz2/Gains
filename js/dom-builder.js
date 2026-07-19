//dom-builder.js

// =========================================================
// GENERIC DOM BUILDERS
// =========================================================

function updatePageHeader(titleElement, subtitleElement, title, subtitle) {
	titleElement.textContent = title;
	subtitleElement.textContent = subtitle;
}

function createActionButton(iconClassBase, iconClassIcon, text) {
	const button = createButton("action-button");
	const icon = createIcon(iconClassBase, iconClassIcon);
	const label = createText(text, "action-button-text");

	button.append(icon, label);

	return button;
}

function createText(text, ...classes) {
	const label = document.createElement("span");
	label.textContent = text;

	addClasses(label, classes);

	return label;
}

function createTextInput(placeholder, ...classes) {
	const input = document.createElement("input");
	input.placeholder = placeholder;

	input.classList.add("text-input");
	addClasses(input, classes);

	return input;
}

function createIconButton(iconClassBase, iconClassIcon, ...classes) {
	const button = createButton(...classes);
	const icon = createIcon(iconClassBase, iconClassIcon);
	button.classList.add("interactive-subtle");

	button.append(icon);

	return button;
}

function createIcon(iconClassBase, iconClassIcon, ...classes) {
	const icon = document.createElement("i");

	icon.classList.add(iconClassBase);
	icon.classList.add(iconClassIcon);
	addClasses(icon, classes);

	return icon;
}

function createElement(type, ...classes) {
	const element = document.createElement(type);

	addClasses(element, classes);

	return element;
}

function createButton(...classes) {
	const button = document.createElement("button");
	button.type = "button";

	button.classList.add("interactive");
	addClasses(button, classes);

	return button;
}

function addClasses(element, classes) {
	for (let classIndex = 0; classIndex < classes.length; classIndex++) {
		const className = classes[classIndex];

		if (className !== undefined && className !== null && className !== "") {
			element.classList.add(className);
		}
	}
}

// =========================================================
// SHARED APP DOM BUILDERS
// =========================================================

function createExercisePickerRow(exercise, isSelected) {
	const row = createButton("interactive-row");

	if (isSelected) {
		row.classList.add("selected-exercise-row");

		const barsIcon = createIcon("fa-solid", "fa-grip-vertical");
		row.append(barsIcon);
	} else {
		row.classList.add("available-exercise-row");
	}

	const exerciseName = createText(exercise.name);

	let checkIcon;

	if (isSelected) {
		checkIcon = createIcon("fa-solid", "fa-circle-check", "exercise-picker-status-icon");
	} else {
		checkIcon = createIcon("fa-regular", "fa-circle", "exercise-picker-status-icon");
	}

	row.append(exerciseName, checkIcon);

	return row;
}


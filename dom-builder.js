// =========================================================
// DOM BUILDERS: GENERIC
// =========================================================

function createActionButton(iconClassBase, iconClassIcon, text) {
	const button = createButton("action-button");
	const icon = createIcon(iconClassBase, iconClassIcon);
	const label = createText(text, "action-button-text");

	button.appendChild(icon);
	button.appendChild(label);

	return button;
}

function createText(text, extraClass) {
	const label = document.createElement("span");
	label.textContent = text;

	if (extraClass !== undefined) {
		label.classList.add(extraClass);
	}

	return label;
}

function createTextInput(placeholder, extraClass) {
	const input = document.createElement("input");
	input.placeholder = placeholder;

	input.classList.add("text-input");
	input.classList.add(extraClass);

	return input;
}

function createIconButton(iconClassBase, iconClassIcon, extraClass) {
	const button = createButton(extraClass);
	const icon = createIcon(iconClassBase, iconClassIcon);

	button.appendChild(icon);

	return button;
}

function createIcon(iconClassBase, iconClassIcon, extraClass) {
	const icon = document.createElement("i");

	icon.classList.add(iconClassBase);
	icon.classList.add(iconClassIcon);

	if (extraClass !== undefined) {
		icon.classList.add(extraClass);
	}

	return icon;
}

function createElement(type, extraClass) {
	const element = document.createElement(type);

	if (extraClass !== undefined) {
		element.classList.add(extraClass);
	}

	return element;
}

function createButton(className) {
	const button = document.createElement("button");
	button.type = "button";

	if (className !== undefined) {
		button.classList.add(className);
	}

	return button;
}
//settings-controller.js

// =========================================================
// CONSTANTS
// =========================================================

const maxTulTime = document.getElementById("setting-time-number-max");
const maxTulMinus = document.getElementById("max-tul-minus-button");
const maxTulPlus = document.getElementById("max-tul-plus-button");

const minTulTime = document.getElementById("setting-time-number-min");
const minTulMinus = document.getElementById("min-tul-minus-button");
const minTulPlus = document.getElementById("min-tul-plus-button");

const countdownTime = document.getElementById("setting-time-number-countdown");
const countdownMinus = document.getElementById("countdown-minus-button");
const countdownPlus = document.getElementById("countdown-plus-button");

let maxTulValue = null;
let minTulValue = null;
let countdownValue = null;

// =========================================================
// SETTINGS CONTROLLER 
// =========================================================

function setupSettingsController() {
    setupVariables();
    setupAddAndSubtractButtons();
}

// =========================================================
// SETUP
// =========================================================

function setupVariables() {
    const settings = loadSettings();

    maxTulValue = settings.maxTul;
    minTulValue = settings.minTul;
    countdownValue = settings.countdownSeconds;

    renderSettingsValues();
}

function setupAddAndSubtractButtons() {
    maxTulMinus.addEventListener("click", function () {
        maxTulValue = calculate(maxTulValue)
            .subtract(1)
            .withLowerLimit(minTulValue + 5)
            .result();

        renderSettingsValues();
        saveCurrentSettings();
    })

    maxTulPlus.addEventListener("click", function () {
        maxTulValue = calculate(maxTulValue)
            .add(1)
            .withUpperLimit(300)
            .result();

        renderSettingsValues();
        saveCurrentSettings();
    })

    minTulMinus.addEventListener("click", function () {
        minTulValue = calculate(minTulValue)
            .subtract(1)
            .withLowerLimit(0)
            .result();

        renderSettingsValues();
        saveCurrentSettings();
    })

    minTulPlus.addEventListener("click", function () {
        minTulValue = calculate(minTulValue)
            .add(1)
            .withUpperLimit(maxTulValue - 5)
            .result();

        renderSettingsValues();
        saveCurrentSettings();
    })

    countdownMinus.addEventListener("click", function () {
        countdownValue = calculate(countdownValue)
            .subtract(1)
            .withLowerLimit(0)
            .result();

        renderSettingsValues();
        saveCurrentSettings();
    })

    countdownPlus.addEventListener("click", function () {
        countdownValue = calculate(countdownValue)
            .add(1)
            .withUpperLimit(60)
            .result();

        renderSettingsValues();
        saveCurrentSettings();
    })
}

// =========================================================
// RENDERING
// =========================================================

function renderSettingsValues() {
    maxTulTime.textContent = maxTulValue;
    minTulTime.textContent = minTulValue;
    countdownTime.textContent = countdownValue;
}

// =========================================================
// HELPERS
// =========================================================

function calculate(value) {
    return {
        value: value,

        add(amount) {
            this.value += amount;
            return this;
        },

        subtract(amount) {
            this.value -= amount;
            return this;
        },

        withUpperLimit(limit) {
            this.value = Math.min(
                this.value,
                limit
            );

            return this;
        },

        withLowerLimit(limit) {
            this.value = Math.max(
                this.value,
                limit
            );

            return this;
        },

        result() {
            return this.value;
        }
    }
}

async function saveCurrentSettings() {
    const settings = {
        id: "preferences",
        minTul: minTulValue,
        maxTul: maxTulValue,
        countdownSeconds: countdownValue
    };

    await saveSettings(settings);
}



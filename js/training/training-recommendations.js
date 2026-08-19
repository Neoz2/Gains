//training-recommendations.js

// =========================================================
// RECOMMENDATION HELPERS
// =========================================================

function getRecommendationForExercise(exercise) {
    const nextSetNumber = exercise.sets.length + 1;
    const ignoredWorkoutId = appState.activeWorkout === null ? null : appState.activeWorkout.id;
    const lastSet = getSetOfLastSession(exercise, nextSetNumber, ignoredWorkoutId);

    if (lastSet === null) {
        return null;
    }

    return {
        lastSet: lastSet,
        config: createRecommendationConfiguration(lastSet.timeUnderLoad)
    };
}

function createRecommendationConfiguration(timeUnderLoad) {
    const settings = loadSettings();

    if (timeUnderLoad < settings.minTul) {
        return {
            recommendationState: "bad",
            indicationIconStyle: "fa-arrow-trend-down",
            title: "Decrease weight this workout",
            baseText: "Below ",
            targetText: formatShortTimer(settings.minTul),
            endText: " minimum"
        };
    }

    if (timeUnderLoad >= settings.maxTul) {
        return {
            recommendationState: "good",
            indicationIconStyle: "fa-arrow-trend-up",
            title: "Increase weight this workout",
            baseText: "Above ",
            targetText: formatShortTimer(settings.maxTul),
            endText: " target"
        };
    }

    return {
        recommendationState: "same",
        indicationIconStyle: "fa-arrow-right-arrow-left",
        title: "Stick to weight this workout",
        baseText: "Within ",
        targetText: `${formatShortTimer(settings.minTul)} - ${formatShortTimer(settings.maxTul)}`,
        endText: " range"
    };
}

// =========================================================
// DOM BUILDERS
// =========================================================

function createRecommendationCard(exercise) {
    const recommendation = getRecommendationForExercise(exercise);

    if (recommendation === null) {
        return null;
    }

    const recommendationContainer = createElement("div", "recommendation-container", recommendation.config.recommendationState);
    const infoContainer = createElement("div", "info-container");

    const indicationIcon = createElement("div", "indication-icon");
    const indicationIconSymbol = createIcon("fa-solid", recommendation.config.indicationIconStyle, "indication-icon-symbol");

    const titleText = createText(recommendation.config.title, "text-field", "info-container-title");

    const lastSessionTextContainer = createRecommendationTextRow("fa-regular", "fa-clock", "Last session: ", formatTimer(recommendation.lastSet.timeUnderLoad), " TUL");
    const targetTextContainer = createRecommendationTextRow("fa-solid", "fa-bullseye", recommendation.config.baseText, recommendation.config.targetText, recommendation.config.endText);

    indicationIcon.append(indicationIconSymbol);
    infoContainer.append(titleText, lastSessionTextContainer, targetTextContainer);
    recommendationContainer.append(indicationIcon, infoContainer);

    return recommendationContainer;
}

function createRecommendationTextRow(iconType, iconStyle, startText, highlightText, endText) {
    const container = createElement("div");
    const icon = createIcon(iconType, iconStyle, "recommendation-text-icon");
    const start = createText(startText, "text-field");
    const highlight = createText(highlightText, "text-field", "recommend-highlight");
    const end = createText(endText, "text-field");

    container.append(icon, start, highlight, end);

    return container;
}

// =========================================================
// HELPERS
// =========================================================

function formatShortTimer(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const formattedSeconds =
        String(seconds).padStart(2, "0");

    return `${minutes}:${formattedSeconds}`;
}

//login-controller.js

// =========================================================
// DOM REFERENCES
// =========================================================

const loginWithGoogleButton = document.getElementById("google-login-button");

// =========================================================
// LOGIN CONTROLLER
// =========================================================

// --- Controller entry points --- //

function setupLoginController() {
    loginWithGoogleButton.addEventListener("click", function () {
        runWithPressFeedback(loginWithGoogleButton, startAuthProcess, 120, 200);
    });
}

async function startAuthProcess() {
    await firebaseStorage.signInWithGoogle();

    firebaseStorage.waitForAuthReady();

    const user = firebaseStorage.getCurrentUser();

    if (user) {
        showScreen("home-screen");
    } 
};
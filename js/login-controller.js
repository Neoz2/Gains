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
    console.log(loginWithGoogleButton);
    loginWithGoogleButton.addEventListener("click", function () {
        runWithPressFeedback(loginWithGoogleButton, startAuthProcess, 120, 200);
    });
}

async function startAuthProcess() {
    console.log("hi");
    await firebaseStorage.signInWithGoogle();

    firebaseStorage.waitForAuthReady();

    const user = firebaseStorage.getCurrentUser();

    if (user) {
        showScreen("home-screen");
    } else {
        console.log('no one logged in yet after auth process');
    }
};
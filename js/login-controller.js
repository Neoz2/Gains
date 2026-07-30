//login-controller.js

// =========================================================
// DOM REFERENCES
// =========================================================

const loginWithGoogleButton = document.getElementById("google-login-button");
const signOutButton = document.getElementById("logout-button");

// =========================================================
// LOGIN CONTROLLER
// =========================================================

// --- Controller entry points --- //

function setupLoginController() {
    loginWithGoogleButton.addEventListener("click", function () {
        runWithPressFeedback(loginWithGoogleButton, startAuthProcess, 120, 200);
    });

    signOutButton.addEventListener("click", function () {
        runWithPressFeedback(signOutButton, startSignOutProcess, 120, 100);
    });
}

async function startAuthProcess() {
    try {
        await firebaseStorage.signInWithGoogle();
    } catch (error) {
        console.error("Could not sign in:", error);
    }
}

async function startSignOutProcess() {
    try {
        await firebaseStorage.signOutUser();
    } catch (error) {
        console.error("Could not sign out:", error);
    }
}
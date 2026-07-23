//firebase-storage.js

// =========================================================
// IMPORTS
// =========================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc
}
    from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

// =========================================================
// CONSTANTS
// =========================================================

const firebaseConfig = {
    apiKey: "AIzaSyDXPBuPCmoPjal3h3TAGZQlHwhQHQzIpdM",
    authDomain: "gains-neoz.firebaseapp.com",
    projectId: "gains-neoz",
    storageBucket: "gains-neoz.firebasestorage.app",
    messagingSenderId: "145712550259",
    appId: "1:145712550259:web:4f1dd09cba92a5f0423506"
};

const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

let currentUser = null;
let saveQueue = Promise.resolve();

console.log("Firebase connected", firestore);

// =========================================================
// FIREBASE CONTROLLER
// =========================================================

async function setupFirebaseSync() {
    const firebaseAppData = await loadAllFromFirebase();

    if (firebaseAppData === null) {
        const localAppData = createAppDataFromLocalStorage();
        await saveAllToFirebase(localAppData);

        console.log("Created Firebase data from local storage");
        return;
    }

    saveAppDataToLocalStorage(firebaseAppData);
    console.log("Restored app data from Firebase");
}


// =========================================================
// STORAGE FUNCTIONS
// =========================================================

async function loadAllFromFirebase() {
    const appDataRef = getAppDataRef();
    const snapshot = await getDoc(appDataRef);

    if (!snapshot.exists()) {
        console.log("No Firebase app data yet");
        return null;
    }

    const data = snapshot.data();
    console.log("Loaded Firebase app data:", data);

    return data;
}

async function performFirebaseSave(appData) {
    const appDataRef = getAppDataRef();

    await setDoc(appDataRef, {
        ...appData,
        updatedAt: new Date().toISOString()
    });

    console.log("Saved Firebase app data:", appData);
}

function saveAllToFirebase(appData) {
    saveQueue = saveQueue
        .catch(function (error) {
            console.error("Previous Firebase save failed:", error);
        })
        .then(function () {
            return performFirebaseSave(appData);
        });

    return saveQueue;
}

// =========================================================
// AUTHENTICATION
// =========================================================

async function signInWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
}

const authReadyPromise = new Promise(function (resolve) {
    onAuthStateChanged(auth, function (user) {
        currentUser = user;

        if (user) {
            console.log("Logged in as", user.uid);
        } else {
            console.log("No user logged in");
        }

        resolve(user);
    });
});

function waitForAuthReady() {
    return authReadyPromise;
}

function getCurrentUser() {
    return currentUser;
}

async function signOutUser() {
    await signOut(auth);
    navigateToScreen("login-screen");
    hideBottomNav();
    console.log("Signed out");
}

function isSignedIn() {
    return currentUser !== null;
}

function getAppDataRef() {
    if (!currentUser) {
        throw new Error("Cannot access Firebase storage without a logged-in user");
    }

    return doc(
        firestore,
        "users",
        currentUser.uid,
        "appData",
        "current"
    );
}

// =========================================================
// HELPERS
// =========================================================

function createAppDataFromLocalStorage() {
    return {
        exercises: loadExercises(),
        templates: loadTemplates(),
        workouts: loadWorkouts(),
        selectedProgressExerciseId: loadSelectedProgressExerciseId()
    };
}

function saveAppDataToLocalStorage(appData) {
    saveItemsToLocalStorage(STORAGE_KEYS.exercises, appData.exercises || []);
    saveItemsToLocalStorage(STORAGE_KEYS.templates, appData.templates || []);
    saveItemsToLocalStorage(STORAGE_KEYS.workouts, appData.workouts || []);

    if (appData.selectedProgressExerciseId === null || appData.selectedProgressExerciseId === undefined) {
        localStorage.removeItem(STORAGE_KEYS.selectedProgressExerciseId);
        return;
    }

    localStorage.setItem(
        STORAGE_KEYS.selectedProgressExerciseId,
        appData.selectedProgressExerciseId
    );
}

// =========================================================
// PUBLIC API
// =========================================================

window.firebaseStorage = {
    loadAllFromFirebase,
    saveAllToFirebase,
    createAppDataFromLocalStorage,
    saveAppDataToLocalStorage,
    setupFirebaseSync,
    signInWithGoogle,
    signOutUser,
    isSignedIn,
    waitForAuthReady,
    getCurrentUser
};

window.dispatchEvent(new Event("firebaseStorageReady"));
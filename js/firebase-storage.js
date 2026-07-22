//firebase-storage.js

// =========================================================
// IMPORTS
// =========================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

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

const USER_ID = "personal";
const APP_DATA_REF = doc(firestore, "users", USER_ID, "appData", "current");

console.log("Firebase connected", firestore);

// =========================================================
// FIREBASE CONTROLLER
// =========================================================

async function setupFirebaseSync() {
    const firebaseAppData = await loadAllFromFirebase();

    if (firebaseAppData === null) {
        const emptyAppData = {
            exercises: [],
            templates: [],
            workouts: [],
            selectedProgressExerciseId: null
        };    

    await saveAllToFirebase(emptyAppData);
    saveAppDataToLocalStorage(emptyAppData);
    return;
    }

    saveAppDataToLocalStorage(firebaseAppData);
}

// =========================================================
// STORAGE FUNCTIONS
// =========================================================

async function loadAllFromFirebase() {
    const snapshot = await getDoc(APP_DATA_REF);

    if (!snapshot.exists()) {
        console.log("No Firebase app data yet");
        return null;
    }

    const data = snapshot.data();
    console.log("Loaded Firebase app data:", data);

    return data;
}

async function saveAllToFirebase(appData) {
    await setDoc(APP_DATA_REF, {
        ...appData,
        updatedAt: new Date().toISOString()
    });

    console.log("Saved Firebase app data:", appData);
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
    setupFirebaseSync
};

window.dispatchEvent(new Event("firebaseStorageReady"));
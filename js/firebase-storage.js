//firebase-storage.js

// =========================================================
// IMPORTS
// =========================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc
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

const PENDING_WRITES_KEY_PREFIX = "gym-app-pending-firebase-writes-";

const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

let currentUser = null;
let saveQueue = Promise.resolve();

// =========================================================
// FIREBASE CONTROLLER
// =========================================================

async function setupFirebaseSync() {
    await retryPendingFirebaseWrites();

    const exercises =
        await loadCollectionFromFirebase(
            "exercises"
        );

    const templates =
        await loadCollectionFromFirebase(
            "templates"
        );

    const workouts =
        await loadCollectionFromFirebase(
            "workouts"
        );

    const appData = {
        exercises: exercises,
        templates: templates,
        workouts: workouts
    };

    validateAppData(appData);
    saveAppDataToLocalStorage(appData);
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
    try {
        await waitForPendingSaves();
    } catch (error) {
        console.error(
            "Pending Firebase save failed:",
            error
        );
    }

    await retryPendingFirebaseWrites();

    await signOut(auth);

    clearLocalAppData();
}

function isSignedIn() {
    return currentUser !== null;
}

function subscribeToAuthChanges(callback) {
    return onAuthStateChanged(auth, callback);
}

async function waitForPendingSaves() {
    await saveQueue;
}

// =========================================================
// STORAGE FUNCTIONS
// =========================================================

function saveExerciseToFirebase(exercise) {
    return saveDocumentToFirebase(
        "exercises",
        exercise
    );
}

function deleteExerciseFromFirebase(exerciseId) {
    return deleteDocumentFromFirebase(
        "exercises",
        exerciseId
    );
}

function saveTemplateToFirebase(template) {
    return saveDocumentToFirebase(
        "templates",
        template
    );
}

function deleteTemplateFromFirebase(templateId) {
    return deleteDocumentFromFirebase(
        "templates",
        templateId
    );
}

function saveWorkoutToFirebase(workout) {
    return saveDocumentToFirebase(
        "workouts",
        workout
    );
}

function deleteWorkoutFromFirebase(workoutId) {
    return deleteDocumentFromFirebase(
        "workouts",
        workoutId
    );
}

// =========================================================
// FIREBASE HELPERS
// =========================================================

function getUserCollectionRef(collectionName) {
    if (currentUser === null) {
        throw new Error("Cannot access Firebase without logged-in user");
    }

    return collection(
        firestore,
        "users",
        currentUser.uid,
        collectionName
    );
}

function saveDocumentToFirebase(
    collectionName,
    item
) {
    const user = currentUser;

    if (user === null) {
        return Promise.reject(
            new Error(
                "Cannot save without logged-in user"
            )
        );
    }

    const itemSnapshot =
        structuredClone(item);

    const pendingWrite = {
        id: crypto.randomUUID(),
        type: "save",
        collectionName: collectionName,
        documentId: itemSnapshot.id,
        data: itemSnapshot
    };

    storePendingWrite(
        user.uid,
        pendingWrite
    );

    return queueFirebaseWrite(
        user,
        async function () {
            await performPendingWrite(
                user,
                pendingWrite
            );

            removePendingWrite(
                user.uid,
                pendingWrite.id
            );
        }
    );
}

function deleteDocumentFromFirebase(
    collectionName,
    documentId
) {
    const user = currentUser;

    if (user === null) {
        return Promise.reject(
            new Error(
                "Cannot delete without logged-in user"
            )
        );
    }

    const pendingWrite = {
        id: crypto.randomUUID(),
        type: "delete",
        collectionName: collectionName,
        documentId: documentId
    };

    storePendingWrite(
        user.uid,
        pendingWrite
    );

    return queueFirebaseWrite(
        user,
        async function () {
            await performPendingWrite(
                user,
                pendingWrite
            );

            removePendingWrite(
                user.uid,
                pendingWrite.id
            );
        }
    );
}

async function loadCollectionFromFirebase(collectionName) {
    const collectionRef =
        getUserCollectionRef(collectionName);

    const snapshot = await getDocs(collectionRef);

    return snapshot.docs.map(function (document) {
        return document.data();
    });
}

function queueFirebaseWrite(user, action) {
    saveQueue = saveQueue
        .catch(function (error) {
            console.error(
                "Previous Firebase save failed:",
                error
            );
        })
        .then(function () {
            if (
                currentUser === null ||
                currentUser.uid !== user.uid
            ) {
                throw new Error(
                    "User changed before Firebase save"
                );
            }

            return action();
        });

    return saveQueue;
}

// =========================================================
// HELPERS
// =========================================================

function createEmptyAppData() {
    return {
        exercises: [],
        templates: [],
        workouts: []
    };
}

function saveAppDataToLocalStorage(appData) {
    validateAppData(appData);

    saveItemsToLocalStorage(STORAGE_KEYS.exercises, appData.exercises);

    saveItemsToLocalStorage(STORAGE_KEYS.templates, appData.templates);

    saveItemsToLocalStorage(STORAGE_KEYS.workouts, appData.workouts);
}

function clearLocalAppData() {
    saveAppDataToLocalStorage(createEmptyAppData());
}

function getPendingWritesKey(userId) {
    return PENDING_WRITES_KEY_PREFIX + userId;
}

function loadPendingWrites(userId) {
    const key = getPendingWritesKey(userId);
    const json = localStorage.getItem(key);

    if (json === null) {
        return [];
    }

    const pendingWrites = JSON.parse(json);

    if (!Array.isArray(pendingWrites)) {
        throw new Error(
            "Invalid pending Firebase writes"
        );
    }

    return pendingWrites;
}

function savePendingWrites(userId, pendingWrites) {
    const key = getPendingWritesKey(userId);

    if (pendingWrites.length === 0) {
        localStorage.removeItem(key);
        return;
    }

    localStorage.setItem(
        key,
        JSON.stringify(pendingWrites)
    );
}

function storePendingWrite(userId, pendingWrite) {
    const pendingWrites =
        loadPendingWrites(userId);

    const updatedPendingWrites =
        pendingWrites.filter(function (write) {
            return !(
                write.collectionName ===
                pendingWrite.collectionName &&
                write.documentId ===
                pendingWrite.documentId
            );
        });

    updatedPendingWrites.push(pendingWrite);

    savePendingWrites(
        userId,
        updatedPendingWrites
    );
}

function removePendingWrite(
    userId,
    pendingWriteId
) {
    const pendingWrites =
        loadPendingWrites(userId);

    const updatedPendingWrites =
        pendingWrites.filter(function (write) {
            return write.id !== pendingWriteId;
        });

    savePendingWrites(
        userId,
        updatedPendingWrites
    );
}

async function performPendingWrite(
    user,
    pendingWrite
) {
    if (
        currentUser === null ||
        currentUser.uid !== user.uid
    ) {
        throw new Error(
            "User changed before Firebase write"
        );
    }

    const documentRef = doc(
        firestore,
        "users",
        user.uid,
        pendingWrite.collectionName,
        pendingWrite.documentId
    );

    if (pendingWrite.type === "save") {
        await setDoc(documentRef, {
            ...pendingWrite.data,
            updatedAt: new Date().toISOString()
        });

        return;
    }

    if (pendingWrite.type === "delete") {
        await deleteDoc(documentRef);
        return;
    }

    throw new Error(
        "Invalid pending Firebase write type"
    );
}

async function retryPendingFirebaseWrites() {
    const user = currentUser;

    if (user === null) {
        throw new Error(
            "Cannot retry writes without logged-in user"
        );
    }

    const pendingWrites =
        loadPendingWrites(user.uid);

    for (let i = 0; i < pendingWrites.length; i++) {
        const pendingWrite = pendingWrites[i];

        await performPendingWrite(
            user,
            pendingWrite
        );

        removePendingWrite(
            user.uid,
            pendingWrite.id
        );
    }
}

// =========================================================
// VALIDATIONS
// =========================================================

function validateAppData(appData) {
    if (
        appData === null ||
        typeof appData !== "object"
    ) {
        throw new Error(
            "Invalid Firebase app data"
        );
    }

    if (!Array.isArray(appData.exercises)) {
        throw new Error(
            "Invalid Firebase exercises"
        );
    }

    if (!Array.isArray(appData.templates)) {
        throw new Error(
            "Invalid Firebase templates"
        );
    }

    if (!Array.isArray(appData.workouts)) {
        throw new Error(
            "Invalid Firebase workouts"
        );
    }

    for (let i = 0; i < appData.exercises.length; i++) {
        validateExercise(
            appData.exercises[i]
        );
    }

    for (let i = 0; i < appData.templates.length; i++) {
        validateTemplate(
            appData.templates[i]
        );
    }

    for (let i = 0; i < appData.workouts.length; i++) {
        validateWorkout(
            appData.workouts[i]
        );
    }
}

function validateExercise(exercise) {
    if (
        exercise === null ||
        typeof exercise !== "object" ||
        typeof exercise.id !== "string" ||
        typeof exercise.name !== "string" ||
        typeof exercise.isArchived !== "boolean" ||
        !Array.isArray(exercise.settings)
    ) {
        throw new Error(
            "Invalid Firebase exercise"
        );
    }
}

function validateTemplate(template) {
    if (
        template === null ||
        typeof template !== "object" ||
        typeof template.id !== "string" ||
        typeof template.name !== "string" ||
        !Array.isArray(template.exerciseIds)
    ) {
        throw new Error(
            "Invalid Firebase template"
        );
    }

    for (let i = 0; i < template.exerciseIds.length; i++) {
        if (typeof template.exerciseIds[i] !== "string") {
            throw new Error(
                "Invalid Firebase template exercise ID"
            );
        }
    }
}

function validateWorkout(workout) {
    const startedAtIsValid =
        typeof workout.startedAt === "string" ||
        typeof workout.startedAt === "number";

    if (
        workout === null ||
        typeof workout !== "object" ||
        typeof workout.id !== "string" ||
        !startedAtIsValid ||
        (
            workout.finishedAt !== null &&
            typeof workout.finishedAt !== "string"
        ) ||
        !Array.isArray(workout.exercises)
    ) {
        throw new Error(
            "Invalid Firebase workout"
        );
    }
}

// =========================================================
// PUBLIC API
// =========================================================

window.firebaseStorage = {
    saveAppDataToLocalStorage,
    setupFirebaseSync,
    signInWithGoogle,
    signOutUser,
    isSignedIn,
    waitForAuthReady,
    getCurrentUser,
    subscribeToAuthChanges,
    saveExerciseToFirebase,
    saveTemplateToFirebase,
    saveWorkoutToFirebase,
    loadCollectionFromFirebase,
    deleteWorkoutFromFirebase,
    deleteTemplateFromFirebase,
    deleteExerciseFromFirebase,
};

window.dispatchEvent(new Event("firebaseStorageReady"));
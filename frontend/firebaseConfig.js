// Firebase Configuration
// TODO: Replace with your actual Firebase project config from Console > Project Settings > General > Web App
const firebaseConfig = {
    apiKey: "AIzaSyCMUhASvzz6xxF56VfizwG8fB17cDY2oJc",
    authDomain: "bettrion-com.firebaseapp.com",
    projectId: "bettrion-com",
    storageBucket: "bettrion-com.firebasestorage.app",
    messagingSenderId: "104282468636",
    appId: "1:104282468636:web:31458d32a0520220a9cad9",
    measurementId: "G-TV0469B8E2"
};

// Initialize Firebase
if (window.firebase) {
    firebase.initializeApp(firebaseConfig);
} else {
    console.error("Firebase SDK not loaded");
}

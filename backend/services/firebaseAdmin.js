const admin = require('firebase-admin');
const path = require('path');
const serviceAccountPath = path.join(__dirname, '../config/firebaseServiceAccount.json');

try {
    // Check if the service account file actually has placeholder data, effectively skipping real init
    // But for now, we try to load it. If it fails (bad JSON), we catch it.

    // Check if file exists and has real data? 
    // For safety, we wrap this.

    // We can also use Environment Variables if preferred, but JSON file is common for Firebase

    admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath))
    });

    console.log('✅ Firebase Admin Initialized');
} catch (error) {
    console.warn('⚠️ Firebase Admin Initialization Failed (Expected if no/bad keys):', error.message);
}

module.exports = admin;

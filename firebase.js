// firebaseAdmin.js
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load service account key
const require = createRequire(import.meta.url);
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin SDK (Firestore only)
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Export Firestore only
const db = admin.firestore();

export { db };

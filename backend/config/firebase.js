require("dotenv").config();
const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAR9NF23i_xj_vYRm_HdA620DNN_iT4P4U",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "reware-939bc.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "reware-939bc",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "reware-939bc.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "1053027639187",
  appId: process.env.FIREBASE_APP_ID || "1:1053027639187:web:c7da555fd181233fb31266"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log(`[Firebase] Initialized connection to project: ${firebaseConfig.projectId}`);

module.exports = {
  app,
  db,
  firebaseConfig
};

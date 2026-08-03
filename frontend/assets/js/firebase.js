// Firebase configuration module for REWARE frontend
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export const firebaseConfig = {
  apiKey: "AIzaSyAR9NF23i_xj_vYRm_HdA620DNN_iT4P4U",
  authDomain: "reware-939bc.firebaseapp.com",
  projectId: "reware-939bc",
  storageBucket: "reware-939bc.firebasestorage.app",
  messagingSenderId: "1053027639187",
  appId: "1:1053027639187:web:c7da555fd181233fb31266"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Make accessible globally for non-module scripts if needed
if (typeof window !== "undefined") {
  window.firebaseConfig = firebaseConfig;
  window.FirebaseApp = app;
  window.FirebaseDB = db;
  window.FirebaseAuth = auth;
}

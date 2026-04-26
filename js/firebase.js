// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyC8z0VzOWLwlpOSPQlNQyHhz8vZ1y7gG0Y",
    authDomain: "hoavantho-tet.firebaseapp.com",
    projectId: "hoavantho-tet",
    storageBucket: "hoavantho-tet.firebasestorage.app",
    messagingSenderId: "446841110492",
    appId: "1:446841110492:web:0b41a649e1bad3f29c9919",
    measurementId: "G-YQ2PLW1F28"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Xuất db và auth ra cho các file khác dùng ké
export { db, auth };
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";



const firebaseConfig = {
 apiKey: "AIzaSyCjeVILprWSVNhObQJHwqp9_sRYdDWzm8c",
  authDomain: "taskmanager2-51abc.firebaseapp.com",
  projectId: "taskmanager2-51abc",
  storageBucket: "taskmanager2-51abc.firebasestorage.app",
  messagingSenderId: "263795929898",
  appId: "1:263795929898:web:3c2695ff451e4f3859e453",
  measurementId: "G-9PBJ0VPZM3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
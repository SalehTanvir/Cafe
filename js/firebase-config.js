import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA8sDKRAljcOsuz19XkcTh3pxkN2Kf3NIs",
  authDomain: "cafewebsite-51559.firebaseapp.com",
  projectId: "cafewebsite-51559",
  storageBucket: "cafewebsite-51559.firebasestorage.app",
  messagingSenderId: "429612353074",
  appId: "1:429612353074:web:a041c309b63d45a6f95e2b"
};
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);





// Importamos las funciones necesarias desde el CDN oficial de Firebase (v11 modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// PEGA AQUÍ TUS LLAVES DE FIREBASE (reemplaza estos valores de ejemplo)
const firebaseConfig = {
  apiKey: "AIzaSyAbDjlezveXCgSFFPo7PUSUBLcPhGYWPqs",
  authDomain: "control-gastos-ecf2c.firebaseapp.com",
  projectId: "control-gastos-ecf2c",
  storageBucket: "control-gastos-ecf2c.firebasestorage.app",
  messagingSenderId: "207335248836",
  appId: "1:207335248836:web:b2d7ca86a6c668111a8a91"
};

// Inicializamos Firebase, Autenticación y Base de Datos
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
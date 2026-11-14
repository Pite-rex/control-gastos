import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";

const loginScreen = document.getElementById("loginScreen");
const appContainer = document.getElementById("appContainer");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginBtn = document.getElementById("loginBtn");
const userEmailBadge = document.getElementById("userEmailBadge");
const logoutBtn = document.getElementById("logoutBtn");

// Iniciar sesión
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  loginError.classList.add("hidden");
  loginBtn.disabled = true;
  loginBtn.textContent = "Verificando...";

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginForm.reset();
  } catch (error) {
    loginError.textContent = "Correo o contraseña incorrectos. Verifica tus datos.";
    loginError.classList.remove("hidden");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Entrar al Sistema";
  }
});

// Cerrar sesión
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// Escuchar cambios de sesión (recibe callback cuando el usuario entra)
export function initAuthListener(onUserAuthenticated) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loginScreen.classList.add("hidden");
      appContainer.classList.remove("hidden");
      userEmailBadge.textContent = user.email;
      onUserAuthenticated(user);
    } else {
      loginScreen.classList.remove("hidden");
      appContainer.classList.add("hidden");
      userEmailBadge.textContent = "";
    }
  });
}
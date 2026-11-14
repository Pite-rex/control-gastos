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
const loginPasswordInput = document.getElementById("loginPassword");
const togglePasswordBtn = document.getElementById("togglePasswordBtn");

// Mostrar / Ocultar contraseña
togglePasswordBtn.addEventListener("click", () => {
  const isPassword = loginPasswordInput.type === "password";
  loginPasswordInput.type = isPassword ? "text" : "password";
  togglePasswordBtn.style.color = isPassword ? "var(--blue)" : "var(--muted)";
});

// Temporizador de cierre automático por inactividad (15 minutos)
let inactivityTimer = null;
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000;

function resetInactivityTimer() {
  if (!auth.currentUser) return;
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(async () => {
    await signOut(auth);
    alert("Tu sesión se cerró automáticamente por inactividad (15 min) para proteger tus datos.");
  }, INACTIVITY_LIMIT_MS);
}

["click", "mousemove", "keydown", "scroll", "touchstart"].forEach((evt) => {
  document.addEventListener(evt, resetInactivityTimer, { passive: true });
});

// Iniciar sesión
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = loginPasswordInput.value;

  loginError.classList.add("hidden");
  loginBtn.disabled = true;
  loginBtn.textContent = "Verificando...";

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginForm.reset();
    loginPasswordInput.type = "password";
  } catch (error) {
    if (error.code === "auth/too-many-requests") {
      loginError.textContent = "Demasiados intentos fallidos. Espera unos minutos e intenta de nuevo.";
    } else {
      loginError.textContent = "Correo o contraseña incorrectos. Verifica tus datos.";
    }
    loginError.classList.remove("hidden");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Entrar al Sistema";
  }
});

// Cerrar sesión manual
logoutBtn.addEventListener("click", async () => {
  clearTimeout(inactivityTimer);
  await signOut(auth);
});

// Escuchar cambios de sesión
export function initAuthListener(onUserAuthenticated) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loginScreen.classList.add("hidden");
      appContainer.classList.remove("hidden");
      userEmailBadge.textContent = user.email;
      resetInactivityTimer();
      onUserAuthenticated(user);
    } else {
      clearTimeout(inactivityTimer);
      loginScreen.classList.remove("hidden");
      appContainer.classList.add("hidden");
      userEmailBadge.textContent = "";
    }
  });
}
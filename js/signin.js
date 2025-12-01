import { auth, db } from "./firebaseConfig.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const signInForm = document.getElementById("sign-in-form");
  const signUpForm = document.getElementById("sign-up-form");
  const showSignUp = document.getElementById("show-signup");
  const showSignIn = document.getElementById("show-signin");

  // Toggle forms
  showSignUp.addEventListener("click", (e) => {
    e.preventDefault();
    signInForm.style.display = "none";
    signUpForm.style.display = "block";
  });

  showSignIn.addEventListener("click", (e) => {
    e.preventDefault();
    signInForm.style.display = "block";
    signUpForm.style.display = "none";
  });

  // SIGN UP (Enter or button click both trigger this)
  signUpForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("sign-up-email").value.trim();
    const password = document.getElementById("sign-up-password").value.trim();

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      const docRef = doc(db, "users", cred.user.uid);
      await setDoc(docRef, { email });

      M.toast({ html: "Sign up successful!" });
      window.location.href = "/";
    } catch (err) {
      console.error("Signup error:", err.code, err.message);
      M.toast({ html: err.message });
    }
  });

  // SIGN IN (Enter or button click both trigger this)
  signInForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("sign-in-email").value.trim();
    const password = document.getElementById("sign-in-password").value.trim();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      M.toast({ html: "Sign in successful!" });
      window.location.href = "/";
    } catch (err) {
      console.error("Signin error:", err.code, err.message);
      M.toast({ html: err.message });
    }
  });
});

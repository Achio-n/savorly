// Import the functions you need from the SDKs you need
 import { auth, db } from "./firebaseConfig.js"
 import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  // Optional (for enhancements): query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {


  const signInForm = document.getElementById("sign-in-form")
  const signUpForm = document.getElementById("sign-up-form")
  const showSignUp = document.getElementById("show-signup")
  const showSignIn = document.getElementById("show-signin")
  const SignInBtn = document.getElementById("sign-in-btn")
  const SignUpBtn = document.getElementById("sign-up-btn")
//   const logoutBtn = document.getElementById("log-out-btn")

  showSignUp.addEventListener("click", ()=>{
    signInForm.style.display="none";
    signUpForm.style.display="block";
  });

  showSignIn.addEventListener("click", ()=>{
    signInForm.style.display="block";
    signUpForm.style.display="none";
  });
//sign up for new users
  SignUpBtn.addEventListener("click", async()=>{
    const email = document.getElementById("sign-up-email").value;
    const password = document.getElementById("sign-up-password").value;
    try{

        const authCredential = await createUserWithEmailAndPassword(auth, email, password);
        const docRef = doc(db, "users", authCredential.user.uid);
        await setDoc(docRef, {email: email });
        M.toast({html: "Sign up successful!"});
        window.location.href = "/"
        signUpForm.style.display= "none";
        signInForm.style.display="block";
    } catch(e){
        M.toast({html: e.message})
    }
  });
//sign in existing users
    SignInBtn.addEventListener("click", async()=>{
    const email = document.getElementById("sign-in-email").value;
    const password = document.getElementById("sign-in-password").value;
    try{
        await signInWithEmailAndPassword(auth, email, password);
        M.toast({html: "Sign in successful!"});
        window.location.href = "/"
        // logoutBtn.style.display = "block";
        SignInBtn.style.display = "none";
        document.getElementById("sign-in-email").value = "";
        document.getElementById("sign-in-password").value = "";
    } catch(e){
        M.toast({html: e.message})
    }
  });

})




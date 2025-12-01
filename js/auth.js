// auth.js

//INF654G Mobile Web Development
//Final Project for PWA app
//Jesse Newberry
//November 29, 2025

// Firebase SDKs
import { auth } from "./firebaseConfig.js"
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { loadTasks, syncTasks } from "./ui.js";
export let currentUser = null;

//listen for logout button click both for desktop version and mobile

document.addEventListener("DOMContentLoaded", ()=>{
    const logoutBtnDesktop = document.getElementById("log-out-btn-desktop")
    const logoutBtnMobile = document.getElementById("log-out-btn-mobile")
    onAuthStateChanged(auth, (user)=>{
        if(user){
            currentUser = user;
            console.log("UserId: ", user.uid);
            console.log("Email: ", user.email);
            //in order to match style of the rest of the menu, simply had to remove the display property rather than display: none
            logoutBtnDesktop.style.display = "";
            logoutBtnMobile.style.display = "";
            loadTasks();
            syncTasks();
        } else{
            console.log("no user is currently logged in");
            window.location.href = "/pages/auth.html";
        }


    });
    //desktop logout button
    logoutBtnDesktop.addEventListener("click", async ()=>{
        try{
            await signOut(auth);
            M.toast({html: "Logout successful!"});
            logoutBtnDesktop.style.display = "none";
            //SignInBtn.style.display = "block"; //if there is a problem, come back to this
            //once logged out, redirect to auth.html
            window.location.href = "/pages/auth.html"

            } catch(e){
                M.toast({html: e.message})
            }
    });
    //mobile desktop button
    logoutBtnMobile.addEventListener("click", async ()=>{
        try{
            await signOut(auth);
            M.toast({html: "Logout successful!"});
            logoutBtnMobile.style.display = "none";
            //SignInBtn.style.display = "block"; //if there is a problem, come back to this
            //once logged out, redirect to auth.html
            window.location.href = "/pages/auth.html"

            } catch(e){
                M.toast({html: e.message})
            }
    });
});
//this was not needed but left in just in case.
// export { currentUser };



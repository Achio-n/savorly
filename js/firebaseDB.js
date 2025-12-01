// firebaseDB.js

//INF654G Mobile Web Development
//Final Project for PWA app
//Jesse Newberry
//November 29, 2025

import { currentUser } from "./auth.js";
import { db } from "./firebaseConfig.js";
// Firebase SDKs
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  // Optional (for enhancements): query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// ADD
export async function addTaskToFirebase(task) {
  try {
    if(!currentUser){
      throw new Error("User is not authenticated");
    }
    const userId = currentUser.uid;
    console.log("userID: ", userId);
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, { email: currentUser.email }, { merge: true });
    const tasksRef = collection(userRef, "tasks");
    const docRef = await addDoc(tasksRef, task);
    return { id: docRef.id, ...task };
  } catch (error) {
    console.error("error adding task: ", error);
    throw error; // let the UI show a toast / handle it
  }
}

// GET (unordered; returns all)
export async function getTasksFromFirebase() {
  const tasks = [];
  try {
    if(!currentUser){
      throw new Error("User is not authenticated - Get Tasks");
      return tasks;
    }
    const userId = currentUser.uid;
    // const taskRef = collection(doc(db, "users", userId), "tasks");
    // Having issues and trying to track down a bug with auth not working since implementing 1.5 augmentations. Issue ended up due to the fact that tasks was called as array and not string
    const taskRef = collection(db, "users", userId, "tasks");
    const snapshot = await getDocs(taskRef);
    snapshot.forEach((d) => tasks.push({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("error retrieving tasks: ", error);
    // return empty array to keep UI stable
  }
  return tasks;
}

// DELETE
export async function deleteTaskFromFirebase(id) {
  try {
    if(!currentUser){
      throw new Error("User is not authenticated");
    }
    const userId = currentUser.uid;
    await deleteDoc(doc(db, "users", userId, "tasks", id));
  } catch (error) {
    console.error("error deleting task: ", error);
    throw error;
  }
}

// UPDATE
export async function updateTaskInFirebase(id, updatedData) {
  try {
     if(!currentUser){
      throw new Error("User is not authenticated");
    }
    const userId = currentUser.uid;
    const taskRef = doc(db, "users", userId, "tasks", id);
    await updateDoc(taskRef, updatedData);
  } catch (error) {
    console.error("error updating task: ", error);
    throw error;
  }
}

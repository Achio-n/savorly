# Savorly --- Personal Recipe Saver PWA

Savorly is a Progressive Web App that allows users to create, read,
update, and delete personal recipe-style tasks. It now includes full
user authentication, enabling each user to log in, sign up, and access
private, per-user data securely stored under their Firebase
Authentication UID.

Savorly runs both online and offline, storing unsynced items in
IndexedDB and automatically synchronizing when the device comes back
online.

You can access the live web app here:  https://savorly.free.nf/
(Installable directly as a PWA)

## New Features (Phase 1.5 Update)

### User Authentication

-   Firebase Authentication: sign up, log in, log out
-   Session persists automatically
-   UI updates based on authentication state

### Private User Data

-   Firestore collections stored under: users/`<uid>`{=html}/tasks
-   Each user sees only their own tasks
-   Offline tasks sync to the correct user once online

### Updated Repository

Project repository: 
https://github.com/Achio-n/pwaRecipesFinalProjectPhase1.5

### 📱 Direct Web Access & PWA Installation

Deployed at:  https://savorly.free.nf/

Installable on: - Desktop Chrome/Edge - Android Chrome - iOS Safari

##  Key Features

-   Installable PWA with offline-first architecture
-   User-specific data stored securely in Firestore
-   IndexedDB storage for offline usage
-   Automatic synchronization upon reconnection
-   Responsive UI using Materialize CSS
-   Service Worker caching for offline performance

##  Tech Stack

-   HTML, CSS, JavaScript
-   Materialize CSS
-   Firebase Authentication
-   Firebase Firestore
-   IndexedDB (via idb)
-   Service Worker, Manifest, Cache API
-   VS Code Live Server

##  Architecture & Data Model

### Authentication

-   Uses onAuthStateChanged to load or clear data depending on login
    status
-   Users must log in to view or modify tasks

### Firestore (Online Mode)

Path: users/`<uid>`{=html}/tasks CRUD operations include addDoc,
getDocs, updateDoc, deleteDoc

### IndexedDB (Offline Mode)

-   DB: taskManager_v2
-   Store: tasks
-   Fields: id, uid, title, content, synced

### Sync Logic

-   Offline tasks get temp-`<timestamp>`{=html} IDs
-   On reconnect: upload unsynced tasks, replace temp IDs with Firestore
    IDs

## Online/Offline Behavior

-   Detects network changes
-   Displays Materialize toasts
-   Updates sync status banner
-   Attempts background sync when connection returns

## Setup & Installation

### 1. Clone Repo

git clone https://github.com/Achio-n/pwaRecipesFinalProjectPhase1.5 cd
pwaRecipesFinalProjectPhase1.5

### 2. Start Local Development

-   Open folder in VS Code
-   Open index.html with Live Server
-   Test in Chrome

### 3. Authentication

Create an account or log in through the built-in modal.

### 4. Install PWA

Chrome: Install button\
iOS Safari: Share → Add to Home Screen

## Testing

### Authentication

-   Create user accounts
-   Verify data is unique per user
-   Log out and ensure UI resets

### Offline Mode

-   Use DevTools → Offline
-   Add/edit tasks
-   Go online to test sync

### PWA

-   Install on multiple devices
-   Use Lighthouse → PWA audit

## Firebase Setup (For Personal Hosting)

Replace Firebase config in firebaseDB.js.

Enable: - Authentication - Firestore

Security rule example: match /users/{uid}/tasks/{taskId} { allow read,
write: if request.auth != null && request.auth.uid == uid; }

## Code Structure Overview

### ui.js

-   UI initialization
-   IndexedDB operations
-   Rendering
-   Sync handling

### auth.js

-   Login, logout, sign-up
-   Auth state listener

### firebaseDB.js

-   Firebase initialization
-   CRUD scoped by UID

### Service Worker

-   Pre-caches core assets
-   Cache-first strategy
-   Offline fallback

## Author

Jesse Newberry INF 694G_VA --- Mobile Web Development

## Reflection

This project greatly broadened my development experience. Coming from
LAMP and .NET, exploring PWAs, Firebase, and offline-first design has
been transformative. Thank you, Professor Muvva.

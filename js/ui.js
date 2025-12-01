// ui.js
import { openDB } from "https://unpkg.com/idb?module";
import {
  addTaskToFirebase,
  deleteTaskFromFirebase,
  getTasksFromFirebase,
  updateTaskInFirebase,
} from "./firebaseDB.js";

/* ===========================
   Boot + Global Events
   =========================== */

   // Initialization and Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // init sidenavs
  const mobileMenu = document.querySelector(".sidenav#mobile-menu");
  if (mobileMenu) M.Sidenav.init(mobileMenu, { edge: "right" });

  const sideFormEl = document.querySelector(".side-form");
  if (sideFormEl) M.Sidenav.init(sideFormEl, { edge: "left" });

  // load + sync
  // Still trying to track down issue with tasks trying to load without authentication happening.
  // loadTasks().catch(console.error);
  // syncTasks().catch(console.error);

  // wire the single form action button (used for both Add and Save)
  // Make sure your HTML uses this id on the button inside the side form.
  const formActionBtn =
    document.querySelector("#form-action-btn") ||
    document.querySelector("#side-form .btn-small"); // fallback if id not present
  if (formActionBtn) {
    formActionBtn.addEventListener("click", onAddTaskClick);
  }

  // set initial online/offline indicator
  updateSyncUI();
});

// Online/Offline UI updates + optional auto-sync
window.addEventListener("online", () => {
  updateSyncUI();
  M.toast({ html: "Back online — new changes will save to Firebase." });
  // Kick off sync (best effort)
  syncTasks()?.catch(console.error);
});
window.addEventListener("offline", () => {
  updateSyncUI();
  M.toast({ html: "You’re offline — new changes will save to your device." });
});

// Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/serviceWorker.js")
    .then((reg) => console.log("Service Worker Registered!", reg))
    .catch((err) => console.log("Service Worker registration failed", err));
}

/* ===========================
   IndexedDB
   =========================== */
async function createDB() {
  const db = await openDB("taskManager_v2", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("tasks")) {
        const store = db.createObjectStore("tasks", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("status", "status");
      }
    },
  });
  return db;
}

async function addTask(task) {
  const db = await createDB();

  if (navigator.onLine) {
    // Save to Firebase first (expects { id: ... } back)
    const savedTask = await addTaskToFirebase(task);
    const toStore = { ...task, id: savedTask.id, synced: true };

    const tx = db.transaction("tasks", "readwrite");
    await tx.objectStore("tasks").put(toStore);
    await tx.done;

    return toStore;
  } else {
    // Offline: create temp id and mark unsynced
    const tempId = `temp-${Date.now()}`;
    const toStore = { ...task, id: tempId, synced: false };

    const tx = db.transaction("tasks", "readwrite");
    await tx.objectStore("tasks").put(toStore);
    await tx.done;

    await checkStorageUsage();
    return toStore;
  }
}

async function editTask(id, updatedData) {
  if (!id) {
    console.error("Invalid ID passed to editTask");
    return null;
  }

  const db = await createDB();

  if (navigator.onLine) {
    try {
      await updateTaskInFirebase(id, updatedData);

      // Persist the updated task locally as synced
      const toStore = { id, ...updatedData, synced: true };
      const tx = db.transaction("tasks", "readwrite");
      await tx.objectStore("tasks").put(toStore);
      await tx.done;

      return toStore;
    } catch (e) {
      console.error("Error updating task in Firebase", e);
      // Update locally as unsynced if Firebase update failed
      const toStore = { id, ...updatedData, synced: false };
      const tx = db.transaction("tasks", "readwrite");
      await tx.objectStore("tasks").put(toStore);
      await tx.done;
      return toStore;
    }
  } else {
    // Offline - update IndexedDB and mark unsynced
    const toStore = { id, ...updatedData, synced: false };
    const tx = db.transaction("tasks", "readwrite");
    await tx.objectStore("tasks").put(toStore);
    await tx.done;
    return toStore;
  }
}

// sync the tasks from indexedDB to firebase
export async function syncTasks() {
  if (!navigator.onLine) return;

  const db = await createDB();
  const tx = db.transaction("tasks", "readonly");
  const store = tx.objectStore("tasks");
  const tasks = await store.getAll();
  await tx.done;

  for (const task of tasks) {
    if (!task.synced) {
      try {
        const payload = {
          title: task.title,
          description: task.description,
          status: task.status,
        };

        if (String(task.id).startsWith("temp-")) {
          // NEW task created while offline → ADD
          const saved = await addTaskToFirebase(payload); // { id: "..." }

          const txUpdate = db.transaction("tasks", "readwrite");
          const storeUpdate = txUpdate.objectStore("tasks");
          await storeUpdate.delete(task.id); // drop temp id
          await storeUpdate.put({ ...task, id: saved.id, synced: true });
          await txUpdate.done;

          // Update DOM to use real id + remove badge
          const row = document.querySelector(`[data-id="${task.id}"]`);
          if (row) {
            row.setAttribute("data-id", saved.id);
            const titleEl = row.querySelector(".task-title");
            const chip = titleEl?.querySelector(".chip");
            if (chip) chip.remove();
          }
        } else {
          // Existing real id → EDIT → UPDATE
          await updateTaskInFirebase(task.id, payload);

          const txUpdate = db.transaction("tasks", "readwrite");
          const storeUpdate = txUpdate.objectStore("tasks");
          await storeUpdate.put({ ...task, synced: true });
          await txUpdate.done;

          // Remove unsynced badge in DOM
          const row = document.querySelector(`[data-id="${task.id}"]`);
          if (row) {
            const titleEl = row.querySelector(".task-title");
            const chip = titleEl?.querySelector(".chip");
            if (chip) chip.remove();
          }
        }
      } catch (error) {
        console.error("Error syncing task: ", error);
      }
    }
  }
}


async function deleteTask(id) {
  if (!id) {
    console.error("Invalid id passed to deleteTask");
    return;
  }
  const db = await createDB();

  if (navigator.onLine) {
    try {
      await deleteTaskFromFirebase(id);
    } catch (e) {
      console.error("Error deleting from Firebase:", e);
    }
  }

  // remove from IndexedDB
  const tx = db.transaction("tasks", "readwrite");
  try {
    await tx.objectStore("tasks").delete(id);
  } catch (e) {
    console.error("Error deleting the task from IndexedDB:", e);
  }
  await tx.done;

  // remove from DOM
  const card = document.querySelector(`[data-id="${id}"]`);
  if (card) card.remove();

  await checkStorageUsage();
}

export async function loadTasks() {
  const db = await createDB();
  const list = document.querySelector("#tasks");
  if (!list) return;

  // Always clear before rendering
  list.innerHTML = "";

  if (navigator.onLine) {
    const firebaseTasks = await getTasksFromFirebase();

    const tx = db.transaction("tasks", "readwrite");
    const store = tx.objectStore("tasks");

    for (const task of firebaseTasks) {
      const toStore = { ...task, synced: true };
      await store.put(toStore);
      displayTask(toStore);
    }
    await tx.done;
  } else {
    const tx = db.transaction("tasks", "readonly");
    const store = tx.objectStore("tasks");
    const tasks = await store.getAll();
    await tx.done;

    tasks.forEach(displayTask);
  }
}

/* ===========================
   UI Helpers
   =========================== */
function displayTask(task) {
  const list = document.querySelector("#tasks");
  if (!list) return;

  const unsyncedBadge = !task.synced
    ? `<span class="chip red lighten-5" title="Not synced to Firebase yet" style="margin-left:.5rem;">
         <i class="material-icons" style="font-size:16px;vertical-align:middle;">cloud_off</i>
         <span style="vertical-align:middle;">unsynced</span>
       </span>`
    : "";
// This will dynamically create the cards to display the data
  const html = `
    <div class="card-panel white row valign-wrapper" data-id="${task.id}">
      <div class="col s2">
        <img src="/img/recipe.png" class=" responsive-img" alt="task icon">
      </div>
      <div class="task-details col s8">
        <h5 class="task-title black-text">
          ${task.title ?? ""} ${unsyncedBadge}
        </h5>
        <div class="task-description">${task.description ?? ""}</div>
      </div>
      <div class="col s2 right-align">
        <button class="task-delete btn-flat" aria-label="Delete Task">
          <i class="material-icons black-text text-darken-1">delete</i>
        </button>
        <button class="task-edit btn-flat" aria-label="Edit Task">
          <i class="material-icons black-text text-darken-1">edit</i>
        </button>
      </div>
    </div>
  `;
  list.insertAdjacentHTML("beforeend", html);

  const row = list.querySelector(`[data-id="${task.id}"]`);
  const deleteBtn = row?.querySelector(".task-delete");
  if (deleteBtn) deleteBtn.addEventListener("click", () => deleteTask(task.id));

  const editBtn = row?.querySelector(".task-edit");
  if (editBtn)
    editBtn.addEventListener("click", () =>
      openEditForm(task.id, task.title, task.description)
    );
}

async function onAddTaskClick() {
  try {
    const titleInput = document.querySelector("#title");
    const descInput = document.querySelector("#description");
    const taskIDInput = document.querySelector("#task_id"); // hidden input in the form
    const formActionBtn =
      document.querySelector("#form-action-btn") ||
      document.querySelector("#side-form .btn-small");

    const taskId = taskIDInput?.value?.trim() || "";
    const title = titleInput?.value.trim() || "";
    const description = descInput?.value.trim() || "";

    // Basic validation first
    if (!title) {
      M.toast({ html: "Please enter a title" });
      return;
    }

    if (!taskId) {
      // ADD
      const saved = await addTask({ title, description, status: "pending" });
      displayTask(saved);
      M.toast({ html: navigator.onLine ? "Task added" : "Task added (unsynced)" });
    } else {
      // EDIT
      const updatedTask = { title, description, status: "pending" };
      const saved = await editTask(taskId, updatedTask);

      // Update DOM in-place if present
      const row = document.querySelector(`[data-id="${taskId}"]`);
      if (row && saved) {
        const titleEl = row.querySelector(".task-title");
        const descEl = row.querySelector(".task-description");
        if (titleEl) {
          // update text
          titleEl.childNodes[0].nodeValue = (saved.title ?? "") + " ";
          // flip badge as needed
          const existingChip = titleEl.querySelector(".chip");
          if (saved.synced && existingChip) existingChip.remove();
          if (!saved.synced && !existingChip) {
            titleEl.insertAdjacentHTML(
              "beforeend",
              ` <span class="chip red lighten-5" title="Not synced to Firebase yet" style="margin-left:.5rem;">
                  <i class="material-icons" style="font-size:16px;vertical-align:middle;">cloud_off</i>
                  <span style="vertical-align:middle;">unsynced</span>
                </span>`
            );
          }
        }
        if (descEl) descEl.textContent = saved.description ?? "";
      }

      M.toast({
        html: navigator.onLine ? "Task updated" : "Task updated (unsynced)",
      });
    }

    // reset and close form
    closeForm();
  } catch (err) {
    console.error(err);
    M.toast({ html: "Operation failed. Check console for details." });
  }
}

// open edit form
function openEditForm(id, title, description) {
  const titleInput = document.querySelector("#title");
  const descriptionInput = document.querySelector("#description");
  const taskIDInput = document.querySelector("#task_id");
  const formActionBtn =
    document.querySelector("#form-action-btn") ||
    document.querySelector("#side-form .btn-small");

  if (titleInput) titleInput.value = title ?? "";
  if (descriptionInput) descriptionInput.value = description ?? "";
  if (taskIDInput) taskIDInput.value = id; // <-- important fix

  M.updateTextFields();

  if (formActionBtn) formActionBtn.textContent = "Save";

  // Open the side form
  const forms = document.querySelector(".side-form");
  const instance = M.Sidenav.getInstance(forms);
  if (instance) instance.open();
}

function closeForm() {
  const titleInput = document.querySelector("#title");
  const descriptionInput = document.querySelector("#description");
  const taskIDInput = document.querySelector("#task_id");
  const formActionBtn =
    document.querySelector("#form-action-btn") ||
    document.querySelector("#side-form .btn-small");

  if (titleInput) titleInput.value = "";
  if (descriptionInput) descriptionInput.value = "";
  if (taskIDInput) taskIDInput.value = "";
  if (formActionBtn) formActionBtn.textContent = "Add";

  const forms = document.querySelector(".side-form");
  const instance = M.Sidenav.getInstance(forms);
  if (instance) instance.close();
}

/* ===========================
   Sync Indicator UI
   =========================== */
function updateSyncUI() {
  const el = document.querySelector("#sync-indicator");
  if (!el) return;

  if (navigator.onLine) {
    el.classList.remove("offline");
    el.innerHTML = `
      <i class="material-icons left" aria-hidden="true">cloud_done</i>
      Online: saving to Firebase
    `;
  } else {
    el.classList.add("offline");
    el.innerHTML = `
      <i class="material-icons left" aria-hidden="true">cloud_off</i>
      Offline: saving to device
    `;
  }
}

/* ===========================
   Storage info
   =========================== */
async function checkStorageUsage() {
  if (navigator.storage?.estimate) {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();

    const usageInMB = (usage / (1024 * 1024)).toFixed(2);
    const quotaInMB = (quota / (1024 * 1024)).toFixed(2);
    console.log(`Storage used: ${usageInMB} MB of ${quotaInMB} MB`);

    const storageInfo = document.querySelector("#storage-info");
    if (storageInfo) {
      storageInfo.textContent = `Storage used: ${usageInMB} MB of ${quotaInMB} MB`;
    }

    const storageWarning = document.querySelector("#storage-warning");
    if (storageWarning) {
      if (quota && usage / quota > 0.8) {
        storageWarning.textContent = "Warning: You are running low on data";
        storageWarning.style.display = "block";
      } else {
        storageWarning.textContent = "";
        storageWarning.style.display = "none";
      }
    }
  }
}

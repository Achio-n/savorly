//INF654G Mobile Web Development
//Final Project for PWA app
//Jesse Newberry
//November 29, 2025

//Cache name
const CACHE_NAME = "savorly-v1.5";
//list of assets to cache
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/pages/about.html",
  "/pages/contact.html",
  "/pages/auth.html",
  "/css/materialize.min.css",
  "/css/materialize.css",
  "/js/materialize.min.js",
  "/js/materialize.js",
  "/js/ui.js",
  "/js/firebaseDB.js",
  "/js/firebaseConfig.js",
  "/js/signin.js",
  "/js/auth.js",
  "/img/recipe.png",
  "/img/food.png",
  "/img/icons/apple-touch-icon.png",
  "/img/icons/favicon.ico",
  "/img/icons/logoFull.png",
  "/img/icons/logoSmall.png",
  "/img/icons/savorly-16.png",
  "/img/icons/savorly-32.png",
  "/img/icons/savorly-192.png",
  "/img/icons/savorly-512.png" 

];
//cache the assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching files");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});
//delete the old cache if it exists
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Service worker: Deleting old cache");
            return cache.delete(cacheNames);
          }
        })
      );
    })
  );
});


// Having issues with this piece working in firefox. 
// self.addEventListener("fetch", (event) => {
//   console.log("Service Worker: Fetching...", event.request.url);
//   event.respondWith(
//     caches.match(event.request).then((response) => {
//       return response || fetch(event.request);
//     })
//   );
// });

//Implementing further tests to cache but still get fresh textContent

//Below fixed firefox issue but new issue arose using chrome
// self.addEventListener("fetch", (event) => {
//   const url = new URL(event.request.url);

//   // Bypass Firestore
//   if (url.hostname.includes("firestore.googleapis.com")) {
//     return event.respondWith(fetch(event.request));
//   }

//   event.respondWith(
//     fetch(event.request)
//       .then((networkResponse) => {
//         // Update cache with fresh response
//         return caches.open(CACHE_NAME).then((cache) => {
//           cache.put(event.request, networkResponse.clone());
//           return networkResponse;
//         });
//       })
//       .catch(() => caches.match(event.request)) // fallback to cache if offline
//   );
// });
//=========================================================================================

// POST requests bypass the cache entirely which prevents Chrome error.

// Firestore requests still bypass the SW so no Firefox error.

// GET requests for app files are still cached for offline use.

// self.addEventListener("fetch", (event) => {
//   const url = new URL(event.request.url);

//   // Bypass Firestore requests completely
//   if (url.hostname.includes("firestore.googleapis.com")) {
//     return event.respondWith(fetch(event.request));
//   }

//   // Only cache GET requests
//   if (event.request.method !== "GET") {
//     return event.respondWith(fetch(event.request));
//   }

//   event.respondWith(
//     fetch(event.request)
//       .then((networkResponse) => {
//         return caches.open(CACHE_NAME).then((cache) => {
//           cache.put(event.request, networkResponse.clone());
//           return networkResponse;
//         });
//       })
//       .catch(() => caches.match(event.request))
//   );
// });


// After chasing this firefox I determined there was no effect on functionality. Rolling back to original
self.addEventListener("fetch", (event) => {
  console.log("Service Worker: Fetching...", event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
// Pre-warm critical app routes on SW install so they are available offline
// even if the user has never visited them.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('pages').then((cache) =>
      cache.addAll([
        '/routines',
        '/dashboard',
        '/history',
        '/bodyweight',
        '/profile',
      ])
    )
  )
})

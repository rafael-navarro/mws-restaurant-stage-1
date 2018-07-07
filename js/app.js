
window.addEventListener('load', function() {
    registerServiceWorker();
});


function registerServiceWorker() {
    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.register('/sw.js').then(function() {
      console.log('Registration worked!');
    }).catch(function() {
      console.log('Registration failed!');
    });   
    
      navigator.serviceWorker.ready
      .then(function(registration) {
        console.log('A service worker is active:', registration.active);
    
        // At this point, you can call methods that require an active
        // service worker, like registration.pushManager.subscribe()
      });
    
  }
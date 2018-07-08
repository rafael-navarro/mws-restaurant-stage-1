/*
Copyright 2016 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

(function() {
    'use strict';

    self.importScripts("/js/idb.js"); //, "/js/idbhelper.js");
  
    var store = {
      db: null,
    
      init: () => {
        if (store.db) { return Promise.resolve(store.db); }
        return idb.open('data', 3, upgradeDb => {
          //upgradeDb.createObjectStore('outbox', { autoIncrement : true, keyPath: 'id' });
        }).then(db => {
          return store.db = db;
        });
      },
    
      reviews_to_post: mode => {
        return store.init().then(db => {
          return db.transaction('reviews_to_post', mode).objectStore('reviews_to_post');
        })
      },

      reviews: mode => {
        return store.init().then(db => {
          return db.transaction('reviews', mode).objectStore('reviews');
        })
      },

    }


    var filesToCache = [
        '/',
        '/index.html',
        '/restaurant.html',
        '/restaurant.html?id=1',
        '/restaurant.html?id=2',
        '/restaurant.html?id=3',
        '/restaurant.html?id=4',
        '/restaurant.html?id=5',
        '/restaurant.html?id=6',
        '/restaurant.html?id=7',
        '/restaurant.html?id=8',
        '/restaurant.html?id=9',
        '/restaurant.html?id=10',
        "/js/app.js",
        "/js/dbhelper.js",
        "/js/main.js",
        "/js/idb.js",
        "/js/idbhelper.js",
        "/js/restaurant_info.js",
        "/css/styles.css",
        "/css/responsive.css",
        "/images/1.jpg",
        "/images/2.jpg",
        "/images/3.jpg",
        "/images/4.jpg",
        "/images/5.jpg",
        "/images/6.jpg",
        "/images/7.jpg",
        "/images/8.jpg",
        "/images/9.jpg",
        "/images/10.jpg",
        "/images/1-400_small_1x.jpg",
        "/images/2-400_small_1x.jpg",
        "/images/3-400_small_1x.jpg",
        "/images/4-400_small_1x.jpg",
        "/images/5-400_small_1x.jpg",
        "/images/6-400_small_1x.jpg",
        "/images/7-400_small_1x.jpg",
        "/images/8-400_small_1x.jpg",
        "/images/9-400_small_1x.jpg",
        "/images/10-400_small_1x.jpg",
        "/images/1-400_small_2x.jpg",
        "/images/2-400_small_2x.jpg",
        "/images/3-400_small_2x.jpg",
        "/images/4-400_small_2x.jpg",
        "/images/5-400_small_2x.jpg",
        "/images/6-400_small_2x.jpg",
        "/images/7-400_small_2x.jpg",
        "/images/8-400_small_2x.jpg",
        "/images/9-400_small_2x.jpg",
        "/images/10-400_small_2x.jpg"
    ];
  
    var staticCacheName = 'mws-restaurant-v3';
  
    self.addEventListener('install', function(event) {
      console.log('Attempting to install service worker and cache static assets');
      event.waitUntil(
        caches.open(staticCacheName)
        .then(function(cache) {
          return cache.addAll(filesToCache);
        })
      );
    });
  
    self.addEventListener('fetch', function(event) {
      //console.log('Fetch event for ', event.request.url);
      event.respondWith(
        caches.match(event.request).then(function(response) {
          if (response) {
            //console.log('Found ', event.request.url, ' in cache');
            return response;
          }
          //console.log('Network request for ', event.request.url);
          return fetch(event.request).then(function(response) {
            if (response.status === 404) {
              return caches.match('404.html');
            }
            return caches.open(staticCacheName).then(function(cache) {
              if (event.request.url.startsWith(self.location.origin)) {
                cache.put(event.request.url, response.clone());
              }
              return response;
            });
          });
        }).catch(function(error) {
          console.log('Error, ', error);
          return caches.match('offline.html');
        })
      );
    });
  
    self.addEventListener('activate', function(event) {
      console.log('Activating new service worker...');
  
      var cacheWhitelist = [staticCacheName];
  
      event.waitUntil(
        caches.keys().then(function(cacheNames) {
          return Promise.all(
            cacheNames.map(function(cacheName) {
              if (cacheWhitelist.indexOf(cacheName) === -1) {
                return caches.delete(cacheName);
              }
            })
          );
        })
      );
    });

    self.addEventListener('sync', event => {
      console.log("Evento sync", event.tag);
      event.waitUntil(
        store.reviews_to_post('readonly').then(reviews => {
          return reviews.getAll();
        }).then(messages => {
          return Promise.all(messages.map(message => {
            var clone = Object.assign({}, message);
            delete clone.id;
            return fetch('http://localhost:1337/reviews/', {
              method: 'POST',
              body: JSON.stringify(clone)
            }).then(response => {
              return response.json();
            })
            .then(data => {
              return store.reviews('readwrite').then(function(review) {
                return review.add(data);
              });
            })
            .then(data => {
              return store.reviews_to_post('readwrite').then(function(review) {
                  return review.delete(message.id);
                });
              
            })
          }))
        }).catch(function(err) {
          console.error(err);
        })
      );
    })

  
  })();
  


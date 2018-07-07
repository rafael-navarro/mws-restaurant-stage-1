//import idb from 'idb';

class IDBHelper {

    //Open the database
    static openDatabase() {
        if (!('indexedDB' in window)) {
            console.log('This browser doesn\'t support IndexedDB');
            return;
        }

        return idb.open('data', 3, function (upgradeDb) {
            switch (upgradeDb.oldVersion) {
                case 0:
                    var store = upgradeDb.createObjectStore('restaurants', {
                        keyPath: 'id'
                    });

                    store.createIndex('by-id', 'id');
                case 1:
                    var reviews = upgradeDb.createObjectStore('reviews', {
                        keyPath: 'id'
                    });

                    reviews.createIndex('by-id', 'id');
                case 2:
                    var reviews_to_post = upgradeDb.createObjectStore('reviews_to_post', { 
                        autoIncrement : true, 
                        keyPath: 'id' 
                    });
            }
        });
    }

    //Get restaurants from server if necessary
    static populateRestaurants(database$) {
        return IDBHelper.getAllRestaurants(database$)
            .then(restaurants => {
                if (restaurants && restaurants.length > 0) {
                    return restaurants;
                }
                return DBHelper.fetchRestaurants()
                    .then(restaurants => {
                        return IDBHelper.addData(database$, restaurants)
                            .then(() => restaurants);
                    });
            });
    }

    //Get restaurants from server if necessary
    static populateReviews(database$) {
        return IDBHelper.getAllReviews(database$)
            .then(reviews => {
                if (reviews && reviews.length > 0) {
                    return reviews;
                }
                return DBHelper.fetchReviews()
                    .then(reviews => {
                        return IDBHelper.addReview(database$, reviews)
                            .then(() => reviews);
                    });
            });
    }

    //To add data you do the following
    static addData(database$, restaurants) {
        //open the database to make transactions
        return database$.then(function (db) {
            if (!db) return;
            //open an transaction
            var tx = db.transaction('restaurants', 'readwrite'),
                store = tx.objectStore('restaurants');

            //put data in the in the database
            return Promise.all(restaurants.map(function (restaurant) {
                //console.log('Adding item: ', restaurant);
                return store.add(restaurant);
            }));
        });
    }

    //To add data you do the following
    static addReview(database$, reviews) {
        //open the database to make transactions
        return database$.then(function (db) {
            if (!db) return;
            //open an transaction
            var tx = db.transaction('reviews', 'readwrite'),
                store = tx.objectStore('reviews');

            //put data in the in the database
            return Promise.all(reviews.map(function (review) {
                return store.add(review);
            }));
        })
    }

    static addReviewCache(database$, review) {
        //open the database to make transactions
        return database$.then(function (db) {
            if (!db) return;
            //open an transaction
            var tx = db.transaction('reviews_to_post', 'readwrite'),
                store = tx.objectStore('reviews_to_post');

            //put data in the in the database
            return store.add(review);
        });
    }

    static getAllRestaurants(database$) {
        //open the database to make transactions
        return database$.then(function (db) {
            if (!db) return;
            //open an transaction
            var tx = db.transaction('restaurants', 'readonly'),
                store = tx.objectStore('restaurants');

            return store.getAll();
        });
    }

    static getRestaurantById(database$, id) {
        //open the database to make transactions
        return database$.then(function (db) {
            if (!db) return;
            //open an transaction
            let tx = db.transaction('restaurants', 'readonly'),
                store = tx.objectStore('restaurants');
            let index = store.index('by-id');
            return index.get(id);
        });
    }

    static getAllReviews(database$) {
        //open the database to make transactions
        return database$.then(function (db) {
            if (!db) return;
            //open an transaction
            var tx = db.transaction('reviews', 'readonly'),
                store = tx.objectStore('reviews');

            return store.getAll();
        });
    }

    // static syncReviews(database$) {
    //     //open the database to make transactions
    //     return database$.then(function (db) {
    //         if (!db) return;
    //         //open an transaction
    //         var tx = db.transaction('reviews_to_post', 'readwrite'),
    //             store = tx.objectStore('reviews_to_post');

    //         return store.getAll();
    //     })
    //     .then(reviews => {
    //         return Promise.all(reviews.map(review => {
    //             return DBHelper.addReview(review)
    //                 .then(data => {
    //                     console.log("sync", data);
    //                     store.delete(review.id);
    //                 });
    //         }));
    //     });
    // }


    static getReviewsById(database$, id) {
        //open the database to make transactions
        let reviews$ =  database$.then(function (db) {
            if (!db) return;
            //open an transaction
            let tx = db.transaction('reviews', 'readonly'),
                store = tx.objectStore('reviews');

            let index = store.index('by-id');
            return store.getAll()
                .then(reviews =>
                    reviews.filter(r => r.restaurant_id == id));
        });

        let reviews_to_post$ =  database$.then(function (db) {
            if (!db) return;
            //open an transaction
            let tx = db.transaction('reviews_to_post', 'readonly'),
                store = tx.objectStore('reviews_to_post');

            return store.getAll()
                .then(reviews =>
                    reviews.filter(r => r.restaurant_id == id));
        });

        return Promise.all([reviews$, reviews_to_post$])
            .then(results => {
                return results[0].concat(results[1]);
            });
    }


    /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
    static getRestaurantByCuisine(database$, cuisine) {
        // Fetch all restaurants  with proper error handling
        return IDBHelper.getAllRestaurants(database$)
            .then(restaurants =>
                // Filter restaurants to have only given cuisine type 
                restaurants.filter(r => r.cuisine_type == cuisine));
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static getRestaurantByNeighborhood(database$, neighborhood) {
        // Fetch all restaurants
        return IDBHelper.getAllRestaurants(database$)
            .then(restaurants =>
                // Filter restaurants to have only given neighborhood
                restaurants.filter(r => r.neighborhood == neighborhood));

    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static getRestaurantByCuisineAndNeighborhood(database$, cuisine, neighborhood) {
        // Fetch all restaurants
        return IDBHelper.getAllRestaurants(database$)
            .then(restaurants => {
                let results = restaurants
                if (cuisine != 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                return results;
            });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static getNeighborhoods(database$) {
        // Fetch all restaurants
        return IDBHelper.getAllRestaurants(database$)
            .then(restaurants => {
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
                return uniqueNeighborhoods;
            });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static getCuisines(database$) {
        // Fetch all restaurants
        return IDBHelper.getAllRestaurants(database$)
            .then(restaurants => {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
                return uniqueCuisines;
            });
    }
}
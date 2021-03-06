/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}`;
  }

  static get RESTAURANTS_URL() {
    return `${DBHelper.DATABASE_URL}/restaurants/`;
  }

  static get REVIEWS_URL() {
    return `${DBHelper.DATABASE_URL}/reviews/`; 
  }

  /**
   * Fetch all reviews.
   */
  static fetchReviews() {

    return fetch(DBHelper.REVIEWS_URL)
      .then(response => response.json())
      .catch(e => {
        const error = (`Request failed. Returned status of ${e.status}`);
        throw error;
      });
  }

  /**
   * Fetch a revies by restaurant ID.
   */
  static fetchReviewByRestaurant(id) {
    return fetch(`${DBHelper.REVIEWS_URL}?restaurant_id=${id}`)
      .then(response => response.json())
      .catch(e => {
        //console.log("Error", e);
        const error = (`Request failed. Returned status of ${e.status}`);
        throw error;
      });
  }

  
  /**
   * Add review 
   */
  static addReview(review) {
    const fetchOptions = {
      method: 'POST',
      //headers,
      body: review
    };
    
    return fetch(DBHelper.REVIEWS_URL, fetchOptions)
      .then(response => response.json())
        .catch(e => {
          //console.log("Error", e);
          const error = (`Request failed. Returned status of ${e.status}`);
          throw error;
        });
  }


  /**
   * Update favorite flag by restaurant id
   */
  static updateFavorite(id, is_favorite) {
    const fetchOptions = {
      method: 'PUT'
    };
    
    return fetch(`${DBHelper.RESTAURANTS_URL}${id}/?is_favorite=${is_favorite}`, fetchOptions)
      .then(response => response.json())
        .catch(e => {
          //console.log("Error", e);
          const error = (`Request failed. Returned status of ${e.status}`);
          throw error;
        });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {

    return fetch(DBHelper.RESTAURANTS_URL)
      .then(response => response.json())
      .catch(e => {
        //console.log("Error", e);
        const error = (`Request failed. Returned status of ${e.status}`);
        throw error;
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    return fetch(DBHelper.RESTAURANTS_URL + id)
      .then(response => response.json())
      .catch(e => {
        //console.log("Error", e);
        const error = (`Request failed. Returned status of ${e.status}`);
        throw error;
      });
  }


  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine) {
    // Fetch all restaurants  with proper error handling
    return DBHelper.fetchRestaurants()
      .then(restaurants => 
        // Filter restaurants to have only given cuisine type 
        restaurants.filter(r => r.cuisine_type == cuisine));
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then(restaurants => 
        // Filter restaurants to have only given neighborhood
        restaurants.filter(r => r.neighborhood == neighborhood));

  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
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
  static fetchNeighborhoods() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        return uniqueNeighborhoods;
      });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants()
      .then(restaurants => {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        return uniqueCuisines;
      });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }


  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/images/${restaurant.photograph}.jpg`);
  }

  /**
   * Restaurant image URL reduced size
   */
  static imageUrlForRestaurantReduced(restaurant, info) {
    const photograph = restaurant.photograph || '';
    const filename = photograph.replace('.jpg', info) + '.jpg';
    return (`/images/${filename}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    }
    );
    return marker;
  }

}

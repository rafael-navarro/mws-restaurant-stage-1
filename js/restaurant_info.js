let restaurant;
let reviews;
var map;
let dbPromise$

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  dbPromise$ = IDBHelper.openDatabase();

  IDBHelper.populateReviews(dbPromise$)
    .then(() => {
    });
});


let formEl = document.getElementById('form');
formEl.addEventListener('submit', function(event) {
  const data = getObjectFromForm(formEl);

  data['restaurant_id'] = self.restaurant.id;
  data['createdAt'] = new Date();
  
  IDBHelper.addReviewCache(dbPromise$, data)
    .then(x => {
      self.fetchReviewsFromURL();

      //Raise Sync event
      navigator.serviceWorker.ready.then(function(reg) {
        return reg.sync.register('sync-reviews');
      });
    });
  
  formEl.reset();
  event.preventDefault();
});

toggleFavorite = (restaurant = self.restaurant) => {
  let is_favorite = "true";
  if (restaurant.is_favorite == "true")
   is_favorite = "false";
  
  DBHelper.updateFavorite(restaurant.id, is_favorite)
    .then(data => {
        self.restaurant = data;
        updateFavoriteHTML();
    });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL()
    .then(restaurant => {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    })
    .catch(error => console.error(error));

    fetchReviewsFromURL()
    .then(reviews => {
    })
    .catch(error => console.error(error));
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = () => {
  if (self.restaurant) { // restaurant already fetched!
    return Promise.resolve(self.restaurant);
  }
  const id = Number(getParameterByName('id'));
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    return Promise.reject(error);
  } 
   else {
  //   const database$ = IDBHelper.openDatabase();
    return IDBHelper.getRestaurantById(dbPromise$, id)
      .then(restaurant => {
        self.restaurant = restaurant;
        if (!restaurant) {
          return Promise.reject(error);
        }
        fillRestaurantHTML();
        return restaurant;
      });
  }
}

/**
 * Get current restaurant from page URL.
 */
fetchReviewsFromURL = () => {
  // if (self.reviews) { // reviews already fetched!
  //   return Promise.resolve(self.reviews);
  // }
  const id = Number(getParameterByName('id'));
  if (!id) { // no id found in URL
    error = 'No reviews id in URL'
    return Promise.reject(error);
  } 
  else {
    return IDBHelper.getReviewsById(dbPromise$, id)
      .then(reviews => {
        self.reviews = reviews;
        if (!reviews) {
          return Promise.reject(reviews);
        }
        fillReviewsHTML();
        return reviews;
      });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.alt = `Image of restaurant ${restaurant.name}`;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  updateFavoriteHTML();

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  //fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.updatedAt || review.createdAt;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

updateFavoriteHTML = (restaurant=self.restaurant) => {
  const favorite = document.getElementById('favorite');
  if (restaurant.is_favorite == 'true')
    favorite.className = 'favorite';
  else
    favorite.className = 'non-favorite';
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

getObjectFromForm = (formElement) => {
  const formData = new FormData(formEl);

  result = {}
  formData.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

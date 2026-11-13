/*
"Talk is cheap. Show me the code."
—Linus Torvalds
*/

// Palabas · WS1 TV Show Search code-along (TVmaze API, no key needed)
// Open DevTools (F12): keep the Console AND the Network tab open.
// Sample or live mode: see config.js.

// ---------- Given: page elements ----------
const form = document.getElementById("searchForm");
const input = document.getElementById("query");
const statusText = document.getElementById("status");
const results = document.getElementById("results");
const dialog = document.getElementById("details");
const detailsBody = document.getElementById("detailsBody");
const closeBtn = document.getElementById("closeDetails");
const modeBadge = document.getElementById("modeBadge");

// ---------- Given: the API's URLs ----------
const API = "https://api.tvmaze.com";

// Turns "Breaking Bad" into "breaking-bad" (used for the sample-data file names)
function slug(text) {
  return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// e.g. https://api.tvmaze.com/search/shows?q=breaking%20bad
function searchURL(query) {
  if (USE_SAMPLE_DATA) return `data/search/${slug(query)}.json`;
  return `${API}/search/shows?q=${encodeURIComponent(query)}`;
}

// e.g. https://api.tvmaze.com/shows/169
function showURL(id) {
  return USE_SAMPLE_DATA ? `data/shows/${id}.json` : `${API}/shows/${id}`;
}

// e.g. https://api.tvmaze.com/shows/169/cast
function castURL(id) {
  return USE_SAMPLE_DATA ? `data/cast/${id}.json` : `${API}/shows/${id}/cast`;
}

// e.g. https://api.tvmaze.com/shows/169/seasons
function seasonsURL(id) {
  return USE_SAMPLE_DATA ? `data/seasons/${id}.json` : `${API}/shows/${id}/seasons`;
}

// ---------- Given: helpers (no need to change) ----------

// Shows a message under the search box. type: "info", "loading" or "error"
function setStatus(message, type = "info") {
  statusText.textContent = message;
  statusText.className = "status " + type;
}

// Makes an element with an optional class and text: el("span", "year", "2008")
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// A poster <img>, or a placeholder when the show has no image (image is null)
function createPoster(show, size = "medium") {
  if (!show.image) {
    return el("span", "poster none", "No poster");
  }
  const img = el("img", "poster");
  img.src = show.image[size] || show.image.medium;
  img.alt = `Poster: ${show.name}`;
  img.loading = "lazy";
  img.addEventListener("error", () => img.replaceWith(el("span", "poster none", "No poster")));
  return img;
}

// "2008–2013", or "2016–" for a show that is still running
function yearRange(show) {
  const start = show.premiered ? show.premiered.slice(0, 4) : "?";
  const end = show.ended ? show.ended.slice(0, 4) : "";
  return `${start}–${end}`;
}

// TVmaze summaries contain HTML like "<p><b>Friends</b> follows…</p>".
// This keeps only the text. (Never put text from an API into innerHTML:
// if it contained a <script> or an onerror, it could run on your page.)
function stripTags(html) {
  if (!html) return "No summary yet.";
  return new DOMParser().parseFromString(html, "text/html").body.textContent;
}

// Close the details pop-up (Step 4) with the × button or by clicking outside it
closeBtn.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

// Show which mode we're in
modeBadge.textContent = USE_SAMPLE_DATA ? "Sample data" : "Live · TVmaze";
modeBadge.classList.toggle("live", !USE_SAMPLE_DATA);

// STEP 1 — Your first API request
// TODO: async function testRequest(): fetch searchURL("friends"), log the status and the JSON array

/*async function testRequest() {
 const url = searchURL("friends");
 console.log("Requesting URL:", url);
  try {
    const response = await fetch(url);
    console.log("Status:", response.status, "ok", response.ok);

    const data = await response.json();
    console.log("Data:", data);
    console.log("How many results?", data.length);
    console.log("First TV Show:", data[0].show.name, data[0].show.premiered, data[0].show.ended);
  } catch (error) {
    console.error("Error during testRequest:", error);
    setStatus("Network error during test request.", "error");
  }
}

testRequest();
*/

// STEP 2 — Search and show the results
// TODO: renderResults(items), searchShows(query), and a submit listener on the form


// STEP 2 — Search and show the results

function renderResults(items) {
  results.innerHTML = "";

  items.forEach((item) => {
    const show = item.show;

    const card = el("button", "card");
    card.type = "button";
    card.dataset.id = show.id;

    const rating = show.rating?.average;

    card.append(
      createPoster(show),
      el("span", "title", show.name),
      el("span", "year", yearRange(show)),
      el("span", "genres", show.genres.join(", ")),
      el("span", "rating", rating ? "⭐⭐⭐⭐⭐" : "Not rated yet")
    );

    results.appendChild(card);
  });
}


// STEP 3 — getJSON(): one careful helper for every request
// TODO: catch network errors, check 429 and response.ok; rewrite searchShows with try / catch and an empty-array check

async function getJSON(url) {
  let response;

  // Handle network errors
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(
      "Unable to connect. Please check your internet connection."
    );
  }

  // Handle HTTP errors
  if (!response.ok) {
    if (USE_SAMPLE_DATA && response.status === 404) {
      throw new Error(
        "Sample not found. Try Friends, The Office, or Breaking Bad."
      );
    }

    if (response.status === 429) {
      throw new Error(
        "Too many requests. Please wait a moment and try again."
      );
    }

    throw new Error(`Request failed. Status: ${response.status}`);
  }

  // Convert response to JSON
  try {
    return await response.json();
  } catch (error) {
    throw new Error("Invalid response from the server.");
  }
}


// Search for TV shows

async function searchShows(query) {
  setStatus("Searching…", "loading");
  results.innerHTML = "";

  try {
    const data = await getJSON(searchURL(query));

    if (data.length === 0) {
      setStatus("No TV shows found. Please try another search.", "error");
      return;
    }

    renderResults(data);
    setStatus(`Found ${data.length} result(s).`, "info");

  } catch (error) {
    console.error("Error during searchShows:", error);
    setStatus(error.message, "error");
    results.innerHTML = "";
  }
}


// Search form event listener

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const query = input.value.trim();

  if (!query) {
    setStatus("Please enter a TV show name.", "error");
    return;
  }

  searchShows(query);
});



// STEP 4 — Click a show to see its details
// TODO: one click listener on #results, showDetails(id), renderDetails(show)

results.addEventListener("click", (event) => {
  const card = event.target.closest(".card");
  if (!card) return;
  const id = card.dataset.id;
  showDetails(id);
});

async function showDetails(id) {
  setStatus("Loading details…", "loading");

  try {
    const show = await getJSON(showURL(id));

    renderDetails(show);
    dialog.showModal();

    setStatus(`Details for "${show.name}".`, "info");

  } catch (error) {
    console.error("Error during showDetails:", error);
    setStatus(error.message, "error");
  }
}

function renderDetails(show, cast, seasons) {
  detailsBody.innerHTML = "";

  detailsBody.append(
    createPoster(show, "original"),
    el("h2", null, show.name),
    el("p", "summary", stripTags(show.summary)),
    el("p", "year", `Year: ${yearRange(show)}`),
    el("p", "genres", `Genres: ${show.genres.join(", ")}`),
    el("p", "rating", `Rating: ${show.rating.average ?? "Not rated yet"}`)
  );
} 


// STEP 5 — Promise.all: show + cast + seasons at the same time
// TODO: rewrite showDetails with Promise.all, and renderDetails(show, cast, seasons)

/*try {
  const [show, cast, season] = await Promise.all([
    getJSON(showURL(id)),
    getJSON(castURL(id)),
    getJSON(seasonsURL(id))
  ]);

  renderDetails(show, cast, season);
  dialog.showModal();

  setStatus(`Details for "${show.name}".`, "info");

}
 catch (error) {
    console.error("Error during showDetails:", error);
    setStatus(error.message, "error");
  }*/

async function showDetails(id) {
  setStatus("Loading details…", "loading");

  try {
    const [show, cast, seasons] = await Promise.all([
      getJSON(showURL(id)),
      getJSON(castURL(id)),
      getJSON(seasonsURL(id))
    ]);

    renderDetails(show, cast, seasons);
    dialog.showModal();

    setStatus(`Details for "${show.name}".`, "info");

  } catch (error) {
    console.error("Error during showDetails:", error);
    setStatus(error.message, "error");
  }
}

function renderDetails(show, cast, seasons) {
  detailsBody.innerHTML = "";

  detailsBody.append(
    createPoster(show, "original"),
    el("h2", null, show.name),
    el("p", "summary", stripTags(show.summary)),

el("p", "year", `Year: ${yearRange(show)}`),
el("p", "genres", `Genres: ${show.genres.join(", ")}`),
el("p", "rating", `Rating: ${show.rating.average ?? "Not rated yet"}`),
el("p", "seasons", `Seasons: ${seasons.length}`),
);

//STEP 6 — Challenge: Add a button to add the show to favorites
const favoriteBtn = el("button", "favorite-btn", "Add to Favorites");
favoriteBtn.addEventListener("click", () => {
  const added = saveFavorite(show);
  if (added) {
    setStatus(`"${show.name}" added to favorites.`, "info");
    renderFavorites();
  } else {
    setStatus(`"${show.name}" is already in favorites.`, "error");
  }
});
detailsBody.appendChild(favoriteBtn);

  const castList = el("ul", "cast-list");
  cast.forEach(c => {
    const li = el("li", null, c.person.name);
    castList.appendChild(li);
  });
  detailsBody.appendChild(castList);

  const seasonsList = el("ul", "seasons-list");
  seasons.forEach(s => {
    const li = el("li", null, `Season ${s.number}: ${s.episodeOrder ?? "Unknown"} episodes`);
    seasonsList.appendChild(li);
  });
  detailsBody.appendChild(seasonsList); 
}

// STEP 6 — Challenge
const FAVORITES_KEY = "palabasFavorites";

function getFavorites() {
  return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
}

function saveFavorite(show) {
  const favorites = getFavorites();

  const alreadySaved = favorites.some(favorite => favorite.id === show.id);

  if (alreadySaved) {
    return false;
  }

  favorites.push({
    id: show.id,
    name: show.name
  });

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));

  return true;
}

function removeFavorite(showId) {
  const favorites = getFavorites();
  const updatedFavorites = favorites.filter(favorite => favorite.id !== showId);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
}

localStorage.setItem(FAVORITES_KEY, JSON.stringify([])); // Clear favorites for testing

function renderFavorites() {
  let favoritesSection = document.getElementById("favorites");
  if (!favoritesSection) {
  favoritesSection = el("section", "favorites");
  favoritesSection.id = "favorites";
  document.body.appendChild(favoritesSection);
}
//favorite section styling
favoritesSection.style.maxWidth = "800px";
favoritesSection.style.margin = "30px auto";
favoritesSection.style.padding = "20px";
favoritesSection.style.backgroundColor = "#070303";
favoritesSection.style.borderRadius = "12px";
favoritesSection.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";

  const favoritesList = el("ul", "favorites-list");

favoritesList.style.listStyle = "none";
favoritesList.style.padding = "0";
favoritesList.style.marginTop = "15px";

  const favorites = getFavorites();

  if (favorites.length === 0) {
    const noFavoritesMsg = el("p", null, "No favorite shows yet.");
    favoritesList.appendChild(noFavoritesMsg);
  } else {
    favorites.forEach(favorite => {
      const li = el("li", null, favorite.name);

      //favorite list item styling
      li.style.display = "flex";
li.style.justifyContent = "space-between";
li.style.alignItems = "center";
li.style.padding = "12px";
li.style.marginBottom = "10px";
li.style.backgroundColor = "#706a6a";
li.style.borderRadius = "8px";

      const removeBtn = el("button", "remove-favorite", "Remove");
      removeBtn.addEventListener("click", () => {
        removeFavorite(favorite.id);
        renderFavorites();
      });
      li.appendChild(removeBtn);
      favoritesList.appendChild(li);
    });

    
  }

  favoritesSection.innerHTML = "";
  favoritesSection.appendChild(el("h2", null, "Favorites"));
  favoritesSection.appendChild(favoritesList);
}

renderFavorites();  


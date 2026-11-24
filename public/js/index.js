// public/js/index.js - home page: list of shows with live seat count

async function loadShows() {
  const search = document.getElementById("search").value;
  const category = document.getElementById("category").value;
  const params = new URLSearchParams({ search, category });

  try {
    const shows = await api("/api/shows?" + params);
    const box = document.getElementById("shows");

    if (shows.length === 0) {
      box.innerHTML = "<p>No shows found.</p>";
      return;
    }

    box.innerHTML = shows
      .map((show) => {
        const over = new Date(show.showTime) <= new Date();
        return `
        <div class="card">
          <span class="tag">${escapeHtml(show.category)}</span>
          <h3>${escapeHtml(show.title)}</h3>
          <p class="small">${escapeHtml(show.venue)}</p>
          <p class="small">${formatDate(show.showTime)}</p>
          <p>Rs. ${show.price}</p>
          <p>Seats left: <span class="seats" id="seats-${show._id}">${show.availableSeats}</span></p>
          ${over ? "<button disabled>Show over</button>" : `<a class="btn" href="/show.html?id=${show._id}">Book</a>`}
        </div>`;
      })
      .join("");
  } catch (err) {
    showMessage("message", err.message, true);
  }
}

async function start() {
  await refreshAccessToken(); // are we logged in?
  renderNav();
  await loadShows();

  document.getElementById("searchBtn").onclick = loadShows;

  // live: when anyone books or cancels, change the number on the card
  const socket = connectSocket();
  socket.on("seatsUpdated", (data) => {
    const el = document.getElementById("seats-" + data.showId);
    if (el) el.textContent = data.availableSeats;
  });
}

start();

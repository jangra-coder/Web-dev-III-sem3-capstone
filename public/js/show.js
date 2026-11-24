// public/js/show.js - one show: details, book seats, live seat count, email link

const showId = new URLSearchParams(window.location.search).get("id");
let show = null;

function renderDetails() {
  document.getElementById("details").innerHTML = `
    <span class="tag">${escapeHtml(show.category)}</span>
    <h2>${escapeHtml(show.title)}</h2>
    <p>${escapeHtml(show.description)}</p>
    <p class="small">Venue: ${escapeHtml(show.venue)}</p>
    <p class="small">When: ${formatDate(show.showTime)}</p>
    <p>Price: Rs. ${show.price} per seat</p>
    <p>Seats left: <span class="seats" id="seatsLeft">${show.availableSeats}</span> / ${show.totalSeats}</p>`;
}

function renderBookBox() {
  const box = document.getElementById("bookBox");
  if (!currentUser) {
    box.innerHTML = '<p>Please <a href="/login.html">login</a> to book tickets.</p>';
    return;
  }
  box.innerHTML = `
    <form id="bookForm">
      <label>Number of seats (1 - 10)</label>
      <input type="number" id="seats" min="1" max="10" value="1" required>
      <p class="small">Total: Rs. <span id="total">${show.price}</span></p>
      <button type="submit">Book now</button>
    </form>`;

  document.getElementById("seats").oninput = (e) => {
    document.getElementById("total").textContent = (Number(e.target.value) || 0) * show.price;
  };

  document.getElementById("bookForm").onsubmit = async (e) => {
    e.preventDefault();
    const seats = Number(document.getElementById("seats").value);
    try {
      const booking = await api("/api/bookings", { method: "POST", body: { showId, seats } });
      showMessage("message", `Booked ${booking.seats} seat(s) for Rs. ${booking.totalPrice}. Confirmation email is on the way...`, false);
    } catch (err) {
      showMessage("message", err.message, true);
    }
  };
}

async function start() {
  await refreshAccessToken();
  renderNav();

  try {
    show = await api("/api/shows/" + showId);
  } catch (err) {
    showMessage("message", err.message, true);
    return;
  }
  renderDetails();
  renderBookBox();

  const socket = connectSocket();

  // live seat count for this show
  socket.on("seatsUpdated", (data) => {
    if (data.showId === showId) {
      document.getElementById("seatsLeft").textContent = data.availableSeats;
    }
  });

  // only I get this one (my own room on the server)
  socket.on("emailSent", (data) => {
    const box = document.getElementById("emailBox");
    if (data.emailPreviewUrl) {
      // local testing: Ethereal test inbox link
      box.innerHTML = `Your confirmation email is ready: <a href="${data.emailPreviewUrl}" target="_blank">open email</a>`;
    } else {
      box.textContent = `Confirmation email sent to ${currentUser.email}`;
    }
  });
}

start();

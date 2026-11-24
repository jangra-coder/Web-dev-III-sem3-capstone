// public/js/admin.js - admin: add / edit / delete shows, see all bookings, live activity

let shows = [];
let editingId = null; // id of the show being edited, null = adding a new one

// Date -> "YYYY-MM-DDTHH:MM" in local time, the format <input type="datetime-local"> needs
function toInputDate(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

async function loadShows() {
  shows = await api("/api/shows");
  document.getElementById("showRows").innerHTML = shows
    .map(
      (s) => `
      <tr>
        <td>${escapeHtml(s.title)}</td>
        <td>${escapeHtml(s.venue)}</td>
        <td>${formatDate(s.showTime)}</td>
        <td>Rs. ${s.price}</td>
        <td id="seats-${s._id}">${s.availableSeats} / ${s.totalSeats}</td>
        <td>
          <button class="btn-small btn-grey" onclick="editShow('${s._id}')">Edit</button>
          <button class="btn-small" onclick="deleteShow('${s._id}')">Delete</button>
        </td>
      </tr>`
    )
    .join("");
}

async function loadAllBookings() {
  const bookings = await api("/api/bookings");
  document.getElementById("bookingRows").innerHTML = bookings
    .map(
      (b) => `
      <tr>
        <td>${b.user ? escapeHtml(b.user.name) + "<br><span class='small'>" + escapeHtml(b.user.email) + "</span>" : "-"}</td>
        <td>${b.show ? escapeHtml(b.show.title) : "(deleted show)"}</td>
        <td>${b.seats}</td>
        <td>Rs. ${b.totalPrice}</td>
        <td class="status-${b.status}">${b.status}</td>
        <td>${formatDate(b.createdAt)}</td>
        <td>${b.status === "confirmed" ? `<button class="btn-small" onclick="cancelBooking('${b._id}')">Cancel</button>` : ""}</td>
      </tr>`
    )
    .join("");
}

function editShow(id) {
  const s = shows.find((x) => x._id === id);
  editingId = id;
  document.getElementById("title").value = s.title;
  document.getElementById("category").value = s.category;
  document.getElementById("venue").value = s.venue;
  document.getElementById("showTime").value = toInputDate(s.showTime);
  document.getElementById("price").value = s.price;
  document.getElementById("totalSeats").value = s.totalSeats;
  document.getElementById("description").value = s.description;
  document.getElementById("formTitle").textContent = "Edit show";
  document.getElementById("saveBtn").textContent = "Save changes";
  document.getElementById("cancelEditBtn").hidden = false;
  window.scrollTo(0, 0);
}

function resetForm() {
  editingId = null;
  document.getElementById("showForm").reset();
  document.getElementById("formTitle").textContent = "Add a show";
  document.getElementById("saveBtn").textContent = "Add show";
  document.getElementById("cancelEditBtn").hidden = true;
}

async function deleteShow(id) {
  if (!confirm("Delete this show?")) return;
  try {
    await api("/api/shows/" + id, { method: "DELETE" });
    showMessage("message", "Show deleted", false);
    loadShows();
  } catch (err) {
    showMessage("message", err.message, true);
  }
}

async function cancelBooking(id) {
  if (!confirm("Cancel this booking?")) return;
  try {
    await api(`/api/bookings/${id}/cancel`, { method: "PATCH" });
    loadAllBookings();
    loadShows();
  } catch (err) {
    showMessage("message", err.message, true);
  }
}

document.getElementById("showForm").onsubmit = async (e) => {
  e.preventDefault();
  const body = {
    title: document.getElementById("title").value,
    category: document.getElementById("category").value,
    venue: document.getElementById("venue").value,
    // the browser's local time -> ISO string, so the server saves the right time
    showTime: new Date(document.getElementById("showTime").value).toISOString(),
    price: Number(document.getElementById("price").value),
    totalSeats: Number(document.getElementById("totalSeats").value),
    description: document.getElementById("description").value,
  };
  try {
    if (editingId) {
      await api("/api/shows/" + editingId, { method: "PUT", body });
      showMessage("message", "Show updated", false);
    } else {
      await api("/api/shows", { method: "POST", body });
      showMessage("message", "Show added", false);
    }
    resetForm();
    loadShows();
  } catch (err) {
    showMessage("message", err.message, true);
  }
};

document.getElementById("cancelEditBtn").onclick = resetForm;

function addActivity(text) {
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString("en-IN")} - ${text}`;
  document.getElementById("activity").prepend(li);
}

async function start() {
  await refreshAccessToken();
  renderNav();
  if (!currentUser || currentUser.role !== "admin") {
    showMessage("message", "Only admins can open this page.", true);
    return;
  }
  document.getElementById("adminArea").hidden = false;
  await loadShows();
  await loadAllBookings();

  // the server put this socket in the "admins" room because our token has role admin
  const socket = connectSocket();
  socket.on("newBooking", (d) => {
    addActivity(`${d.userName} booked ${d.seats} seat(s) for ${d.showTitle} (Rs. ${d.totalPrice})`);
    loadAllBookings();
  });
  socket.on("bookingCancelled", (d) => {
    addActivity(`A booking of ${d.seats} seat(s) for ${d.showTitle} was cancelled`);
    loadAllBookings();
  });
  socket.on("seatsUpdated", (d) => {
    const show = shows.find((s) => s._id === d.showId);
    const cell = document.getElementById("seats-" + d.showId);
    if (show && cell) cell.textContent = `${d.availableSeats} / ${show.totalSeats}`;
  });
}

start();

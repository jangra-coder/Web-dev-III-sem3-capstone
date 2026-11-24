// public/js/bookings.js - my bookings: list, cancel, email links

async function loadBookings() {
  try {
    const bookings = await api("/api/bookings/my");
    const rows = document.getElementById("rows");

    if (bookings.length === 0) {
      rows.innerHTML = '<tr><td colspan="8">No bookings yet.</td></tr>';
      return;
    }

    rows.innerHTML = bookings
      .map((b) => {
        const show = b.show; // filled by populate() on the server
        const canCancel = b.status === "confirmed" && show && new Date(show.showTime) > new Date();
        return `
        <tr>
          <td>${show ? escapeHtml(show.title) : "(deleted show)"}</td>
          <td>${show ? escapeHtml(show.venue) : ""}</td>
          <td>${show ? formatDate(show.showTime) : ""}</td>
          <td>${b.seats}</td>
          <td>Rs. ${b.totalPrice}</td>
          <td class="status-${b.status}">${b.status}</td>
          <td>${b.emailPreviewUrl ? `<a href="${b.emailPreviewUrl}" target="_blank">open</a>` : "sending..."}</td>
          <td>${canCancel ? `<button class="btn-small" onclick="cancelBooking('${b._id}')">Cancel</button>` : ""}</td>
        </tr>`;
      })
      .join("");
  } catch (err) {
    showMessage("message", err.message, true);
  }
}

async function cancelBooking(id) {
  if (!confirm("Cancel this booking?")) return;
  try {
    await api(`/api/bookings/${id}/cancel`, { method: "PATCH" });
    showMessage("message", "Booking cancelled, seats are free again.", false);
    loadBookings();
  } catch (err) {
    showMessage("message", err.message, true);
  }
}

async function start() {
  const loggedIn = await refreshAccessToken();
  if (!loggedIn) {
    window.location.href = "/login.html"; // this page needs login
    return;
  }
  renderNav();
  await loadBookings();

  // when my confirmation email is sent, reload the list to show the link
  const socket = connectSocket();
  socket.on("emailSent", loadBookings);
}

start();

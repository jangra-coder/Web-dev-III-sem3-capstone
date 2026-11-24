// public/js/common.js - code that every page uses

let accessToken = null; // kept only in memory (not localStorage), so other scripts can't steal it
let currentUser = null;

// get a new access token using the refresh token cookie (sent by the browser automatically)
async function refreshAccessToken() {
  const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
  if (!res.ok) {
    accessToken = null;
    currentUser = null;
    return false;
  }
  const data = await res.json();
  accessToken = data.accessToken;
  currentUser = data.user;
  return true;
}

// call our API. If the access token has expired (401), refresh it once and try again.
async function api(path, options = {}) {
  const send = () =>
    fetch(path, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: "Bearer " + accessToken } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: "include",
    });

  let res = await send();
  if (res.status === 401 && accessToken && (await refreshAccessToken())) {
    res = await send(); // same request again, now with the new token
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
}

// top menu: changes if you are logged in / admin
function renderNav() {
  const nav = document.getElementById("nav");
  let html = '<a href="/index.html">Shows</a>';
  if (currentUser) {
    html += '<a href="/bookings.html">My Bookings</a>';
    if (currentUser.role === "admin") {
      html += '<a href="/admin.html">Admin</a>';
    }
    html += `<span class="hello">Hi, ${escapeHtml(currentUser.name)}</span>`;
    html += '<button id="logoutBtn" class="btn-small">Logout</button>';
  } else {
    html += '<a href="/login.html">Login</a>';
  }
  nav.innerHTML = html;

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.onclick = logout;
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  accessToken = null;
  currentUser = null;
  window.location.href = "/login.html";
}

// Socket.IO connection. The token lets the server put us in our own room (and "admins")
function connectSocket() {
  return io({ auth: accessToken ? { token: accessToken } : {} });
}

function formatDate(date) {
  return new Date(date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

// stops HTML inside data (like a show title) from running on the page (XSS)
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

function showMessage(id, text, isError) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = isError ? "message error" : "message success";
}

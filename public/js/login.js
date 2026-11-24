// public/js/login.js - login, register, and errors coming back from GitHub login

async function login(email, password) {
  const data = await api("/api/auth/login", { method: "POST", body: { email, password } });
  accessToken = data.accessToken; // the refresh token was saved as a cookie by the server
  window.location.href = "/index.html";
}

document.getElementById("loginForm").onsubmit = async (e) => {
  e.preventDefault(); // stop the normal form submit (page reload)
  try {
    await login(
      document.getElementById("loginEmail").value,
      document.getElementById("loginPassword").value
    );
  } catch (err) {
    showMessage("message", err.message, true);
  }
};

document.getElementById("registerForm").onsubmit = async (e) => {
  e.preventDefault();
  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  try {
    await api("/api/auth/register", { method: "POST", body: { name, email, password } });
    await login(email, password); // log in straight after registering
  } catch (err) {
    showMessage("message", err.message, true);
  }
};

// ?error=... is set by the GitHub login when something goes wrong
const error = new URLSearchParams(window.location.search).get("error");
if (error === "github-not-set-up") {
  showMessage("message", "GitHub login is not set up on this server yet.", true);
} else if (error) {
  showMessage("message", "GitHub login failed, please try again.", true);
}

renderNav();

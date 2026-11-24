// controllers/githubController.js - "Login with GitHub" (OAuth), done with fetch, no extra library
// Flow: our site -> GitHub login page -> GitHub sends back a "code" -> we swap the code
// for a GitHub token -> we read the GitHub profile -> we login that user with our own JWT
const crypto = require("crypto");
const User = require("../models/User");
const { startSession } = require("./authController");

// GET /api/auth/github - send the user to GitHub
const githubLogin = (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID) {
    return res.redirect("/login.html?error=github-not-set-up");
  }

  // random "state", checked again in the callback so nobody can fake the callback (CSRF)
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("oauthState", state, { httpOnly: true, sameSite: "lax", maxAge: 10 * 60 * 1000 });

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: "read:user user:email",
    state: state,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
};

// GET /api/auth/github/callback?code=...&state=...
const githubCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    if (!code || !state || state !== req.cookies.oauthState) {
      return res.redirect("/login.html?error=github");
    }
    res.clearCookie("oauthState");

    // 1. swap the code for a GitHub access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.redirect("/login.html?error=github");
    }

    // 2. read the GitHub profile with that token
    const headers = {
      Authorization: `Bearer ${tokenData.access_token}`,
      "User-Agent": "book-my-show-capstone",
    };
    const profile = await (await fetch("https://api.github.com/user", { headers })).json();

    // 3. the email can be private on GitHub, then ask for the email list
    let email = profile.email;
    if (!email) {
      const emails = await (await fetch("https://api.github.com/user/emails", { headers })).json();
      const primary = Array.isArray(emails) && emails.find((e) => e.primary && e.verified);
      email = primary ? primary.email : `${profile.login}@users.noreply.github.com`;
    }

    // 4. find this user (by GitHub id, then by email) or make a new one
    let user = await User.findOne({ githubId: String(profile.id) });
    if (!user) user = await User.findOne({ email: email.toLowerCase() });
    if (!user) user = new User({ name: profile.name || profile.login, email: email });
    user.githubId = String(profile.id);

    // 5. same tokens as a normal login, then go to the home page
    await startSession(user, res);
    res.redirect("/index.html");
  } catch (err) {
    next(err);
  }
};

module.exports = { githubLogin, githubCallback };

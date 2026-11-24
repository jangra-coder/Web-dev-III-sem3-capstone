# Book My Show - Web Dev III Capstone

**Rahul (2501350043)** - B.Tech CSE (Full Stack), Semester 3, Section B
Course: Web Development - III

A Book My Show style app. Users can see shows, book tickets and get a confirmation
email. Seat counts change live on every open page, and the admin sees new bookings
as they happen.

**Live link:** _will be added after deployment_

## Features

| Phase | What is done |
| --- | --- |
| 1. Backend design | Express + MVC folders, MongoDB with Mongoose (User, Show, Booking), route list |
| 2. Auth | Register / login with bcrypt + JWT, access token (15 min) + refresh token (httpOnly cookie, 7 days), login with GitHub (OAuth), protected routes, roles (user / admin) |
| 3. CRUD + booking + email | Admin adds / edits / deletes shows, users book and cancel tickets, confirmation email (Nodemailer locally, SendGrid on the live site) |
| 4. Real-time | EventEmitter + Socket.IO: live seat count for everyone, live booking alerts for admins, "email ready" message for the user |
| 5. Deploy + docs | API docs, Postman collection, sample data, deployment |

## Tech used

- Node.js, Express.js 4
- MongoDB + Mongoose
- bcrypt, jsonwebtoken, cookie-parser
- GitHub OAuth (done with `fetch`, no extra library)
- Nodemailer with an Ethereal test inbox (on my computer) and SendGrid (on the live site)
- Socket.IO + Node's EventEmitter
- dotenv, cors
- Plain HTML, CSS and JavaScript for the pages

## Folder structure

```
config/
  db.js                  connect to MongoDB
  mailer.js              emails: SendGrid if a key is set, else Nodemailer + Ethereal
models/
  User.js                name, email, passwordHash, githubId, role, refreshToken
  Show.js                title, category, venue, showTime, price, totalSeats, availableSeats
  Booking.js             user -> User, show -> Show, seats, totalPrice, status
controllers/
  authController.js      register, login, refresh, logout, me
  githubController.js    login with GitHub
  showController.js      shows CRUD
  bookingController.js   book, my bookings, cancel, all bookings
routes/                  URL -> middleware -> controller
middleware/auth.js       authenticate (JWT) and authorize (role)
events/
  bookingEvents.js       the EventEmitter
  emailListener.js       sends the email when a booking is made
socket.js                Socket.IO (rooms + live events)
public/                  HTML pages + js + css
docs/                    API docs and Postman collection
app.js                   Express app, routes, error handler
server.js                starts everything
seed.js                  sample data
```

## Database design

```
User 1 ---- * Booking * ---- 1 Show
```

- **users**: `name`, `email` (unique), `passwordHash` (bcrypt), `githubId`, `role` (user / admin), `refreshToken`
- **shows**: `title`, `category` (Movie / Concert / Comedy / Sports / Other), `description`, `venue`, `showTime`, `price`, `totalSeats`, `availableSeats`
- **bookings**: `user` (ref User), `show` (ref Show), `seats` (1-10), `totalPrice`, `status` (confirmed / cancelled), `emailPreviewUrl`

Bookings keep only the ids of the user and the show (references), and `populate()` fills in the details when needed.

## How to run on your computer

1. Install Node.js (20 or newer) and MongoDB, and start MongoDB
2. `npm install`
3. copy `.env.example` to `.env` and put any long random strings in the two token secrets
4. `npm run seed` (adds the sample data below)
5. `npm run dev`
6. open http://localhost:3000

### Demo accounts (from `npm run seed`)

| Role | Email | Password |
| --- | --- | --- |
| admin | admin@example.com | Admin@123 |
| user | rahul@example.com | Rahul@123 |

New accounts made from the register page are always normal users.

## Environment variables

| Name | Example | Used for |
| --- | --- | --- |
| PORT | 3000 | server port |
| NODE_ENV | development | `production` makes the cookie https-only |
| MONGODB_URI | mongodb://127.0.0.1:27017/BookMyShow | database |
| CLIENT_URL | http://localhost:3000 | CORS for the API and Socket.IO |
| ACCESS_TOKEN_SECRET | (long random string) | signs access tokens |
| REFRESH_TOKEN_SECRET | (another long random string) | signs refresh tokens |
| GITHUB_CLIENT_ID | from GitHub | GitHub login |
| GITHUB_CLIENT_SECRET | from GitHub | GitHub login |
| GITHUB_CALLBACK_URL | http://localhost:3000/api/auth/github/callback | GitHub login |
| SENDGRID_API_KEY | (empty on your computer) | only on the live site, real emails |
| SENDGRID_FROM | your verified sender email | only on the live site |

### Setting up GitHub login

1. GitHub > Settings > Developer settings > OAuth Apps > New OAuth App
2. Homepage URL: `http://localhost:3000`
3. Authorization callback URL: `http://localhost:3000/api/auth/github/callback`
4. Copy the Client ID and a new Client Secret into `.env`

## Emails

- **On my computer** (no SendGrid key): Nodemailer sends to an Ethereal test inbox. Nothing is really delivered, but each booking gets an "open email" link to see the email.
- **On the live site**: Render's free plan blocks the SMTP ports (25, 465, 587), so Nodemailer can't send from there. When `SENDGRID_API_KEY` is set, `config/mailer.js` sends the same email with SendGrid over https, to the user's real inbox (check spam too).

## API

All routes with request / response examples: [docs/API.md](docs/API.md)

Postman: import [docs/BookMyShow.postman_collection.json](docs/BookMyShow.postman_collection.json)
(run `npm run seed` first). It has 28 requests with tests, including the error cases.

| Method | Route | Who |
| --- | --- | --- |
| POST | /api/auth/register | anyone |
| POST | /api/auth/login | anyone |
| POST | /api/auth/refresh | anyone with the cookie |
| POST | /api/auth/logout | anyone |
| GET | /api/auth/me | logged in |
| GET | /api/auth/github | anyone |
| GET | /api/shows | anyone |
| GET | /api/shows/:id | anyone |
| POST | /api/shows | admin |
| PUT | /api/shows/:id | admin |
| DELETE | /api/shows/:id | admin |
| POST | /api/bookings | logged in |
| GET | /api/bookings/my | logged in |
| PATCH | /api/bookings/:id/cancel | owner or admin |
| GET | /api/bookings | admin |

## How a booking works (request flow)

1. `POST /api/bookings` -> `routes/bookingRoutes.js`
2. `authenticate` checks the access token and puts `{ id, role }` in `req.user`
3. `createBooking` takes the seats with one query (`availableSeats >= seats`, then `$inc` by `-seats`), so two people can't get the same last seats
4. the booking is saved and `bookingEvents.emit("bookingCreated")` is called, then the reply (201) is sent
5. `emailListener.js` sends the confirmation email, saves its link, then emits `emailSent`
6. `socket.js` sends `seatsUpdated` to everyone, `newBooking` to the admins room, and `emailSent` to that user's room

## Real-time events (Socket.IO)

| Event | Who gets it |
| --- | --- |
| seatsUpdated | everyone (guests too) |
| newBooking | admins |
| bookingCancelled | admins |
| emailSent | only the user who booked |

## Screenshots

_will be added after deployment_

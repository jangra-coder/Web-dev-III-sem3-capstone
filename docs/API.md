# API Documentation - Book My Show

Base URL (local): `http://localhost:3000`

All bodies are JSON (`Content-Type: application/json`).
Protected routes need the header `Authorization: Bearer <accessToken>`.
You get the access token from login (or from refresh). It lasts 15 minutes.

The Postman collection with all these requests is in [BookMyShow.postman_collection.json](BookMyShow.postman_collection.json).

## Status codes used

| Code | Meaning in this app |
| --- | --- |
| 200 | OK |
| 201 | created (register, new show, new booking) |
| 400 | wrong data (validation, invalid id, not enough seats) |
| 401 | not logged in / token missing, wrong or expired |
| 403 | logged in but not allowed (role), or refresh token cancelled |
| 404 | not found |
| 409 | email already registered |
| 500 | server error |

---

## Auth - `/api/auth`

### POST /api/auth/register
Anyone. Role is always `user` (a `role` sent in the body is ignored).

```json
{ "name": "Rahul", "email": "rahul@example.com", "password": "Rahul@123" }
```
201 response (the password hash is never sent):
```json
{ "_id": "...", "name": "Rahul", "email": "rahul@example.com", "role": "user", "createdAt": "...", "updatedAt": "..." }
```
Errors: 400 `Password must be at least 6 characters`, 400 `Name is required, Please enter a valid email`, 409 `Email already registered`

### POST /api/auth/login
```json
{ "email": "rahul@example.com", "password": "Rahul@123" }
```
200 response, plus a cookie `refreshToken` (httpOnly, 7 days):
```json
{ "accessToken": "eyJhbGciOi...", "user": { "_id": "...", "name": "Rahul", "role": "user" } }
```
Errors: 400 `Email and password are required`, 401 `Invalid email or password`

### POST /api/auth/refresh
No body. Uses the `refreshToken` cookie. Gives a new access token.
```json
{ "accessToken": "eyJhbGciOi...", "user": { "...": "..." } }
```
Errors: 401 `Please login` (no cookie), 403 `Refresh token is not valid any more` (after logout)

### POST /api/auth/logout
Removes the refresh token from the database and clears the cookie.
```json
{ "message": "Logged out" }
```

### GET /api/auth/me (logged in)
Returns your own profile (the id is taken from the token).

### GET /api/auth/github
Redirects to GitHub. After login GitHub sends the user to
`/api/auth/github/callback`, the server sets the refresh cookie and redirects to `/index.html`.

---

## Shows - `/api/shows`

### GET /api/shows
Anyone. Optional filters: `?search=galaxy` (title, ignores case) and `?category=Movie`.
Sorted by show time.
```json
[
  {
    "_id": "...",
    "title": "Galaxy Raiders 2",
    "category": "Movie",
    "description": "Space action movie, part two. 3D show.",
    "venue": "INOX Sector 29, Gurugram",
    "showTime": "2026-11-27T15:30:00.000Z",
    "price": 300,
    "totalSeats": 100,
    "availableSeats": 96
  }
]
```

### GET /api/shows/:id
Anyone. Errors: 400 `Invalid show id`, 404 `Show not found`

### POST /api/shows (admin)
```json
{
  "title": "Stand-up Saturday",
  "category": "Comedy",
  "description": "Four new comedians, one evening.",
  "venue": "Kingdom of Dreams, Gurugram",
  "showTime": "2026-11-30T14:30:00.000Z",
  "price": 499,
  "totalSeats": 80
}
```
`category` is one of Movie, Concert, Comedy, Sports, Other. `availableSeats` is set to `totalSeats`.
201 with the new show. Errors: 400 validation (e.g. `Title is required, Price can not be negative`), 401, 403

### PUT /api/shows/:id (admin)
Send only the fields to change, e.g. `{ "price": 549, "totalSeats": 90 }`.
If total seats change, booked seats stay booked.
Error: 400 `3 seats are already booked, total can't be less`

### DELETE /api/shows/:id (admin)
```json
{ "message": "Show deleted" }
```
Error: 400 `This show has bookings, cancel them first`

---

## Bookings - `/api/bookings` (all need login)

### POST /api/bookings
```json
{ "showId": "...", "seats": 2 }
```
201 response:
```json
{ "_id": "...", "user": "...", "show": "...", "seats": 2, "totalPrice": 500, "status": "confirmed", "createdAt": "..." }
```
After this the server sends the confirmation email (Ethereal test inbox) and the
live updates. A few seconds later the booking gets `emailPreviewUrl`.

Errors: 400 `You can book 1 to 10 seats`, 400 `Only 3 seats left`, 400 `This show has already started`, 404 `Show not found`

### GET /api/bookings/my
Your bookings, newest first, with show details (populate).
```json
[
  {
    "_id": "...",
    "show": { "_id": "...", "title": "The Last Monsoon", "venue": "PVR Ambience Mall, Gurugram", "showTime": "...", "price": 250 },
    "seats": 2,
    "totalPrice": 500,
    "status": "confirmed",
    "emailPreviewUrl": "https://ethereal.email/message/..."
  }
]
```

### PATCH /api/bookings/:id/cancel
Owner or admin. Seats go back to the show.
Errors: 403 `You can only cancel your own bookings`, 400 `Booking is already cancelled`, 400 `Show has already started, can't cancel`

### GET /api/bookings (admin)
Every booking with user name/email and show title.

---

## Real-time (Socket.IO)

Connect from the browser with the access token (optional):
```js
const socket = io({ auth: { token: accessToken } });
```
No token = guest (only public updates). A wrong token is refused with `Authentication failed`.

| Event | Who gets it | Data |
| --- | --- | --- |
| seatsUpdated | everyone | `{ showId, availableSeats }` |
| newBooking | admins room | `{ userName, showTitle, seats, totalPrice }` |
| bookingCancelled | admins room | `{ showTitle, seats }` |
| emailSent | only the user who booked | `{ bookingId, emailPreviewUrl }` |

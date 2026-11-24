# API Routes - Book My Show

Base URL (local): `http://localhost:3000`

Protected routes need the header `Authorization: Bearer <accessToken>`.

## Auth

| Method | Route | Who | What it does |
| --- | --- | --- | --- |
| POST | /api/auth/register | anyone | create an account (role is always `user`) |
| POST | /api/auth/login | anyone | login, gives access token + refresh token cookie |
| POST | /api/auth/refresh | anyone with the cookie | new access token |
| POST | /api/auth/logout | anyone | cancels the refresh token, clears the cookie |
| GET | /api/auth/me | logged in | my own profile |
| GET | /api/auth/github | anyone | go to GitHub login |
| GET | /api/auth/github/callback | GitHub | GitHub sends the user back here |

## Shows

| Method | Route | Who | What it does |
| --- | --- | --- | --- |
| GET | /api/shows | anyone | list shows (`?search=` and `?category=` filters) |
| GET | /api/shows/:id | anyone | one show |
| POST | /api/shows | admin | add a show |
| PUT | /api/shows/:id | admin | edit a show |
| DELETE | /api/shows/:id | admin | delete a show (only if it has no bookings) |

## Bookings

| Method | Route | Who | What it does |
| --- | --- | --- | --- |
| POST | /api/bookings | logged in | book seats for a show, sends confirmation email |
| GET | /api/bookings/my | logged in | my bookings |
| PATCH | /api/bookings/:id/cancel | owner or admin | cancel a booking, seats go back |
| GET | /api/bookings | admin | all bookings |

## Real-time (Socket.IO events)

| Event | Sent to | When |
| --- | --- | --- |
| seatsUpdated | everyone | seats of a show change (booking or cancel) |
| newBooking | admins room | someone books |
| bookingCancelled | admins room | someone cancels |
| emailSent | that user only | their confirmation email is ready |

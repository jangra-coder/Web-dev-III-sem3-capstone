# Book My Show - Web Dev III Capstone

Rahul (2501350043) - B.Tech CSE (Full Stack), Sem 3

A Book My Show style app where users can see shows, book tickets and get live updates.

## Tech used

- Node.js + Express.js
- MongoDB with Mongoose

## Folder structure

```
config/        database connection
models/        User, Show, Booking schemas
controllers/   logic for each route
routes/        URL -> controller
middleware/    auth checks
public/        HTML pages
docs/          API route list
app.js         Express app
server.js      starts the server
```

## How to run

1. `npm install`
2. copy `.env.example` to `.env`
3. start MongoDB on your computer
4. `npm run dev`
5. open http://localhost:3000/api

API routes are in [docs/API.md](docs/API.md).

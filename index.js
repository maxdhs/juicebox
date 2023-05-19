require("dotenv").config();
const express = require("express");
const server = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// how do we connect to the database from here?
const { Client } = require("pg");

const client = new Client(
  process.env.NODE_ENV === "dev"
    ? {
        database: "twitter",
        password: "postgres",
        user: "postgres",
      }
    : process.env.DB_URL
);

client.connect();

// lets create some tables
async function seed() {
  await client.query(`
    DROP TABLE IF EXISTS users;
    CREATE TABLE users (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL);
    `);
}
seed();

server.use(express.json());

// i want this middleware to verify token and save user info on req.user
server.use((req, res, next) => {
  const token = req.headers.authorization?.slice(7);
  if (!token) {
    return next();
  }
  const isVerified = jwt.verify(token, process.env.JWT_SECRET);
  req.user = isVerified;
  next();
});

server.post("/api/tweets", (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.send({ success: false, error: "You must provide content." });
  }
  // we need to know who the user is?
  // if someone is not logged in send a response like you have to be logged in?
  if (!req.user) {
    return res.send({ success: false, error: "Need to be a user to tweet" });
  }
  res.send({ success: true });
});

server.post("/api/users/register", async (req, res) => {
  // how do we check if the user exists?
  const { email, password } = req.body;
  // how can we check that username and password are defined and if not send a response saying they are required
  if (!email || !password) {
    return res.send({
      success: false,
      error: "email and password is required to register",
    });
  }

  let user = await client.query(
    `
  SELECT * FROM users WHERE email = $1;
  `,
    [req.body.email]
  );
  user = user.rows[0];
  if (user) {
    res.send({
      success: false,
      error: "You are already registered, please sign in",
    });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);

  user = await client.query(
    `
  INSERT INTO users (email, password) VALUES ($1, $2) RETURNING email, id;
  `,
    [email, hashed]
  );
  user = user.rows[0];

  const token = await jwt.sign({ id: user.id, email }, process.env.JWT_SECRET);

  res.send({ success: true, user, token });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log("server is listening on ", PORT);
});

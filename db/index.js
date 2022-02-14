// inside db/index.js
const { Client } = require("pg"); // imports the pg module

// supply the db name and location of the database
const client = new Client({
  user: "postgres",
  password: "postgres",
  database: "juicebox-dev",
});

async function getAllUsers() {
  const { rows } = await client.query(
    `SELECT id, username, name, location, active
      FROM users;
    `
  );

  return rows;
}

async function createUser({ username, password, name, location }) {
  try {
    const { rows } = await client.query(
      `
      INSERT INTO users(username, password, name, location) 
      VALUES($1, $2, $3, $4) 
      ON CONFLICT (username) DO NOTHING 
      RETURNING *;
      `,
      [username, password, name, location]
    );

    return rows[0];
  } catch (error) {
    throw error;
  }
}

async function createPost({ authorId, title, content }) {
  try {
    const { rows } = await client.query(
      `
      INSERT INTO posts("authorId", title, content) 
      VALUES($1, $2, $3) 
      RETURNING *;
      `,
      [authorId, title, content]
    );

    return rows[0];
  } catch (error) {
    throw error;
  }
}

async function updateUser(id, fields) {
  for (let key of Object.keys(fields)) {
    await client.query(
      `
    UPDATE users SET ${key} = $1
    WHERE id = $2
    RETURNING *;
    `,
      [fields[key], id]
    );
  }
  const response = await client.query(
    `
  SELECT * FROM users
  WHERE id = $1;
  `,
    [id]
  );
  return response.rows[0];
}

async function updatePost(id, fields) {
  for (let key of Object.keys(fields)) {
    await client.query(
      `
    UPDATE posts SET ${key} = $1
    WHERE id = $2
    RETURNING *;
    `,
      [fields[key], id]
    );
  }
  const response = await client.query(
    `
  SELECT * FROM posts
  WHERE id = $1;
  `,
    [id]
  );
  return response.rows[0];
}

async function getAllPosts() {
  const { rows } = await client.query(
    `SELECT *
      FROM posts;
    `
  );

  return rows;
}

async function getPostsByUser(id) {
  const { rows } = await client.query(
    `SELECT *
      FROM posts
      WHERE "authorId" = $1
      ;
    `,
    [id]
  );

  return rows;
}

async function getUserById(id) {
  const {
    rows: [user],
  } = await client.query(
    `SELECT id, username, name, location
      FROM users
      WHERE id = $1
      ;
    `,
    [id]
  );

  const posts = await getPostsByUser(id);
  user.posts = posts;

  return user;
}

module.exports = {
  client,
  getAllUsers,
  createUser,
  updateUser,
  createPost,
  updatePost,
  getAllPosts,
  getPostsByUser,
  getUserById,
};

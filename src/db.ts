import { Pool } from "pg";

export const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "Fluffy4Me!",
  database: "leads",
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error", err);
});
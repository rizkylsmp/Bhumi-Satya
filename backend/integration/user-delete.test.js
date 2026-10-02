import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import migration from "../../backend/migrations/20261002000001-preserve-data-on-user-delete.cjs";

test("deleting a user preserves land, 2D, 3D, models, audit and rental requests", {
  skip: !process.env.TEST_DATABASE_URL,
}, async () => {
  const client = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL });
  await client.connect();
  try {
    await client.query("BEGIN");
    const schema = `user_delete_test_${process.pid}`;
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET LOCAL search_path TO "${schema}"`);
    await client.query(`
      CREATE TABLE users (id_user integer PRIMARY KEY);
      CREATE TABLE aset (id integer PRIMARY KEY, created_by integer NOT NULL REFERENCES users ON DELETE CASCADE);
      CREATE TABLE fields (id integer PRIMARY KEY, land_id integer REFERENCES aset ON DELETE CASCADE);
      CREATE TABLE buildings (id integer PRIMARY KEY, field_id integer REFERENCES fields ON DELETE CASCADE);
      CREATE TABLE models (id integer PRIMARY KEY, building_id integer REFERENCES buildings ON DELETE CASCADE);
      CREATE TABLE riwayat (id integer PRIMARY KEY, user_id integer NOT NULL REFERENCES users ON DELETE CASCADE);
      CREATE TABLE notifikasi (id integer PRIMARY KEY, user_id integer NOT NULL REFERENCES users ON DELETE CASCADE);
      CREATE TABLE requests (id integer PRIMARY KEY, user_id integer REFERENCES users);
      INSERT INTO users VALUES (1), (2);
      INSERT INTO aset VALUES (1, 1);
      INSERT INTO fields VALUES (1, 1);
      INSERT INTO buildings VALUES (1, 1);
      INSERT INTO models VALUES (1, 1);
      INSERT INTO riwayat VALUES (1, 1);
      INSERT INTO notifikasi VALUES (1, 1);
      INSERT INTO requests VALUES (1, 1);
    `);
    await client.query(migration.sql);
    await client.query(migration.sql);
    await client.query("DELETE FROM users WHERE id_user = 1");
    for (const table of ["aset", "fields", "buildings", "models", "riwayat", "notifikasi", "requests", "users"]) {
      assert.equal((await client.query(`SELECT count(*)::integer AS count FROM ${table}`)).rows[0].count, 1, table);
    }
    for (const [table, column] of [["aset", "created_by"], ["riwayat", "user_id"], ["notifikasi", "user_id"], ["requests", "user_id"]]) {
      assert.equal((await client.query(`SELECT ${column} FROM ${table}`)).rows[0][column], null);
    }
  } finally {
    await client.query("ROLLBACK");
    await client.end();
  }
});

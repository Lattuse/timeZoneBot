const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const DB_PATH = path.join(__dirname, "bot.db");
const db = new sqlite3.Database(DB_PATH);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function init() {
  await run(`
    CREATE TABLE IF NOT EXISTS user_tz (
      user_id TEXT PRIMARY KEY,
      tz TEXT NOT NULL
    );
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS panels (
      message_id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);
}

// user tz
async function setUserTz(userId, tz) {
  await run(
    `INSERT INTO user_tz(user_id, tz) VALUES(?, ?)
     ON CONFLICT(user_id) DO UPDATE SET tz=excluded.tz`,
    [userId, tz],
  );
}

async function getUserTz(userId) {
  const row = await get(`SELECT tz FROM user_tz WHERE user_id=?`, [userId]);
  return row?.tz ?? null;
}

// panels
async function addPanel({ messageId, guildId, channelId, createdBy }) {
  await run(
    `INSERT INTO panels(message_id, guild_id, channel_id, created_by, created_at)
     VALUES(?, ?, ?, ?, ?)`,
    [messageId, guildId, channelId, createdBy, Date.now()],
  );
}

async function removePanel(messageId) {
  await run(`DELETE FROM panels WHERE message_id=?`, [messageId]);
}

async function listPanels() {
  return await all(`SELECT message_id, guild_id, channel_id FROM panels`);
}

module.exports = {
  init,
  setUserTz,
  getUserTz,
  addPanel,
  removePanel,
  listPanels,
};

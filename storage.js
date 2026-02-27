const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "db.json");

function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch {
    return { userTz: {}, panels: [] };
  }
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function setUserTz(userId, tz) {
  const db = loadDB();
  db.userTz[userId] = tz;
  saveDB(db);
}

function getUserTz(userId) {
  const db = loadDB();
  return db.userTz[userId] || null;
}

function addPanel(panel) {
  const db = loadDB();
  db.panels.push(panel); // { guildId, channelId, messageId }
  saveDB(db);
}

function removePanel(messageId) {
  const db = loadDB();
  db.panels = db.panels.filter((p) => p.messageId !== messageId);
  saveDB(db);
}

function listPanels() {
  const db = loadDB();
  return db.panels;
}

module.exports = {
  setUserTz,
  getUserTz,
  addPanel,
  removePanel,
  listPanels,
};

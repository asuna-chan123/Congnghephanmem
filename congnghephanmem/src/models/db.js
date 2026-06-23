const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../database.sqlite');
const sqlFilePath = path.join(__dirname, 'db.sql');

// Connect to SQLite Database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

function initializeDatabase() {
  try {
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    db.exec(sql, (err) => {
      if (err) {
        console.error('Error seeding SQLite database:', err.message);
      } else {
        console.log('SQLite database schema initialized and seeded successfully.');
      }
    });
  } catch (err) {
    console.error('Failed to read SQL seed file:', err.message);
  }
}

// Promisified query helper
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

module.exports = {
  db,
  query,
  get
};

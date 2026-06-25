require('dotenv').config();
const { Pool } = require('pg');

// Khởi tạo Pool kết nối tới PostgreSQL (Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Cần cấu hình SSL để kết nối tới Supabase an toàn
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('Connected to Supabase PostgreSQL database.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Supabase client:', err.message);
});

// Hàm hỗ trợ thực thi truy vấn trả về mảng kết quả
async function query(sql, params = []) {
  let pgSql = sql;
  let paramCount = 1;
  
  // Tự động chuyển đổi dấu hỏi '?' của SQLite thành '$1, $2, ...' của PostgreSQL
  while (pgSql.includes('?')) {
    pgSql = pgSql.replace('?', `$${paramCount++}`);
  }
  
  // Tự động đổi IFNULL (SQLite) thành COALESCE (PostgreSQL)
  pgSql = pgSql.replace(/IFNULL/gi, 'COALESCE');

  try {
    const res = await pool.query(pgSql, params);
    return res.rows;
  } catch (err) {
    console.error('Supabase query error:', err.message, 'SQL:', pgSql);
    throw err;
  }
}

// Hàm hỗ trợ lấy 1 dòng kết quả đầu tiên
async function get(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0];
}

module.exports = {
  db: pool,
  query,
  get
};

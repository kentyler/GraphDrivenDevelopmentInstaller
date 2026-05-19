const { Pool } = require('pg');

function getSchema() {
  return process.env.GDD_SCHEMA_NAME || 'gdd';
}

function q(sql) {
  const s = getSchema();
  if (s === 'gdd') return sql;
  return sql
    .replaceAll('gdd.', s + '.')
    .replaceAll("table_schema='gdd'", "table_schema='" + s + "'")
    .replaceAll("nspname = 'gdd'", "nspname = '" + s + "'");
}

let pool = new Pool({
  host: process.env.GDD_DB_HOST || 'localhost',
  port: parseInt(process.env.GDD_DB_PORT || '5432'),
  database: process.env.GDD_DB_NAME || 'gdd',
  user: process.env.GDD_DB_USER || 'postgres',
  password: process.env.GDD_DB_PASSWORD,
});

function reinitPool() {
  pool = new Pool({
    host: process.env.GDD_DB_HOST || 'localhost',
    port: parseInt(process.env.GDD_DB_PORT || '5432'),
    database: process.env.GDD_DB_NAME || 'gdd',
    user: process.env.GDD_DB_USER || 'postgres',
    password: process.env.GDD_DB_PASSWORD,
  });
}

module.exports = { get pool() { return pool; }, get schema() { return getSchema(); }, q, reinitPool };

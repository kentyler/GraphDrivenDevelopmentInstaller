#!/usr/bin/env node

// GDD Bootstrap: creates the gdd schema, tables, enums, root intent,
// populates all self-referential intents with build_instructions,
// and creates the gdd-system graph.
//
// Usage:
//   GDD_DB_PASSWORD=yourpassword node run.js
//
// Or set all connection params:
//   GDD_DB_HOST=localhost GDD_DB_PORT=5432 GDD_DB_NAME=gdd GDD_DB_USER=postgres GDD_DB_PASSWORD=yourpassword node run.js

const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function run() {
  const client = await pool.connect();

  try {
    // Phase 1: Create database schema (if not exists)
    console.log('=== Phase 1: Schema ===\n');

    // Create gdd schema
    await client.query('CREATE SCHEMA IF NOT EXISTS gdd');
    console.log('Schema gdd ready.');

    // Run SQL files in order (using IF NOT EXISTS / OR REPLACE where possible)
    const sqlFiles = [
      '001-enums.sql',
      '002-tables.sql',
      '003-bootstrap.sql',
      '005-edge-boards-enums.sql',
      '006-edge-boards-tables.sql',
    ];

    for (const file of sqlFiles) {
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
      try {
        await client.query(sql);
        console.log(`  ${file} -- done`);
      } catch (err) {
        // Types/tables may already exist on re-run
        if (err.code === '42710' || err.code === '42P07') {
          console.log(`  ${file} -- already exists, skipping`);
        } else {
          throw err;
        }
      }
    }

    // Create default board (needed by edge-board nodes)
    await client.query(`
      INSERT INTO gdd.boards (id, created_by, statement)
      VALUES ('default-board', 'system', 'The original GDD intent graph')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('  Default board ready.');

    // Verify
    const enums = await client.query(`
      SELECT typname FROM pg_type
      WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'gdd')
      AND typtype = 'e' ORDER BY typname
    `);
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'gdd' ORDER BY table_name
    `);
    console.log(`\n  Enums: ${enums.rows.map(r => r.typname).join(', ')}`);
    console.log(`  Tables: ${tables.rows.map(r => r.table_name).join(', ')}`);
    const root = await client.query("SELECT id, name FROM gdd.nodes WHERE id = 'gdd-root'");
    console.log(`  Root intent: ${root.rows[0]?.name || 'MISSING'}`);

  } finally {
    client.release();
  }

  // Phase 2: Populate intents with build_instructions
  // These scripts manage their own connections and call pool.end(),
  // so we run them as child processes sequentially.
  console.log('\n=== Phase 2: Populate intents ===\n');

  const { execSync } = require('child_process');
  const env = { ...process.env, PATH: process.env.PATH };

  try {
    console.log('Running 004-populate-graph.js...');
    execSync('node 004-populate-graph.js', { cwd: __dirname, env, stdio: 'inherit' });
  } catch (err) {
    console.error('004-populate-graph.js failed');
    throw err;
  }

  try {
    console.log('\nRunning 009-populate-edge-boards.js...');
    execSync('node 009-populate-edge-boards.js', { cwd: __dirname, env, stdio: 'inherit' });
  } catch (err) {
    console.error('009-populate-edge-boards.js failed');
    throw err;
  }

  // Phase 3: Create gdd-system graph
  console.log('\n=== Phase 3: Create gdd-system graph ===\n');

  try {
    execSync('node 014-create-system-graph.js', { cwd: __dirname, env, stdio: 'inherit' });
  } catch (err) {
    console.error('014-create-system-graph.js failed');
    throw err;
  }

  console.log('\n=== Bootstrap complete ===');
  console.log('\nThe gdd-system graph is populated. All intents carry build_instructions.');
  console.log('Next: point your LLM at this folder and let it query the graph to begin building.');

  await pool.end();
}

run().catch(err => {
  console.error('\nBootstrap failed:', err.message);
  process.exit(1);
});

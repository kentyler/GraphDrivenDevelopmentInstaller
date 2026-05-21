#!/usr/bin/env node

// GDD Bootstrap: creates database (if needed), schema, tables, enums, root intent,
// populates all self-referential intents with build_instructions,
// and creates the gdd-system graph.
//
// Interactive usage (prompts for names):
//   GDD_DB_PASSWORD=yourpassword node run.js
//
// Non-interactive (env vars skip prompts):
//   GDD_DB_NAME=myproject GDD_SCHEMA_NAME=myproject GDD_BUILD_DIR=../MyProject GDD_DB_PASSWORD=yourpassword node run.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');

function ask(rl, question, defaultVal) {
  return new Promise(resolve => {
    const prompt = defaultVal ? `${question} [${defaultVal}]: ` : `${question}: `;
    rl.question(prompt, answer => {
      resolve(answer.trim() || defaultVal || '');
    });
  });
}

async function promptForNames() {
  // If all three env vars are set, skip prompts entirely
  if (process.env.GDD_DB_NAME && process.env.GDD_SCHEMA_NAME && process.env.GDD_BUILD_DIR) {
    return {
      dbName: process.env.GDD_DB_NAME,
      schemaName: process.env.GDD_SCHEMA_NAME,
      buildDir: process.env.GDD_BUILD_DIR,
    };
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('=== GDD Bootstrap ===\n');

  const dbName = process.env.GDD_DB_NAME || await ask(rl, 'Database name', 'gdd');
  const schemaDefault = dbName; // schema defaults to match DB name
  const schemaName = process.env.GDD_SCHEMA_NAME || await ask(rl, 'Schema name', schemaDefault);
  const buildDirDefault = '../' + dbName.charAt(0).toUpperCase() + dbName.slice(1);
  const buildDir = process.env.GDD_BUILD_DIR || await ask(rl, 'Build folder', buildDirDefault);

  rl.close();
  console.log('');

  return { dbName, schemaName, buildDir };
}

async function ensureDatabase(dbName) {
  const { Pool } = require('pg');

  // Connect to the default 'postgres' database to create the target
  const adminPool = new Pool({
    host: process.env.GDD_DB_HOST || 'localhost',
    port: parseInt(process.env.GDD_DB_PORT || '5432'),
    database: 'postgres',
    user: process.env.GDD_DB_USER || 'postgres',
    password: process.env.GDD_DB_PASSWORD,
  });

  try {
    // Check if database exists
    const result = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1', [dbName]
    );
    if (result.rows.length === 0) {
      // CREATE DATABASE can't use parameterized queries; validate the name
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(dbName)) {
        throw new Error(`Invalid database name: ${dbName}`);
      }
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Created database ${dbName}.`);
    } else {
      console.log(`Database ${dbName} already exists.`);
    }
  } finally {
    await adminPool.end();
  }
}

async function run() {
  const { dbName, schemaName, buildDir } = await promptForNames();

  // Set env vars so db.js and child processes pick them up
  process.env.GDD_DB_NAME = dbName;
  process.env.GDD_SCHEMA_NAME = schemaName;
  process.env.GDD_BUILD_DIR = buildDir;

  // Phase 0: Ensure database exists
  console.log(`Creating database ${dbName}...`);
  await ensureDatabase(dbName);
  console.log(`Database ${dbName} ready.\n`);

  // Reinitialize the pool now that GDD_DB_NAME is set
  const db = require('./db');
  db.reinitPool();
  const { pool, q } = db;

  const client = await pool.connect();

  try {
    // Phase 1: Create database schema (if not exists)
    console.log('=== Phase 1: Schema ===\n');

    // Validate schema name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schemaName)) {
      throw new Error(`Invalid schema name: ${schemaName}`);
    }
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    console.log(`Schema ${schemaName} ready.`);

    // Run SQL files in order (using IF NOT EXISTS / OR REPLACE where possible)
    const sqlFiles = [
      '001-enums.sql',
      '002-tables.sql',
      '003-bootstrap.sql',
      '005-edge-boards-enums.sql',
      '006-edge-boards-tables.sql',
      '015-peer-messages.sql',
    ];

    for (const file of sqlFiles) {
      const raw = fs.readFileSync(path.join(__dirname, file), 'utf8');
      const sql = q(raw);
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
    await client.query(q(`
      INSERT INTO gdd.boards (id, created_by, statement)
      VALUES ('default-board', 'system', 'The original GDD intent graph')
      ON CONFLICT (id) DO NOTHING
    `));
    console.log('  Default board ready.');

    // Verify
    const enums = await client.query(q(`
      SELECT typname FROM pg_type
      WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = '${schemaName}')
      AND typtype = 'e' ORDER BY typname
    `));
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = '${schemaName}' ORDER BY table_name
    `);
    console.log(`\n  Enums: ${enums.rows.map(r => r.typname).join(', ')}`);
    console.log(`  Tables: ${tables.rows.map(r => r.table_name).join(', ')}`);
    const root = await client.query(q("SELECT id, name FROM gdd.nodes WHERE id = 'gdd-root'"));
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

  try {
    console.log('\nRunning 016-populate-peer-messaging.js...');
    execSync('node 016-populate-peer-messaging.js', { cwd: __dirname, env, stdio: 'inherit' });
  } catch (err) {
    console.error('016-populate-peer-messaging.js failed');
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

  // Phase 4: Create build folder
  const buildPath = path.resolve(__dirname, buildDir);
  if (!fs.existsSync(buildPath)) {
    fs.mkdirSync(buildPath, { recursive: true });
    console.log(`\nCreated build folder: ${buildPath}`);
  } else {
    console.log(`\nBuild folder already exists: ${buildPath}`);
  }

  console.log('\n=== Bootstrap complete ===');
  console.log(`\nDatabase: ${dbName}`);
  console.log(`Schema: ${schemaName}`);
  console.log(`Build folder: ${buildPath}`);
  console.log('\nThe gdd-system graph is populated. All intents carry build_instructions.');
  console.log('Next: point your LLM at the build folder and let it query the graph to begin building.');

  // Reinitialize pool one more time since child processes ended their own pools
  db.reinitPool();
  await db.pool.end();
}

run().catch(err => {
  console.error('\nBootstrap failed:', err.message);
  process.exit(1);
});

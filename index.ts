import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';
import logger from '../server/logger';
const { users } = require('./schema');

// Database connection configuration
const connectionString = process.env.DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!connectionString || !supabaseUrl || !supabaseKey) {
  throw new Error('Missing database configuration');
}

// Log the connection attempt (safely)
logger.info('Attempting to connect to database:', {
  connectionString: connectionString?.replace(/:[^:@]*@/, ':***@')
});

// Create PostgreSQL pool for Drizzle ORM
const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production'
});

// Initialize Drizzle with the pool
const db = drizzle(pool);

// Initialize Supabase client for additional features
const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection
async function testConnection() {
  try {
    // Test Drizzle connection
    const result = await db.select().from(users);
    logger.info('Database connection successful');

    // Check if users table exists and has records
    logger.info('Users table check:', {
      recordCount: result.length,
      sampleUser: result[0] ? {
        id: result[0].id,
        username: result[0].username,
        email: result[0].email
      } : null
    });

    // Test Supabase connection
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) throw error;
    logger.info('Successfully connected to Supabase');

  } catch (error) {
    logger.error('Database connection test failed:', error);
    throw error;
  }
}

testConnection();

module.exports = { db, supabase };

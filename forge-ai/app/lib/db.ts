import postgres from 'postgres';

const globalForDb = global as unknown as { conn: postgres.Sql | undefined };

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables.");
}

export const sql = globalForDb.conn ?? postgres(connectionString, {
  ssl: { rejectUnauthorized: false }, // Required for hosted databases like Supabase
  max: 10, // Max connection pool size
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connect timeout in seconds
});

if (process.env.NODE_ENV !== 'production') globalForDb.conn = sql;

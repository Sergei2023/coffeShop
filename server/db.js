import 'dotenv/config';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'coffeshop',
  password: process.env.DB_PASSWORD,
  port: 5432,  
});

export default pool;
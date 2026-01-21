import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'coffeshop',
  password: '111',
  port: 5432,  
});

export default pool;
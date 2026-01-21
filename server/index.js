const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'coffeshop',
    password: '111',
    port: 5432,
});

app.use(cors());
app.use(express.json());

app.get('/api/menu', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, c.name as category_name, c.slug
            FROM menu_items m
            JOIN categories c ON m.category_id = c.id
            ORDER BY c.id, m.id
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Ошибка БД:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.use(express.static('../client'));

app.use('/images', express.static('../client/public/images'));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:3000`);
});
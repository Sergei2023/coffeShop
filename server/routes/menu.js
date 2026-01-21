const express = require('express');
const pool = require('../db.js');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, c.name as category_name 
            FROM menu_items m
            JOIN categories c ON m.category_id = c.id
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/categories', async (req, res) => {
    const result = await pool.query('SELECT * FROM categories');
    res.json(result.rows);
});

module.exports = router;
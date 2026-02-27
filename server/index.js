import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import cartRoutes from './routes/cart.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Пути
const clientPath = path.join(__dirname, '../client');
const adminPath = path.join(clientPath, 'admin');

console.log('📁 Пути проверены:');
console.log('Админка:', fs.existsSync(adminPath) ? '✅ найдена' : '❌ не найдена');

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));

app.use(express.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('Body:', req.body);
    }
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);

app.get('/api/menu', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, c.name as category_name, c.slug
            FROM menu_items m
            JOIN categories c ON m.category_id = c.id
            WHERE m.is_active = TRUE
            ORDER BY c.id, m.id
        `);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Ошибка БД:', err);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API работает',
        timestamp: new Date().toISOString()
    });
});

app.use(express.static(clientPath));

app.use('/images', express.static(path.join(clientPath, 'public/images')));

app.get('/admin', (req, res) => {
    const adminHtml = path.join(adminPath, 'admin.html');
    if (fs.existsSync(adminHtml)) {
        res.sendFile(adminHtml);
    } else {
        res.status(404).send('Админка не настроена');
    }
});

app.use('/admin', express.static(adminPath, {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

app.post('/api/test-post', (req, res) => {
    console.log('Test POST received:', req.body);
    res.json({ 
        success: true, 
        message: 'POST работает',
        received: req.body
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log(`СЕРВЕР ЗАПУЩЕН: http://localhost:${PORT}`);
    console.log('='.repeat(60));
    console.log('Ключевые маршруты:');
    console.log(`   Главная:     http://localhost:${PORT}/`);
    console.log(`   Админка:     http://localhost:${PORT}/admin`);
    console.log(`   API меню:    http://localhost:${PORT}/api/menu`);
    console.log(`   API логин:   POST http://localhost:${PORT}/api/auth/login`);
    console.log(`   API тест:    GET http://localhost:${PORT}/api/test`);
    console.log(`   API тест POST: POST http://localhost:${PORT}/api/test-post`);
    console.log('='.repeat(60));
});
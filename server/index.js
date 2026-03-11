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

const clientPath = path.join(__dirname, '../client');
const adminPath = path.join(clientPath, 'admin');

console.log('📁 Пути проверены:');
console.log('Админка:', fs.existsSync(adminPath) ? '✅ найдена' : '❌ не найдена');

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://coffeshop.onrender.com',
    'https://sergei2022.github.io'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            console.log('❌ Заблокирован origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });
}

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
app.use('/admin', express.static(adminPath));

app.get('*', (req, res) => {
    if (req.url.startsWith('/api/')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    
    const htmlPath = path.join(clientPath, 'index.html');
    if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
    } else {
        res.status(404).send('File not found');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log(`СЕРВЕР ЗАПУЩЕН НА ПОРТУ: ${PORT}`);
    console.log(`Режим: ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(60));
    console.log('Маршруты API:');
    console.log(`   API меню:    /api/menu`);
    console.log(`   API логин:   POST /api/auth/login`);
    console.log(`   API корзина: /api/cart`);
    console.log('='.repeat(60));
});
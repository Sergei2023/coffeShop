import express from 'express';
import authMiddleware from '../middleware/auth.js';
import adminController from '../controllers/adminController.js';

const router = express.Router();

// ВСЕ маршруты в этом файле требуют авторизации
router.use(authMiddleware);

// ==================== CRUD ДЛЯ ТОВАРОВ ====================
// POST   /api/admin/items      - создать товар (только админ)
// GET    /api/admin/items      - получить все товары (только админ)
// GET    /api/admin/items/:id  - получить один товар (только админ)
// PUT    /api/admin/items/:id  - обновить товар (только админ)
// DELETE /api/admin/items/:id  - удалить товар (только админ)

// ПОИСК должен быть ПЕРЕД /items/:id
router.get('/items/search', authMiddleware.isAdmin, adminController.searchItems);

// Создать товар
router.post('/items', authMiddleware.isAdmin, adminController.createItem);

// Получить все товары (для админки)
router.get('/items', authMiddleware.isAdmin, adminController.getAllItems);

// Получить один товар по ID
router.get('/items/:id', authMiddleware.isAdmin, adminController.getItemById);

// Обновить товар
router.put('/items/:id', authMiddleware.isAdmin, adminController.updateItem);

// Удалить товар (мягкое удаление)
router.delete('/items/:id', authMiddleware.isAdmin, adminController.deleteItem);

// Восстановить товар
router.patch('/items/:id/restore', authMiddleware.isAdmin, adminController.restoreItem);

// ==================== ВСПОМОГАТЕЛЬНЫЕ МАРШРУТЫ ====================
// Получить категории для выпадающего списка
router.get('/categories', adminController.getCategories);

// Получить статистику
router.get('/stats', authMiddleware.isAdmin, adminController.getStats);

export default router;
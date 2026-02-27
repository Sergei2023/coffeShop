import express from 'express';
import authMiddleware from '../middleware/auth.js';
import adminController from '../controllers/adminController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/items/search', authMiddleware.isAdmin, adminController.searchItems);

router.post('/items', authMiddleware.isAdmin, adminController.createItem);

router.get('/items', authMiddleware.isAdmin, adminController.getAllItems);

router.get('/items/:id', authMiddleware.isAdmin, adminController.getItemById);

router.put('/items/:id', authMiddleware.isAdmin, adminController.updateItem);

router.delete('/items/:id', authMiddleware.isAdmin, adminController.deleteItem);

router.patch('/items/:id/restore', authMiddleware.isAdmin, adminController.restoreItem);

router.get('/categories', adminController.getCategories);


router.get('/stats', authMiddleware.isAdmin, adminController.getStats);

export default router;
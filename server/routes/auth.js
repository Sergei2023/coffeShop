import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/register - регистрация нового пользователя
router.post('/register', authController.register);

// POST /api/auth/login - вход в систему
router.post('/login', authController.login);

export default router;
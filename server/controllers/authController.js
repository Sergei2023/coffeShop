import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const authController = {
  // Регистрация нового пользователя
  async register(req, res) {
    try {
      const { email, password } = req.body;

      const userExists = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (userExists.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Пользователь с таким email уже существует'
        });
      }

      const password_hash = await bcrypt.hash(password, 10);

      const newUser = await pool.query(
        `INSERT INTO users (email, password_hash) 
         VALUES ($1, $2) 
         RETURNING id, email, role`,
        [email, password_hash]
      );

      res.status(201).json({
        success: true,
        message: 'Пользователь зарегистрирован',
        user: newUser.rows[0]
      });

    } catch (err) {
      console.error('❌ Ошибка регистрации:', err);
      res.status(500).json({
        success: false,
        error: 'Ошибка сервера при регистрации'
      });
    }
  },

  // Вход в систему
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Неверный email или пароль'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Неверный email или пароль'
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        message: 'Авторизация успешна',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });

    } catch (err) {
      console.error('❌ Ошибка входа:', err);
      res.status(500).json({
        success: false,
        error: 'Ошибка сервера при входе'
      });
    }
  }
};

export default authController;
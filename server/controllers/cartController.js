import pool from '../db.js';

const cartController = {
  // Добавить товар в корзину
  async addToCart(req, res) {
    try {
      const { product_id, quantity = 1 } = req.body;
      const userId = req.user.id;
      
      if (!product_id) {
        return res.status(400).json({
          success: false,
          error: 'Не указан ID товара'
        });
      }
      
      // Проверяем существует ли товар
      const productExists = await pool.query(
        'SELECT id, name, price FROM menu_items WHERE id = $1 AND is_active = true',
        [product_id]
      );
      
      if (productExists.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Товар не найден или не доступен'
        });
      }
      
      // Добавляем или обновляем количество
      const result = await pool.query(
        `INSERT INTO cart_items (user_id, product_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, product_id) 
         DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
         RETURNING *`,
        [userId, product_id, quantity]
      );
      
      res.json({
        success: true,
        message: 'Товар добавлен в корзину',
        cartItem: result.rows[0]
      });
      
    } catch (err) {
      console.error('Ошибка добавления в корзину:', err);
      res.status(500).json({
        success: false,
        error: 'Ошибка при добавлении в корзину'
      });
    }
  },
  
  // Получить корзину пользователя
  async getCart(req, res) {
    try {
      const userId = req.user.id;
      
      const result = await pool.query(`
        SELECT 
          ci.*,
          m.name as product_name,
          m.price as product_price,
          m.image_url,
          (ci.quantity * m.price) as total_price
        FROM cart_items ci
        JOIN menu_items m ON ci.product_id = m.id
        WHERE ci.user_id = $1
        ORDER BY ci.created_at DESC
      `, [userId]);
      
      // Вычисляем общую сумму
      const total = result.rows.reduce((sum, item) => {
        return sum + (parseFloat(item.product_price) * item.quantity);
      }, 0);
      
      res.json({
        success: true,
        data: result.rows,
        total: total.toFixed(2),
        count: result.rows.length
      });
      
    } catch (err) {
      console.error('Ошибка получения корзины:', err);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении корзины'
      });
    }
  },
  
  // Обновить количество товара
  async updateCartItem(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const userId = req.user.id;
      
      // Определяем изменение количества
      let quantityChange;
      if (quantity === 'increase') {
        quantityChange = '+ 1';
      } else if (quantity === 'decrease') {
        quantityChange = '- 1';
      } else {
        return res.status(400).json({
          success: false,
          error: 'Неверный параметр quantity. Используйте "increase" или "decrease"'
        });
      }
      
      // Сначала получаем текущее количество
      const currentItem = await pool.query(
        'SELECT quantity FROM cart_items WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      
      if (currentItem.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Товар не найден в корзине'
        });
      }
      
      const currentQuantity = currentItem.rows[0].quantity;
      
      // Если уменьшаем и количество станет 0 или меньше, удаляем товар
      if (quantity === 'decrease' && currentQuantity <= 1) {
        await pool.query(
          'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
          [id, userId]
        );
        
        return res.json({
          success: true,
          message: 'Товар удален из корзины'
        });
      }
      
      // Обновляем количество
      const result = await pool.query(
        `UPDATE cart_items 
         SET quantity = quantity ${quantityChange}
         WHERE id = $1 AND user_id = $2 
         RETURNING *`,
        [id, userId]
      );
      
      res.json({
        success: true,
        message: 'Количество обновлено',
        cartItem: result.rows[0]
      });
      
    } catch (err) {
      console.error('Ошибка обновления корзины:', err);
      res.status(500).json({
        success: false,
        error: 'Ошибка при обновлении корзины'
      });
    }
  },
  
  // Очистить корзину
  async clearCart(req, res) {
    try {
      const userId = req.user.id;
      
      await pool.query(
        'DELETE FROM cart_items WHERE user_id = $1',
        [userId]
      );
      
      res.json({
        success: true,
        message: 'Корзина очищена'
      });
      
    } catch (err) {
      console.error('Ошибка очистки корзины:', err);
      res.status(500).json({
        success: false,
        error: 'Ошибка при очистке корзины'
      });
    }
  }
};

export default cartController;
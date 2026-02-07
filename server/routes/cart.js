import express from 'express';
import authMiddleware from '../middleware/auth.js';
import pool from '../db.js';

const router = express.Router();

router.use(authMiddleware);

// 1. Добавить товар в корзину
router.post('/add', async (req, res) => {
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
});

// 2. корзина пользователя
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await pool.query(`
            SELECT 
                ci.id,
                ci.user_id,
                ci.product_id,
                ci.quantity,
                ci.created_at,
                m.name as product_name,
                m.price as product_price,
                m.image_url,
                (ci.quantity * m.price) as total_price
            FROM cart_items ci
            JOIN menu_items m ON ci.product_id = m.id
            WHERE ci.user_id = $1
            ORDER BY ci.created_at DESC
        `, [userId]);
        
        // Общая стоимость
        const total = result.rows.reduce((sum, item) => {
            return sum + (parseFloat(item.product_price) * item.quantity);
        }, 0);
        
        res.json({
            success: true,
            data: result.rows,
            total: total.toFixed(2),
            count: result.rows.reduce((sum, item) => sum + item.quantity, 0)
        });
        
    } catch (err) {
        console.error('Ошибка получения корзины:', err);
        res.status(500).json({
            success: false,
            error: 'Ошибка при получении корзины'
        });
    }
});

// 3. Обновить количество товара
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const userId = req.user.id;
        
        if (!quantity) {
            return res.status(400).json({
                success: false,
                error: 'Не указано количество'
            });
        }
        
        // Определяем, что делать с количеством
        if (quantity === 'increase') {
            // Увеличиваем на 1
            const result = await pool.query(
                `UPDATE cart_items 
                 SET quantity = quantity + 1
                 WHERE id = $1 AND user_id = $2 
                 RETURNING *`,
                [id, userId]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Товар не найден в корзине'
                });
            }
            
            res.json({
                success: true,
                message: 'Количество увеличено',
                cartItem: result.rows[0]
            });
            
        } else if (quantity === 'decrease') {
            // Уменьшаем на 1, если станет 0 - удаляем
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
            
            if (currentQuantity <= 1) {
                // Удаляем товар
                await pool.query(
                    'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
                    [id, userId]
                );
                
                return res.json({
                    success: true,
                    message: 'Товар удален из корзины'
                });
            } else {
                // Уменьшаем на 1
                const result = await pool.query(
                    `UPDATE cart_items 
                     SET quantity = quantity - 1
                     WHERE id = $1 AND user_id = $2 
                     RETURNING *`,
                    [id, userId]
                );
                
                res.json({
                    success: true,
                    message: 'Количество уменьшено',
                    cartItem: result.rows[0]
                });
            }
            
        } else if (Number.isInteger(quantity) && quantity > 0) {
            const result = await pool.query(
                `UPDATE cart_items 
                 SET quantity = $1
                 WHERE id = $2 AND user_id = $3 
                 RETURNING *`,
                [quantity, id, userId]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Товар не найден в корзине'
                });
            }
            
            res.json({
                success: true,
                message: 'Количество обновлено',
                cartItem: result.rows[0]
            });
        } else {
            return res.status(400).json({
                success: false,
                error: 'Неверный формат количества'
            });
        }
        
    } catch (err) {
        console.error('Ошибка обновления корзины:', err);
        res.status(500).json({
            success: false,
            error: 'Ошибка при обновлении корзины'
        });
    }
});

// 4. Удалить товар из корзины
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const result = await pool.query(
            `DELETE FROM cart_items 
             WHERE id = $1 AND user_id = $2 
             RETURNING id`,
            [id, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Товар не найден в корзине'
            });
        }
        
        res.json({
            success: true,
            message: 'Товар удален из корзины'
        });
        
    } catch (err) {
        console.error('Ошибка удаления из корзины:', err);
        res.status(500).json({
            success: false,
            error: 'Ошибка при удалении из корзины'
        });
    }
});

// 5. Очистить корзину
router.delete('/', async (req, res) => {
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
});

export default router;
import pool from '../db.js';

const adminController = {
  // Создать новый товар в меню
  async createItem(req, res) {
    try {
      const { category_id, name, description, price, image_url } = req.body;

      if (!category_id || !name || !price) {
        return res.status(400).json({
          success: false,
          error: 'Заполните обязательные поля: category_id, name, price'
        });
      }

      const result = await pool.query(
        `INSERT INTO menu_items 
         (category_id, name, description, price, image_url) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [category_id, name, description, price, image_url]
      );

      res.status(201).json({
        success: true,
        message: 'Товар успешно создан',
        data: result.rows[0]
      });

    } catch (err) {
      console.error('❌ Ошибка создания товара:', err);
      res.status(500).json({
        success: false,
        error: 'Ошибка при создании товара'
      });
    }
  },

  async getAllItems(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          m.*, 
          c.name as category_name,
          CASE 
            WHEN m.is_active = true THEN 'Активен'
            ELSE 'Неактивен'
          END as status
        FROM menu_items m
        LEFT JOIN categories c ON m.category_id = c.id
        ORDER BY m.id DESC
      `);

      res.json({
        success: true,
        count: result.rows.length,
        data: result.rows
      });

    } catch (err) {
      console.error('❌ Ошибка получения товаров:', err);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении товаров'
      });
    }
  },

  async getItemById(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT m.*, c.name as category_name
         FROM menu_items m
         LEFT JOIN categories c ON m.category_id = c.id
         WHERE m.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Товар не найден'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (err) {
      console.error('❌ Ошибка получения товара:', err);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении товара'
      });
    }
  },

  // Обновить товар
  async updateItem(req, res) {
  try {
    console.log('🔄 Обновление товара...');
    const { id } = req.params;
    const { category_id, name, description, price, image_url, is_active } = req.body;

    const itemExists = await pool.query(
      'SELECT id, name FROM menu_items WHERE id = $1',
      [id]
    );

    if (itemExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Товар не найден'
      });
    }

    console.log(`📦 Товар найден: ${itemExists.rows[0].name}`);

    const priceValue = price !== undefined ? parseFloat(price) : undefined;
    
    const categoryIdValue = category_id !== undefined ? parseInt(category_id) : undefined;
    
    let isActiveValue = undefined;
    if (is_active !== undefined) {
      isActiveValue = is_active === true || is_active === 'true' || is_active === 1;
    }

    const result = await pool.query(
      `UPDATE menu_items 
       SET 
         category_id = COALESCE($1, category_id),
         name = COALESCE($2, name),
         description = COALESCE($3, description),
         price = COALESCE($4, price),
         image_url = COALESCE($5, image_url),
         is_active = COALESCE($6, is_active),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        categoryIdValue,  // $1
        name,             // $2
        description,      // $3
        priceValue,       // $4
        image_url,        // $5
        isActiveValue,    // $6
        id                // $7
      ]
    );

    console.log('✅ Товар обновлён:', result.rows[0]);

    res.json({
      success: true,
      message: 'Товар успешно обновлён',
      data: result.rows[0]
    });

  } catch (err) {
    console.error('❌ Ошибка обновления товара:', err.message);
    console.error('📋 Детали ошибки:', err);
    
    let userMessage = 'Ошибка при обновлении товара';
    if (err.code === '23503') {
      userMessage = 'Ошибка: указана несуществующая категория (category_id)';
    } else if (err.code === '22P02') {
      userMessage = 'Ошибка формата данных (проверьте типы полей)';
    }

    res.status(500).json({
      success: false,
      error: userMessage,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
},

  // удаление
  async deleteItem(req, res) {
    try {
      const { id } = req.params;

      const itemExists = await pool.query(
        'SELECT id, name FROM menu_items WHERE id = $1',
        [id]
      );

      if (itemExists.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Товар не найден'
        });
      }

      await pool.query(
        'UPDATE menu_items SET is_active = false WHERE id = $1',
        [id]
      );

      res.json({
        success: true,
        message: `Товар "${itemExists.rows[0].name}" перемещён в архив (неактивен)`
      });

    } catch (err) {
      console.error('❌ Ошибка удаления товара:', err);
      res.status(500).json({
        success: false,
        error: 'Ошибка при удалении товара'
      });
    }
  },

  // Получить все категории
  async getCategories(req, res) {
    try {
      const result = await pool.query(
        'SELECT id, name FROM categories ORDER BY id'
      );

      res.json({
        success: true,
        data: result.rows
      });

    } catch (err) {
      console.error('❌ Ошибка получения категорий:', err);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении категорий'
      });
    }
  },

  //количество товаров по категориям
  async getStats(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          c.name as category,
          COUNT(m.id) as total_items,
          SUM(CASE WHEN m.is_active THEN 1 ELSE 0 END) as active_items
        FROM categories c
        LEFT JOIN menu_items m ON c.id = m.category_id
        GROUP BY c.id, c.name
        ORDER BY c.id
      `);

      res.json({
        success: true,
        data: result.rows
      });

    } catch (err) {
      console.error('❌ Ошибка получения статистики:', err);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении статистики'
      });
    }
  },

async searchItems(req, res) {
  try {
    console.log('🔍 [СЕРВЕР] Начало поиска');
    console.log('📝 Параметры запроса:', req.query);
    console.log('🔑 Пользователь:', req.user);
    
    const { q } = req.query;
    const searchTerm = (q || '').trim();
    
    console.log(`🔍 [СЕРВЕР] Ищем: "${searchTerm}"`);
    
    if (!searchTerm) {
      console.log('⚠️ [СЕРВЕР] Пустой запрос');
      return res.json({
        success: true,
        count: 0,
        query: searchTerm,
        data: []
      });
    }

    const result = await pool.query(`
      SELECT 
        m.id,
        m.name,
        m.description,
        m.price,
        m.image_url,
        m.is_active,
        m.category_id,
        m.created_at,
        m.updated_at,
        c.name as category_name
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.name ILIKE $1
      ORDER BY m.id DESC
    `, [`%${searchTerm}%`]);

    console.log(`✅ [СЕРВЕР] Найдено: ${result.rows.length} товаров`);
    
    result.rows.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.name} - ${item.price} ₽`);
    });
    
    res.json({
      success: true,
      count: result.rows.length,
      query: searchTerm,
      data: result.rows
    });

  } catch (err) {
    console.error('❌ [СЕРВЕР] КРИТИЧЕСКАЯ ОШИБКА поиска:');
    console.error('Сообщение:', err.message);
    console.error('Код ошибки:', err.code);
    console.error('Стек ошибки:', err.stack);
    
    if (err.code === '42703' || err.message.includes('column')) {
      console.log('🔄 Пробуем упрощенный запрос без JOIN...');
      
      try {
        const simpleResult = await pool.query(`
          SELECT 
            id,
            name,
            description,
            price,
            image_url,
            is_active,
            category_id,
            created_at,
            updated_at
          FROM menu_items
          WHERE name ILIKE $1
          ORDER BY id DESC
        `, [`%${searchTerm}%`]);
        
        console.log(`✅ [СЕРВЕР] Упрощенный поиск: ${simpleResult.rows.length} товаров`);
        
        return res.json({
          success: true,
          count: simpleResult.rows.length,
          query: searchTerm,
          data: simpleResult.rows
        });
      } catch (simpleErr) {
        console.error('❌ Ошибка упрощенного запроса:', simpleErr.message);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Ошибка при поиске товаров',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
},

// Восстановить товар
async restoreItem(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE menu_items 
       SET is_active = true 
       WHERE id = $1 
       RETURNING id, name, is_active`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Товар не найден'
      });
    }

    res.json({
      success: true,
      message: `Товар "${result.rows[0].name}" восстановлен`,
      data: result.rows[0]
    });

  } catch (err) {
    console.error('❌ Ошибка восстановления:', err);
    res.status(500).json({
      success: false,
      error: 'Ошибка при восстановлении товара'
    });
  }
},
}

export default adminController;
import './styles/style.css';
import './styles/menu.css';

async function loadMenuFromAPI() {
    try {
        const response = await fetch('/api/menu');
        if (!response.ok) throw new Error('Ошибка сети');
        const data = await response.json();
        
        console.log('Структура данных:', data);
        
        if (data && data.menu && Array.isArray(data.menu)) {
            console.log('Данные получены:', data.menu.length, 'товаров');
            return data.menu;
        } else if (data && data.data && Array.isArray(data.data)) {
            console.log('Данные получены:', data.data.length, 'товаров');
            return data.data;
        } else if (data && data.items && Array.isArray(data.items)) {
            console.log('Данные получены:', data.items.length, 'товаров');
            return data.items;
        } else if (Array.isArray(data)) {
            console.log('Данные получены:', data.length, 'товаров');
            return data;
        }
        
        console.warn('Неожиданный формат данных:', data);
        return [];
        
    } catch (error) {
        console.error('Не удалось загрузить меню:', error);
        return [];
    }
}

function renderMenu(items) {
    const container = document.getElementById('menu-container');
    
    if (!items || !Array.isArray(items) || items.length === 0) {
        container.innerHTML = '<p class="empty-message">Меню временно недоступно</p>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="menu-card" data-category="${item.slug}">
            <img src="${item.image_url}" alt="${item.name}" class="menu-card__image">
            <div class="menu-card__content">
                <h3 class="menu-card__title">${item.name}</h3>
                <p class="menu-card__desc">${item.description}</p>
                <div class="menu-card__footer">
                    <div class="menu-card__price">${item.price} ₽</div>
                    <button class="menu-card__btn" data-product-id="${item.id}">В корзину</button>
                </div>
            </div>
        </div>
    `).join('');

    // Добавляем обработчики на кнопки
    document.querySelectorAll('.menu-card__btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const productId = e.target.dataset.productId;
            
            const token = localStorage.getItem('authToken');
            const user = JSON.parse(localStorage.getItem('authUser') || 'null');
            
            if (!token || !user) {
                const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
                window.location.href = `/login.html?returnUrl=${returnUrl}`;
                return;
            }
            
            try {
                const response = await fetch('/api/cart/add', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Origin': 'http://localhost:5174'
                    },
                    body: JSON.stringify({
                        product_id: productId,
                        quantity: 1
                    })
                });
                
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('authUser');
                    window.location.href = '/login.html';
                    return;
                }
                
                if (response.ok) {
                    // Обновляем счетчик корзины
                    if (window.updateCartCount) {
                        window.updateCartCount();
                    } else {
                        // Альтернативный способ обновления счетчика
                        const cartCountElement = document.getElementById('cartCount');
                        if (cartCountElement) {
                            const currentCount = parseInt(cartCountElement.textContent) || 0;
                            cartCountElement.textContent = currentCount + 1;
                        }
                    }
                    
                    e.target.textContent = 'Добавлено';
                    e.target.style.backgroundColor = '#4CAF50';
                    
                    setTimeout(() => {
                        e.target.textContent = 'В корзину';
                        e.target.style.backgroundColor = '';
                    }, 1000);
                    
                } else {
                    const errorData = await response.json();
                    console.error('Ошибка добавления:', errorData);
                    
                    e.target.textContent = '✗ Ошибка';
                    e.target.style.backgroundColor = '#f44336';
                    
                    setTimeout(() => {
                        e.target.textContent = 'В корзину';
                        e.target.style.backgroundColor = '';
                    }, 2000);
                }
            } catch (error) {
                console.error('Ошибка добавления в корзину:', error);
                
                e.target.textContent = '✗ Ошибка';
                e.target.style.backgroundColor = '#f44336';
                
                setTimeout(() => {
                    e.target.textContent = 'В корзину';
                    e.target.style.backgroundColor = '';
                }, 2000);
            }
        });
    });
}

function setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            const allCards = document.querySelectorAll('.menu-card');
            
            allCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Страница меню загружается...');
    
    const menuItems = await loadMenuFromAPI();
    renderMenu(menuItems);
    setupFilters();
    
    console.log('Меню загружено!');
});
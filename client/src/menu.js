import './styles/style.css';
import './styles/menu.css';

async function loadMenuFromAPI() {
    try {
        const response = await fetch('http://localhost:3000/api/menu');
        if (!response.ok) throw new Error('Ошибка сети');
        const data = await response.json();
        
        // Логирование для отладки
        console.log('Структура данных:', data);
        
        // Проверяем разные возможные форматы ответа
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
    
    // Проверка на null/undefined
    if (!items) {
        container.innerHTML = '<p class="empty-message">Данные не получены</p>';
        return;
    }
    
    // Проверка, что items - массив
    if (!Array.isArray(items)) {
        console.error('items не является массивом:', items);
        container.innerHTML = '<p class="empty-message">Неверный формат данных</p>';
        return;
    }
    
    if (items.length === 0) {
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
                    <button class="menu-card__btn" onclick="cart.addToCart(${item.id})">В корзину</button>
                </div>
            </div>
        </div>
    `).join('');
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
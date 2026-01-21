import './styles/style.css';
import './styles/menu.css';

async function loadMenuFromAPI() {
    try {
        const response = await fetch('http://localhost:3000/api/menu');
        if (!response.ok) throw new Error('Ошибка сети');
        const data = await response.json();
        console.log('Данные получены:', data.length, 'товаров');
        return data;
    } catch (error) {
        console.error('Не удалось загрузить меню:', error);
        return [];
    }
}

function renderMenu(items) {
    const container = document.getElementById('menu-container');
    //if (!container) {
    //    console.error('#menu-container не найден');
    //    return;
    //}
    // это я сделал если вдруг забуду запустить сервер (а то уже много раз попадался)
    // ну и прикольно наверное
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
                    <button class="menu-card__btn" data-id="${item.id}">В корзину</button>
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
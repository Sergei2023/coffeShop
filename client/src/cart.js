// cart.js - логика работы корзины
const API_BASE = 'http://localhost:3000';

function updateCartCount(count = null) {
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        if (count !== null) {
            cartCountElement.textContent = count;
            cartCountElement.style.display = count > 0 ? 'inline' : 'none';
        }
    }
    
    if (window.auth && window.auth.updateCartCounter) {
        window.auth.updateCartCounter();
    }
}

// ФУНКЦИЯ РЕНДЕРА КОРЗИНЫ
function renderCart(items) {
    const cartItemsContainer = document.getElementById('cartItems');
    if (!cartItemsContainer) return;
    
    cartItemsContainer.innerHTML = '';
    
    if (!items || items.length === 0) {
        document.getElementById('emptyCart').style.display = 'block';
        document.getElementById('authCart').style.display = 'none';
        return;
    }
    
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        
        // Форматируем цену и общую сумму
        const price = parseFloat(item.product_price) || 0;
        const quantity = item.quantity || 1;
        const totalPrice = price * quantity;
        
        itemElement.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.image_url || '/images/placeholder.jpg'}" 
                     alt="${item.product_name}" 
                     class="cart-item__image">
            </div>
            <div class="cart-item__info">
                <h3 class="cart-item__name">${item.product_name}</h3>
                <p class="cart-item__price">Цена: ${price.toFixed(2)} ₽</p>
                <div class="cart-item__controls">
                    <div class="quantity-control">
                        <button class="quantity-btn minus" data-id="${item.id}">-</button>
                        <span class="quantity-value">${quantity}</span>
                        <button class="quantity-btn plus" data-id="${item.id}">+</button>
                    </div>
                    <button class="remove-btn" data-id="${item.id}">Удалить</button>
                </div>
            </div>
            <div class="cart-item__total">${totalPrice.toFixed(2)} ₽</div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });
    
    // Добавляем обработчики событий
    document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
        btn.addEventListener('click', () => updateQuantity(btn.dataset.id, -1));
    });
    
    document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
        btn.addEventListener('click', () => updateQuantity(btn.dataset.id, 1));
    });
    
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
    });
}

// ФУНКЦИЯ ОБНОВЛЕНИЯ ИТОГОВ
function updateSummary(total, count) {
    const totalItemsElement = document.getElementById('totalItems');
    const cartTotalElement = document.getElementById('cartTotal');
    
    if (totalItemsElement) {
        const countNum = parseInt(count) || 0;
        totalItemsElement.textContent = countNum;
    }
    
    if (cartTotalElement) {
        const totalNum = parseFloat(total) || 0;
        cartTotalElement.textContent = `${totalNum.toFixed(2)} ₽`;
    }
}

// ФУНКЦИЯ ОБНОВЛЕНИЯ КОЛИЧЕСТВА
async function updateQuantity(itemId, change) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/api/cart/${itemId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:5174'
            },
            body: JSON.stringify({
                quantity: change > 0 ? 'increase' : 'decrease'
            })
        });
        
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            window.location.href = '/coffeShop/login.html';
            return;
        }
        
        if (response.ok) {
            loadCart();
        } else {
            const errorData = await response.json();
            alert(`Ошибка: ${errorData.error || 'Неизвестная ошибка'}`);
        }
    } catch (error) {
        console.error('Ошибка обновления количества:', error);
        alert('Ошибка соединения с сервером');
    }
}

// ФУНКЦИЯ УДАЛЕНИЯ ТОВАРА
async function removeFromCart(itemId) {
    if (!confirm('Удалить товар из корзины?')) return;
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/api/cart/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Origin': 'http://localhost:5174'
            }
        });
        
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            window.location.href = '/coffeShop/login.html';
            return;
        }
        
        if (response.ok) {
            loadCart();
            alert('Товар удален из корзины');
        } else {
            const errorData = await response.json();
            alert(`Ошибка: ${errorData.error || 'Неизвестная ошибка'}`);
        }
    } catch (error) {
        console.error('Ошибка удаления товара:', error);
        alert('Ошибка соединения с сервером');
    }
}

// ФУНКЦИЯ ОЧИСТКИ КОРЗИНЫ
async function clearCart() {
    if (!confirm('Очистить всю корзину?')) return;
    
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/api/cart`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Origin': 'http://localhost:5174'
            }
        });
        
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            window.location.href = '/coffeShop/login.html';
            return;
        }
        
        if (response.ok) {
            loadCart();
            alert('Корзина очищена');
        } else {
            const errorData = await response.json();
            alert(`Ошибка: ${errorData.error || 'Неизвестная ошибка'}`);
        }
    } catch (error) {
        console.error('Ошибка очистки корзины:', error);
        alert('Ошибка соединения с сервером');
    }
}

// ФУНКЦИЯ ОФОРМЛЕНИЯ ЗАКАЗА
async function checkout() {
    alert('Функция оформления заказа пока в разработке');
    return;
    
    // Код который я пытался сделать, но у меня что то не пошло совскм:
    /*
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/api/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Origin': 'http://localhost:5174'
            }
        });
        
        if (response.ok) {
            alert('Заказ успешно оформлен!');
            loadCart();
        }
    } catch (error) {
        console.error('Ошибка оформления заказа:', error);
    }
    */
}

document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию ТОЛЬКО если мы на странице корзины
    const guestCart = document.getElementById('guestCart');
    const authCart = document.getElementById('authCart');
    const emptyCart = document.getElementById('emptyCart');
    
    // Если этих элементов нет - мы не на странице cart.html
    if (!guestCart || !authCart || !emptyCart) {
        console.log('Не на странице корзины, пропускаем инициализацию');
        return;
    }
    
    // ПРОВЕРЯЕМ ВАЛИДНОСТЬ ТОКЕНА ПРИ ЗАГРУЗКЕ
    checkAuthAndLoadCart();
    
    // Обработчики кнопок
    const clearCartBtn = document.getElementById('clearCartBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);
    if (checkoutBtn) checkoutBtn.addEventListener('click', checkout);
    
    updateCartCount();
});

// НОВАЯ ФУНКЦИЯ: Проверка авторизации и загрузка корзины
async function checkAuthAndLoadCart() {
    const guestCart = document.getElementById('guestCart');
    const authCart = document.getElementById('authCart');
    
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('authUser') || 'null');
    
    if (!token || !user) {
        // Неавторизованный
        guestCart.style.display = 'block';
        authCart.style.display = 'none';
        document.getElementById('emptyCart').style.display = 'none';
        return;
    }
    
    // Проверяем валидность токена
    try {
        const response = await fetch(`${API_BASE}/api/cart`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Origin': 'http://localhost:5174'
            }
        });
        
        if (response.ok) {
            guestCart.style.display = 'none';
            authCart.style.display = 'block';
            loadCart();

        } else if (response.status === 401 || response.status === 403) {
            console.log('Токен невалиден, удаляем из localStorage');
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            
            const currentPath = window.location.pathname + window.location.search;
            localStorage.setItem('returnUrl', currentPath);
            
            guestCart.style.display = 'block';
            authCart.style.display = 'none';
            document.getElementById('emptyCart').style.display = 'none';
            
            const messageElement = guestCart.querySelector('p');
            if (messageElement) {
                messageElement.textContent = 'Сессия истекла. Пожалуйста, войдите заново.';
            }
        }
    } catch (error) {
        console.error('Ошибка проверки токена:', error);
        // При ошибке сети показываем гостевой экран
        guestCart.style.display = 'block';
        authCart.style.display = 'none';
    }
}

// Загрузить корзину
async function loadCart() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE}/api/cart`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Origin': 'http://localhost:5174'
            }
        });
        
        // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            
            const currentPath = window.location.pathname + window.location.search;
            localStorage.setItem('returnUrl', currentPath);
            
            window.location.reload();
            return;
        }
        
        const data = await response.json();
        console.log('Данные корзины:', data);
        
        if (response.ok && data.success) {
            renderCart(data.data);
            updateSummary(data.total, data.count);
            updateCartCount(data.count);
            
            if (data.count === 0) {
                document.getElementById('emptyCart').style.display = 'block';
                document.getElementById('authCart').style.display = 'none';
            } else {
                document.getElementById('emptyCart').style.display = 'none';
                document.getElementById('authCart').style.display = 'block';
            }
        } else {
            console.error('Ошибка в данных корзины:', data);
        }
        
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
    }
}

//  функция addToCart
window.cart = {
    addToCart: async function(productId, quantity = 1) {
        let token = localStorage.getItem('authToken');
        const user = JSON.parse(localStorage.getItem('authUser') || 'null');
        
        console.log('🔐 Проверка авторизации:');
        console.log('- Токен есть?:', !!token);
        console.log('- Пользователь:', user);
        
        if (!token || !user) {
            // ✅ Сохраняем ТЕКУЩИЙ URL для возврата
            const currentPath = window.location.pathname;
            const returnUrl = encodeURIComponent(currentPath);
            console.log('Перенаправление на логин с returnTo:', currentPath);
            window.location.href = `/coffeShop/login.html?returnTo=${returnUrl}`;
            return false;
        }
        
        try {
            const response = await fetch(`${API_BASE}/api/cart/add`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Origin': 'http://localhost:5174'
                },
                body: JSON.stringify({ 
                    product_id: productId, 
                    quantity: quantity 
                })
            });
            
            console.log('Ответ сервера:', response.status);
            
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('authUser');
                
                const currentPath = window.location.pathname;
                localStorage.setItem('returnUrl', currentPath);
                
                alert('Сессия истекла. Пожалуйста, войдите заново.');
                window.location.href = '/coffeShop/login.html';
                return false;
            }
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                alert('✅ Товар добавлен в корзину!');
                updateCartCount();
                return true;
            } else {
                alert(`❌ Ошибка: ${data.error || 'Неизвестная ошибка'}`);
                return false;
            }
            
        } catch (error) {
            console.error('❌ Ошибка сети:', error);
            alert('Ошибка соединения с сервером');
            return false;
        }
    }
};
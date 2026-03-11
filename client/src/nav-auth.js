document.addEventListener('DOMContentLoaded', function() {
    updateAuthButtons();
    
    document.addEventListener('click', function(e) {
        if (e.target.id === 'logoutBtn' || e.target.classList.contains('auth-button--logout')) {
            e.preventDefault();
            logout();
        }
    });
});

function updateAuthButtons() {
    const authButtonsContainer = document.getElementById('authButtons');
    if (!authButtonsContainer) return;
    
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('authUser') || 'null');
    
    authButtonsContainer.innerHTML = '';
    
    if (token && user) {
        const userInfo = document.createElement('div');
        userInfo.className = 'auth-user';
        
        userInfo.innerHTML = `
            <span class="auth-user__email" title="${user.email}">
                👤 ${user.email}
            </span>
        `;
        
        if (user.role === 'admin') {
            userInfo.innerHTML += `
                <span class="auth-user__badge">Админ</span>
            `;
        }
        
        authButtonsContainer.appendChild(userInfo);
        
        if (user.role === 'admin') {
            const adminBtn = document.createElement('a');
            adminBtn.href = '/coffeShop/admin/admin.html';
            adminBtn.className = 'auth-button auth-button--admin';
            adminBtn.textContent = 'АРМ администратора';
            authButtonsContainer.appendChild(adminBtn);
        }
        
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'auth-button auth-button--logout';
        logoutBtn.textContent = 'Выйти';
        logoutBtn.id = 'logoutBtn';
        authButtonsContainer.appendChild(logoutBtn);
        
    } else {
        const loginBtn = document.createElement('a');
        loginBtn.href = 'login.html';
        loginBtn.className = 'auth-button auth-button--login';
        loginBtn.textContent = 'Войти';
        authButtonsContainer.appendChild(loginBtn);
    }
}

// Выход из системы
function logout() {
    if (confirm('Вы действительно хотите выйти?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');

        showToast('Вы успешно вышли из системы');
        
        setTimeout(() => {
            updateAuthButtons();
            window.location.href = '/';
        }, 1000);
    }
}

function showToast(message, type = 'success') {
    const oldToast = document.getElementById('authToast');
    if (oldToast) oldToast.remove();
    
    const toast = document.createElement('div');
    toast.id = 'authToast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#2e7d32' : '#d32f2f'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
}

function requireAuth(redirectTo = 'login.html') {
    const token = localStorage.getItem('authToken');
    if (!token) {
        localStorage.setItem('returnUrl', window.location.href);
        window.location.href = redirectTo;
        return false;
    }
    return true;
}

function requireAdmin(redirectTo = '/') {
    const user = JSON.parse(localStorage.getItem('authUser') || 'null');
    if (!user || user.role !== 'admin') {
        showToast('Требуются права администратора', 'error');
        setTimeout(() => {
            window.location.href = redirectTo;
        }, 1500);
        return false;
    }
    return true;
}

function getAuthToken() {
    return localStorage.getItem('authToken');
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('authUser') || 'null');
}

async function updateCartCounter() {
    const cartCountElement = document.getElementById('cartCount');
    if (!cartCountElement) return;
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        cartCountElement.textContent = '0';
        return;
    }
    
    try {
        const response = await fetch('/api/cart', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            const count = data.count || 0;
            cartCountElement.textContent = count;
            cartCountElement.style.display = count > 0 ? 'inline' : 'none';
        }
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
    }
}

function logout() {
    if (confirm('Вы действительно хотите выйти?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        updateAuthButtons();
        updateCartCounter();
        window.location.href = '/';
    }
}



window.auth = {
    updateAuthButtons,
    logout,
    requireAuth,
    requireAdmin,
    getAuthToken,
    getCurrentUser,
    updateCartCounter,
    isLoggedIn: () => !!localStorage.getItem('authToken'),
    isAdmin: () => {
        const user = getCurrentUser();
        return user && user.role === 'admin';
    }
};
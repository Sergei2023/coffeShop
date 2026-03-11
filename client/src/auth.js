const API_BASE = '';

document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            forms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${tabName}FormContainer`) {
                    form.classList.add('active');
                }
            });
        });
    });
    
    const loginForm = document.getElementById('loginForm');
    const loginMessage = document.getElementById('loginMessage');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Origin': 'http://localhost:5174'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('authUser', JSON.stringify(data.user));
                
                showMessage(loginMessage, '✅ Вход успешен!', 'success');
                
                const urlParams = new URLSearchParams(window.location.search);
                const returnToParam = urlParams.get('returnTo');
                const savedReturnUrl = localStorage.getItem('returnUrl');
                
                let returnTo = '/';
                if (returnToParam) {
                    returnTo = decodeURIComponent(returnToParam);
                } else if (savedReturnUrl) {
                    returnTo = savedReturnUrl;
                }
                
                localStorage.removeItem('returnUrl');
                
                console.log('Перенаправление после логина на:', returnTo);
                
                setTimeout(() => {
                    if (window.auth && window.auth.updateAuthButtons) {
                        window.auth.updateAuthButtons();
                    }
                    
                    window.location.href = returnTo;
                }, 1000);
                
            } else {
                showMessage(loginMessage, `❌ ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            showMessage(loginMessage, '❌ Ошибка сети или CORS', 'error');
        }
    });
    
    const registerForm = document.getElementById('registerForm');
    const registerMessage = document.getElementById('registerMessage');
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirm').value;
        
        if (password !== confirmPassword) {
            showMessage(registerMessage, '❌ Пароли не совпадают', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage(registerMessage, '❌ Пароль должен быть не менее 6 символов', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE}/api/auth/register`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Origin': 'http://localhost:5174'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('authUser', JSON.stringify(data.user));
                
                showMessage(registerMessage, '✅ Регистрация успешна! Входим...', 'success');
                
                const urlParams = new URLSearchParams(window.location.search);
                const returnToParam = urlParams.get('returnTo');
                const savedReturnUrl = localStorage.getItem('returnUrl');
                
                let returnTo = '/';
                if (returnToParam) {
                    returnTo = decodeURIComponent(returnToParam);
                } else if (savedReturnUrl) {
                    returnTo = savedReturnUrl;
                }
                
                localStorage.removeItem('returnUrl');
                
                setTimeout(() => {
                    if (window.auth && window.auth.updateAuthButtons) {
                        window.auth.updateAuthButtons();
                    }
                    
                    window.location.href = returnTo;
                }, 1500);
                
            } else {
                showMessage(registerMessage, `❌ ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            showMessage(registerMessage, '❌ Ошибка сети или CORS', 'error');
        }
    });
    
    function showMessage(element, text, type) {
        element.textContent = text;
        element.className = 'auth-message';
        element.classList.add(type);
        element.style.display = 'block';
    }
});
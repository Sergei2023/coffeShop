const API_BASE = 'http://localhost:3000/api';
let currentToken = localStorage.getItem('adminToken');
let currentUser = JSON.parse(localStorage.getItem('adminUser') || 'null');
let allItems = [];
let categories = [];
let tokenCheckInterval;
let selectedCategories = [];
let currentFilter = 'all';

const authSection = document.getElementById('authSection');
const adminPanel = document.getElementById('adminPanel');
const loginForm = document.getElementById('loginForm');
const authMessage = document.getElementById('authMessage');
const logoutBtn = document.getElementById('logoutBtn');
const addItemBtn = document.getElementById('addItemBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const itemsTableBody = document.getElementById('itemsTableBody');
const itemModal = document.getElementById('itemModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const itemForm = document.getElementById('itemForm');
const modalTitle = document.getElementById('modalTitle');
const modalCategory = document.getElementById('modalCategory');
const statsElements = {
  totalItems: document.getElementById('totalItems'),
  activeItems: document.getElementById('activeItems'),
  inactiveItems: document.getElementById('inactiveItems'),
  totalCategories: document.getElementById('totalCategories')
};

async function login(email, password) {
  try {
    showMessage('Проверяем данные...', 'info');
    
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Ошибка авторизации');
    }
    
    currentToken = data.token;
    currentUser = data.user;
    localStorage.setItem('adminToken', currentToken);
    localStorage.setItem('adminUser', JSON.stringify(currentUser));
    
    showMessage('✅ Авторизация успешна!', 'success');
    setTimeout(() => {
      switchToAdminPanel();
    }, 1000);
    
    return data;
  } catch (error) {
    showMessage(`❌ ${error.message}`, 'error');
    throw error;
  }
}

function logout() {
  if (confirm('Вы действительно хотите выйти?')) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    currentToken = null;
    currentUser = null;
    switchToAuthPanel();
  }
}

async function loadItems() {
  try {
    console.log('📦 Начинаем загрузку товаров...');
    
    if (!currentToken) {
      console.log('❌ Нет токена, выходим...');
      return [];
    }
    
    showTableLoading();
    
    const response = await fetch(`${API_BASE}/admin/items`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    
    console.log('📥 Статус ответа:', response.status);
    
    if (response.status === 401 || response.status === 403) {
      console.log('❌ Ошибка авторизации (401/403)');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      switchToAuthPanel();
      return [];
    }
    
    if (!response.ok) {
      throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    allItems = data.data || [];
    
    applyFilters();
    updateStats();
    
    return allItems;
  } catch (error) {
    console.error('❌ Ошибка загрузки товаров:', error);
    showTableError('Ошибка загрузки товаров');
    return [];
  }
}

async function loadCategories() {
  try {
    console.log('📂 Начинаем загрузку категорий...');
    
    if (!currentToken) {
      console.log('❌ Нет токена, выходим...');
      return [];
    }
    
    const response = await fetch(`${API_BASE}/admin/categories`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    
    console.log('📥 Статус ответа категорий:', response.status);
    
    if (response.status === 401 || response.status === 403) {
      console.log('❌ Ошибка авторизации (401/403)');
      return [];
    }
    
    if (!response.ok) {
      throw new Error('Ошибка загрузки категорий');
    }
    
    const data = await response.json();
    categories = data.data || [];
    
    console.log(`✅ Загружено категорий: ${categories.length}`);
    
    modalCategory.innerHTML = '<option value="">Выберите категорию...</option>';
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      modalCategory.appendChild(option);
    });
    
    if (selectedCategories.length === 0 && categories.length > 0) {
      selectedCategories = categories.map(cat => cat.id);
      updateCategoriesValue();
      console.log('✅ Выбраны все категории по умолчанию:', selectedCategories);
    }

    populateCategoriesFilter();
    
    return categories;
  } catch (error) {
    console.error('Ошибка загрузки категорий:', error);
    return [];
  }
}

function populateCategoriesFilter() {
  const categoriesCheckboxes = document.getElementById('categoriesCheckboxes');
  if (!categoriesCheckboxes) return;
  
  categoriesCheckboxes.innerHTML = categories.map(cat => `
    <div class="dropdown-checkbox">
      <input type="checkbox" 
             id="filter-cat-${cat.id}" 
             value="${cat.id}"
             ${selectedCategories.includes(cat.id) ? 'checked' : ''}>
      <label for="filter-cat-${cat.id}">${cat.name}</label>
    </div>
  `).join('');
  
  const checkboxes = categoriesCheckboxes.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const categoryId = parseInt(checkbox.value);
      if (checkbox.checked) {
        if (!selectedCategories.includes(categoryId)) {
          selectedCategories.push(categoryId);
        }
      } else {
        selectedCategories = selectedCategories.filter(id => id !== categoryId);
      }
      
      updateCategoriesValue();
      applyFilters();
    });
  });
}

function updateCategoriesValue() {
  const categoriesValue = document.getElementById('categoriesValue');
  if (!categoriesValue) return;
  
  if (selectedCategories.length === 0) {
    categoriesValue.textContent = 'Не выбрано';
  } else if (selectedCategories.length === categories.length) {
    categoriesValue.textContent = 'Все';
  } else {
    categoriesValue.textContent = `${selectedCategories.length} выбрано`;
  }
}

function updateStatusValue() {
  const statusValue = document.getElementById('statusValue');
  if (!statusValue) return;
  
  switch(currentFilter) {
    case 'all':
      statusValue.textContent = 'Все';
      break;
    case 'active':
      statusValue.textContent = 'Активные';
      break;
    case 'inactive':
      statusValue.textContent = 'Архив';
      break;
    default:
      statusValue.textContent = 'Все';
  }
}

// Создание товара
async function createItem(itemData) {
  try {
    const response = await fetch(`${API_BASE}/admin/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify(itemData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Ошибка создания товара');
    }
    
    return data;
  } catch (error) {
    console.error('Ошибка создания товара:', error);
    throw error;
  }
}

// Обновление товара
async function updateItem(id, itemData) {
  try {
    const response = await fetch(`${API_BASE}/admin/items/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      },
      body: JSON.stringify(itemData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `Ошибка ${response.status}: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Ошибка обновления товара:', error.message);
    throw error;
  }
}

// Удаление товара
async function deleteItem(id) {
  try {
    const response = await fetch(`${API_BASE}/admin/items/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Ошибка удаления товара');
    }
    
    return data;
  } catch (error) {
    console.error('Ошибка удаления товара:', error);
    throw error;
  }
}

// Восстановление товара
async function restoreItem(id) {
  try {
    const response = await fetch(`${API_BASE}/admin/items/${id}/restore`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Ошибка восстановления товара');
    }
    
    return data;
  } catch (error) {
    console.error('Ошибка восстановления товара:', error);
    throw error;
  }
}


function applyFilters() {
  console.log('🔍 Применяем фильтры...');
  
  if (!allItems || allItems.length === 0) {
    console.log('⚠️ Нет товаров для фильтрации');
    renderItemsTable([]);
    return;
  }
  
  const priceFromInput = document.getElementById('priceFrom');
  const priceToInput = document.getElementById('priceTo');
  
  let localPriceFrom = priceFromInput?.value ? parseFloat(priceFromInput.value) : null;
  let localPriceTo = priceToInput?.value ? parseFloat(priceToInput.value) : null;
  
  if (localPriceFrom !== null && isNaN(localPriceFrom)) localPriceFrom = null;
  if (localPriceTo !== null && isNaN(localPriceTo)) localPriceTo = null;
  
  if (localPriceFrom !== null && localPriceTo !== null && localPriceFrom > localPriceTo) {
    localPriceFrom = null;
    localPriceTo = null;
    priceFromInput.value = '';
    priceToInput.value = '';
  }
  
  console.log('Фильтр:', currentFilter);
  console.log('Категории:', selectedCategories);
  console.log('Цена от:', localPriceFrom);
  console.log('Цена до:', localPriceTo);
  
  let filteredItems = [...allItems];
  
  if (currentFilter === 'active') {
    filteredItems = filteredItems.filter(item => item.is_active);
    console.log('После фильтра активных:', filteredItems.length);
  } else if (currentFilter === 'inactive') {
    filteredItems = filteredItems.filter(item => !item.is_active);
    console.log('После фильтра неактивных:', filteredItems.length);
  }
  
  if (selectedCategories.length > 0) {
    filteredItems = filteredItems.filter(item => {
      return item.category_id && selectedCategories.includes(item.category_id);
    });
    console.log('После фильтра категорий:', filteredItems.length);
  }
  
  if (localPriceFrom !== null) {
    filteredItems = filteredItems.filter(item => {
      const itemPrice = parseFloat(item.price) || 0;
      return itemPrice >= localPriceFrom;
    });
    console.log('После фильтра "цена от":', filteredItems.length);
  }
  
  if (localPriceTo !== null) {
    filteredItems = filteredItems.filter(item => {
      const itemPrice = parseFloat(item.price) || 0;
      return itemPrice <= localPriceTo;
    });
    console.log('После фильтра "цена до":', filteredItems.length);
  }
  
  const searchTerm = document.getElementById('searchInput')?.value.trim();
  if (searchTerm) {
    filteredItems = filteredItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    console.log('После поиска:', filteredItems.length);
  }
  
  console.log(`✅ Отфильтровано: ${filteredItems.length} из ${allItems.length} товаров`);
  
  renderItemsTable(filteredItems);
}

function resetAllFilters() {
  selectedCategories = categories.map(cat => cat.id);
  updateCategoriesValue();
  populateCategoriesFilter();
  
  currentFilter = 'all';
  document.querySelectorAll('input[name="status"]').forEach(radio => {
    radio.checked = radio.value === 'all';
  });
  updateStatusValue();
  
  document.getElementById('priceFrom').value = '';
  document.getElementById('priceTo').value = '';
  
  document.getElementById('searchInput').value = '';
  
  closeAllDropdowns();
  
  applyFilters();
  
  console.log('✅ Все фильтры сброшены');
}

function closeAllDropdowns() {
  document.querySelectorAll('.filter-dropdown').forEach(dropdown => {
    dropdown.classList.remove('show');
  });
  document.querySelectorAll('.filter-dropdown-btn').forEach(btn => {
    btn.classList.remove('active');
  });
}


function setupFilters() {
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  
  if (searchBtn) {
    searchBtn.addEventListener('click', applyFilters);
  }
  
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') applyFilters();
    });
    searchInput.addEventListener('input', applyFilters);
  }
  
  const categoriesDropdownBtn = document.getElementById('categoriesDropdownBtn');
  const categoriesDropdown = document.getElementById('categoriesDropdown');
  
  if (categoriesDropdownBtn && categoriesDropdown) {
    categoriesDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = categoriesDropdown.classList.contains('show');
      closeAllDropdowns();
      
      if (!isOpen) {
        categoriesDropdown.classList.add('show');
        categoriesDropdownBtn.classList.add('active');
      }
    });
    
    const closeBtn = categoriesDropdown.querySelector('.dropdown-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        categoriesDropdown.classList.remove('show');
        categoriesDropdownBtn.classList.remove('active');
      });
    }
    
    const selectAllBtn = document.getElementById('selectAllCategoriesBtn');
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        const checkboxes = categoriesDropdown.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
          checkbox.checked = true;
          const categoryId = parseInt(checkbox.value);
          if (!selectedCategories.includes(categoryId)) {
            selectedCategories.push(categoryId);
          }
        });
        updateCategoriesValue();
        applyFilters();
      });
    }
    
    const deselectAllBtn = document.getElementById('deselectAllCategoriesBtn');
    if (deselectAllBtn) {
      deselectAllBtn.addEventListener('click', () => {
        const checkboxes = categoriesDropdown.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
          checkbox.checked = false;
        });
        selectedCategories = [];
        updateCategoriesValue();
        applyFilters();
      });
    }
  }
  
  const priceFromInput = document.getElementById('priceFrom');
  const priceToInput = document.getElementById('priceTo');
  
  if (priceFromInput) {
    priceFromInput.addEventListener('input', applyFilters);
  }
  
  if (priceToInput) {
    priceToInput.addEventListener('input', applyFilters);
  }
  
  const statusDropdownBtn = document.getElementById('statusDropdownBtn');
  const statusDropdown = document.getElementById('statusDropdown');
  
  if (statusDropdownBtn && statusDropdown) {
    statusDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = statusDropdown.classList.contains('show');
      closeAllDropdowns();
      
      if (!isOpen) {
        statusDropdown.classList.add('show');
        statusDropdownBtn.classList.add('active');
      }
    });
    
    const statusRadios = statusDropdown.querySelectorAll('input[name="status"]');
    statusRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          currentFilter = radio.value;
          updateStatusValue();
          applyFilters();
          
          setTimeout(() => {
            statusDropdown.classList.remove('show');
            statusDropdownBtn.classList.remove('active');
          }, 300);
        }
      });
    });
    
    const statusCloseBtn = statusDropdown.querySelector('.dropdown-close');
    if (statusCloseBtn) {
      statusCloseBtn.addEventListener('click', () => {
        statusDropdown.classList.remove('show');
        statusDropdownBtn.classList.remove('active');
      });
    }
  }
  
  const resetAllFiltersBtn = document.getElementById('resetAllFiltersBtn');
  if (resetAllFiltersBtn) {
    resetAllFiltersBtn.addEventListener('click', resetAllFilters);
  }
  
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.filter-dropdown') && !e.target.closest('.filter-dropdown-btn')) {
      closeAllDropdowns();
    }
  });
}


function setupGoToSiteButton() {
  const goToSiteBtn = document.getElementById('goToSiteBtn');
  if (goToSiteBtn) {
    goToSiteBtn.addEventListener('click', () => {
      window.location.href = '../index.html';
    });
  }
}


function showMessage(text, type = 'info') {
  authMessage.textContent = text;
  authMessage.className = 'admin-auth__message';
  authMessage.classList.add(type);
  authMessage.style.display = 'block';
  
  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      authMessage.style.display = 'none';
    }, 3000);
  }
}

function switchToAdminPanel() {
  authSection.style.display = 'none';
  adminPanel.style.display = 'block';
  
  const adminEmail = document.getElementById('adminEmail');
  if (adminEmail && currentUser) {
    adminEmail.textContent = currentUser.email;
  }
  
  setupGoToSiteButton();
  
  loadItems();
  loadCategories();
  
  console.log('✅ Админ-панель загружена');
}

function switchToAuthPanel() {
  authSection.style.display = 'block';
  adminPanel.style.display = 'none';
}

function renderItemsTable(items) {
  if (!itemsTableBody) return;
  
  if (!items || items.length === 0) {
    itemsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="admin-table__empty">
          Товары не найдены
        </td>
      </tr>
    `;
    return;
  }
  
  itemsTableBody.innerHTML = items.map(item => `
    <tr data-id="${item.id}">
      <td>${item.id}</td>
      <td>
        <strong>${item.name}</strong>
        ${item.description ? `<br><small>${item.description.substring(0, 60)}${item.description.length > 60 ? '...' : ''}</small>` : ''}
      </td>
      <td>${item.category_name || 'Без категории'}</td>
      <td><strong>${item.price} ₽</strong></td>
      <td>
        <span class="admin-table__status ${item.is_active ? 'active' : 'inactive'}">
          ${item.is_active ? 'Активен' : 'В архиве'}
        </span>
      </td>
      <td>
        <div class="admin-table__actions">
          ${item.is_active ? `
            <button class="admin-table__btn edit" onclick="openEditModal(${item.id})">
              ✏️ Редактировать
            </button>
            <button class="admin-table__btn delete" onclick="confirmDelete(${item.id})">
              🗑️ В архив
            </button>
          ` : `
            <button class="admin-table__btn restore" onclick="confirmRestore(${item.id})">
              ♻️ Восстановить
            </button>
          `}
        </div>
      </td>
    </tr>
  `).join('');
}

function showTableLoading() {
  if (!itemsTableBody) return;
  itemsTableBody.innerHTML = `
    <tr>
      <td colspan="6" class="admin-table__empty">
        Загрузка данных...
      </td>
    </tr>
  `;
}

function showTableError(message) {
  if (!itemsTableBody) return;
  itemsTableBody.innerHTML = `
    <tr>
      <td colspan="6" class="admin-table__empty">
        ❌ ${message}
      </td>
    </tr>
  `;
}

function updateStats() {
  if (!allItems) return;
  
  const active = allItems.filter(item => item.is_active).length;
  const inactive = allItems.filter(item => !item.is_active).length;
  
  if (statsElements.totalItems) statsElements.totalItems.textContent = allItems.length;
  if (statsElements.activeItems) statsElements.activeItems.textContent = active;
  if (statsElements.inactiveItems) statsElements.inactiveItems.textContent = inactive;
  if (statsElements.totalCategories) statsElements.totalCategories.textContent = categories.length;
}


function openCreateModal() {
  modalTitle.textContent = 'Добавить товар';
  itemForm.reset();
  document.getElementById('editItemId').value = '';
  document.getElementById('modalActive').checked = true;
  itemModal.style.display = 'flex';
}

function openEditModal(id) {
  const item = allItems.find(i => i.id === id);
  if (!item) return;
  
  modalTitle.textContent = 'Редактировать товар';
  document.getElementById('editItemId').value = item.id;
  document.getElementById('modalCategory').value = item.category_id || '';
  document.getElementById('modalName').value = item.name;
  document.getElementById('modalPrice').value = item.price;
  document.getElementById('modalDescription').value = item.description || '';
  document.getElementById('modalImage').value = item.image_url || '';
  document.getElementById('modalActive').checked = item.is_active !== false;
  
  itemModal.style.display = 'flex';
}

function closeModal() {
  itemModal.style.display = 'none';
}

async function handleItemFormSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('editItemId').value;
  const isEdit = !!id;
  
  const itemData = {
    category_id: parseInt(document.getElementById('modalCategory').value),
    name: document.getElementById('modalName').value.trim(),
    price: parseFloat(document.getElementById('modalPrice').value),
    description: document.getElementById('modalDescription').value.trim() || null,
    image_url: document.getElementById('modalImage').value.trim() || null,
    is_active: document.getElementById('modalActive').checked
  };
  
  try {
    if (isEdit) {
      await updateItem(id, itemData);
      alert('✅ Товар успешно обновлён!');
      closeModal();
      await loadItems();
    } else {
      await createItem(itemData);
      alert('✅ Товар успешно создан!');
      closeModal();
      await loadItems();
    }
  } catch (error) {
    console.error('❌ Ошибка обработки формы:', error);
    alert(`❌ Ошибка: ${error.message}`);
  }
}


async function confirmDelete(id) {
  const item = allItems.find(i => i.id === id);
  if (!item) return;
  
  try {
    await deleteItem(id);
    console.log(`✅ Товар "${item.name}" перемещён в архив`);
    await loadItems();
  } catch (error) {
    console.error(`❌ Ошибка: ${error.message}`);
    alert(`Ошибка: ${error.message}`);
  }
}

async function confirmRestore(id) {
  const item = allItems.find(i => i.id === id);
  if (!item) return;
  
  try {
    await restoreItem(id);
    console.log(`✅ Товар "${item.name}" восстановлен`);
    await loadItems();
  } catch (error) {
    console.error(`❌ Ошибка: ${error.message}`);
    alert(`Ошибка: ${error.message}`);
  }
}

function init() {
  console.log('Админ-панель инициализируется...');
  
  const token = localStorage.getItem('adminToken');
  const user = JSON.parse(localStorage.getItem('adminUser') || 'null');
  
  if (token && user && user.role === 'admin') {
    currentToken = token;
    currentUser = user;
    switchToAdminPanel();
  } else {
    switchToAuthPanel();
  }
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      try {
        await login(email, password);
      } catch (error) {
      }
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
  
  if (addItemBtn) {
    addItemBtn.addEventListener('click', openCreateModal);
  }
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }
  
  if (itemForm) {
    itemForm.addEventListener('submit', handleItemFormSubmit);
  }
  
  if (itemModal) {
    itemModal.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal__overlay')) {
        closeModal();
      }
    });
  }
  
  setupFilters();
  
  setupGoToSiteButton();
  
  console.log('Админ-панель готова!');
}

window.openEditModal = openEditModal;
window.confirmDelete = confirmDelete;
window.confirmRestore = confirmRestore;

document.addEventListener('DOMContentLoaded', init);
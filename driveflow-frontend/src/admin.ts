// src/admin.ts
declare const lucide: any;
// @ts-ignore
if (typeof lucide !== 'undefined') {
  lucide.createIcons();
}

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : 'https://api.driveflow.jents.online';

const API_URL = `${BACKEND_URL}/api`;
const adminHeaders = {
  'x-user-role': 'ADMIN'
};

async function loadDashboard() {
  try {
    const statsRes = await fetch(`${API_URL}/admin/stats`, { headers: adminHeaders });
    const stats = await statsRes.json();
    
    const activeEl = document.getElementById('stat-active');
    const carsEl = document.getElementById('stat-cars');
    const revEl = document.getElementById('stat-revenue');

    if (activeEl) activeEl.innerText = stats.activeBookings;
    if (carsEl) carsEl.innerText = stats.availableCars;
    if (revEl) revEl.innerText = `${stats.totalRevenue.toLocaleString()} ₽`;

    const bookingsRes = await fetch(`${API_URL}/admin/bookings`, { headers: adminHeaders });
    const bookings = await bookingsRes.json();

    const tbody = document.getElementById('bookings-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    bookings.forEach((b: any) => {
      let inspectionHtml = '<span style="color: #94A3B8;">Ожидается</span>';
      
      // Если клиент прошел осмотр кузова, показываем кликабельную ссылку
      if (b.inspection) {
        const inspData = JSON.stringify(b.inspection).replace(/"/g, '&quot;');
        inspectionHtml = `<button class="action-btn" style="color: var(--primary); font-weight: 600;" onclick="showInspectionPhotos('${inspData}')">Смотреть (4)</button>`;
      }

      tbody.innerHTML += `
        <tr>
          <td>...${b.id.slice(-6)}</td>
          <td>${b.user.firstName} ${b.user.lastName}</td>
          <td>${b.car.brand} ${b.car.model}</td>
          <td><span class="badge badge-rented">${b.status}</span></td>
          <td>${inspectionHtml}</td>
        </tr>
      `;
    });
  } catch (error) {
    console.error(error);
  }
}

// ОТКРЫТИЕ ФОТОГРАФИЙ ОСМОТРА В МОДАЛКЕ АДМИНА
(window as any).showInspectionPhotos = (inspectionJsonStr: string) => {
  const inspection = JSON.parse(inspectionJsonStr);
  const grid = document.getElementById('admin-photos-grid');
  if (!grid) return;

  const backendHost = BACKEND_URL;

  grid.innerHTML = `
    <div><p style="font-size:12px; margin:0 0 4px 0; font-weight:600;">Спереди</p><img src="${backendHost}${inspection.frontImgUrl}" style="width:100%; height:180px; object-fit:cover; border-radius:8px; border:1px solid #E2E8F0;"></div>
    <div><p style="font-size:12px; margin:0 0 4px 0; font-weight:600;">Сзади</p><img src="${backendHost}${inspection.backImgUrl}" style="width:100%; height:180px; object-fit:cover; border-radius:8px; border:1px solid #E2E8F0;"></div>
    <div><p style="font-size:12px; margin:0 0 4px 0; font-weight:600;">Слева</p><img src="${backendHost}${inspection.leftImgUrl}" style="width:100%; height:180px; object-fit:cover; border-radius:8px; border:1px solid #E2E8F0;"></div>
    <div><p style="font-size:12px; margin:0 0 4px 0; font-weight:600;">Справа</p><img src="${backendHost}${inspection.rightImgUrl}" style="width:100%; height:180px; object-fit:cover; border-radius:8px; border:1px solid #E2E8F0;"></div>
    <div style="grid-column: span 2; background: #F8FAFC; padding: 12px; border-radius: 8px; margin-top: 8px; font-size:13px;">
      <strong>Заметки клиента:</strong> ${inspection.notes || 'Без замечаний'}
    </div>
  `;

  const modal = document.getElementById('admin-photo-modal');
  if (modal) modal.style.display = 'flex';
  
  // @ts-ignore
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
};

async function loadFleetTab() {
  try {
    const res = await fetch(`${API_URL}/admin/cars`, { headers: adminHeaders });
    const cars = await res.json();
    const tbody = document.getElementById('fleet-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    cars.forEach((car: any) => {
      let badgeClass = 'badge-available';
      if (car.status === 'RENTED') badgeClass = 'badge-rented';
      if (car.status === 'MAINTENANCE') badgeClass = 'badge-maintenance';

      tbody.innerHTML += `
        <tr>
          <td style="font-weight: 600;">${car.brand} ${car.model}</td>
          <td>${car.category}</td>
          <td><span class="badge ${badgeClass}">${car.status}</span></td>
          <td>
            <button class="action-btn" onclick="sendToMaintenance('${car.id}', '${car.status}')">
              ${car.status === 'MAINTENANCE' ? 'Вернуть в работу' : 'Направить на ТО'}
            </button>
          </td>
        </tr>
      `;
    });
  } catch (e) {
    console.error(e);
  }
}

async function loadKycTab() {
  const tbody = document.getElementById('kyc-tbody');
  if (!tbody) return;
  try {
    const res = await fetch(`${API_URL}/admin/kyc/pending`, { headers: adminHeaders });
    const users = await res.json();
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color:#64748B;">Нет пользователей на проверку.</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    users.forEach((u: any) => {
      tbody.innerHTML += `
        <tr>
          <td style="font-weight: 600;">${u.firstName} ${u.lastName}</td>
          <td>${u.email}</td>
          <td><code>Паспорт: ${u.passportUrl}</code></td>
          <td><code>Права: ${u.licenseUrl}</code></td>
          <td>
            <button class="action-btn" style="border-color: green; color: green;" onclick="verifyUser('${u.id}', 'APPROVED')">Одобрить</button>
            <button class="action-btn" style="border-color: red; color: red;" onclick="verifyUser('${u.id}', 'REJECTED')">Отклонить</button>
          </td>
        </tr>
      `;
    });
  } catch (e) {
    console.error(e);
  }
}

(window as any).verifyUser = async (userId: string, decision: string) => {
  try {
    const res = await fetch(`${API_URL}/admin/kyc/${userId}`, {
      method: 'PUT',
      headers: { ...adminHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: decision })
    });
    if (res.ok) {
      alert(`Решение принято: ${decision}`);
      loadKycTab();
    }
  } catch (e) {
    alert('Ошибка верификации');
  }
};

(window as any).sendToMaintenance = async (carId: string, currentStatus: string) => {
  const nextStatus = currentStatus === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
  try {
    const response = await fetch(`${API_URL}/admin/cars/${carId}/status`, {
      method: 'PUT',
      headers: { ...adminHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    });
    if (response.ok) {
      loadFleetTab();
      loadDashboard();
    }
  } catch (error) {
    alert('Не удалось изменить статус');
  }
};

// ОТПРАВКА ФОРМЫ СО СЛОЖНЫМИ ДАННЫМИ (ФАЙЛЫ + АВТОПОИСК)
// src/admin.ts (Обновленный обработчик отправки формы с индикатором загрузки)

document.getElementById('add-car-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const brandEl = document.getElementById('add-brand') as HTMLInputElement | null;
  const modelEl = document.getElementById('add-model') as HTMLInputElement | null;
  const yearEl = document.getElementById('add-year') as HTMLInputElement | null;
  const priceEl = document.getElementById('add-price') as HTMLInputElement | null;
  const categoryEl = document.getElementById('add-category') as HTMLSelectElement | null;
  const fileEl = document.getElementById('add-image-file') as HTMLInputElement | null;

  if (!brandEl || !modelEl || !yearEl || !priceEl || !categoryEl) return;

  // Находим кнопку отправки и блокируем её (Лоадер)
  const submitForm = e.target as HTMLFormElement;
  const submitBtn = submitForm.querySelector('button[type="submit"]') as HTMLButtonElement | null;
  
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerText = '🤖 Ищем характеристики и фото в сети...';
    submitBtn.style.opacity = '0.7';
    submitBtn.style.cursor = 'not-allowed';
  }

  const formData = new FormData();
  formData.append('brand', brandEl.value);
  formData.append('model', modelEl.value);
  formData.append('year', yearEl.value);
  formData.append('pricePerDay', priceEl.value);
  formData.append('category', categoryEl.value);

  if (fileEl && fileEl.files && fileEl.files.length > 0) {
    formData.append('carImage', fileEl.files[0]);
  }

  try {
    const res = await fetch(`${API_URL}/admin/cars`, {
      method: 'POST',
      headers: adminHeaders,
      body: formData
    });

    if (res.ok) {
      alert('Успешно! Автомобиль добавлен в базу.');
      submitForm.reset();
      loadFleetTab();
    } else {
      alert('Ошибка при сохранении машины бэкендом.');
    }
  } catch (err) {
    alert('Ошибка сети при отправке формы.');
  } finally {
    // Возвращаем кнопку в исходное состояние (в любом случае завершения запроса)
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Сохранить автомобиль';
      submitBtn.style.opacity = '1';
      submitBtn.style.cursor = 'pointer';
    }
  }
});

const menuTabs = [
  { btn: 'menu-dash', tab: 'tab-dashboard', fn: loadDashboard },
  { btn: 'menu-fleet', tab: 'tab-fleet', fn: loadFleetTab },
  { btn: 'menu-kyc', tab: 'tab-kyc', fn: loadKycTab },
  { btn: 'menu-settings', tab: 'tab-settings', fn: () => {} }
];

menuTabs.forEach(item => {
  const btnEl = document.getElementById(item.btn);
  if (btnEl) {
    btnEl.addEventListener('click', () => {
      menuTabs.forEach(t => {
        document.getElementById(t.btn)?.classList.remove('active');
        const tabEl = document.getElementById(t.tab);
        if (tabEl) tabEl.style.display = 'none';
      });
      btnEl.classList.add('active');
      const targetTab = document.getElementById(item.tab);
      if (targetTab) targetTab.style.display = 'block';
      item.fn();
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
});

// src/main.ts
declare const lucide: any;
// @ts-ignore
if (typeof lucide !== 'undefined') {
  lucide.createIcons();
}

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : 'https://api.driveflow.jents.online/api'; 
const carGrid = document.getElementById('car-grid');

interface Car {
  id: string;
  brand: string;
  model: string;
  transmission: string;
  seats: number;
  pricePerDay: number;
  images: string[];
}

function renderSkeletons(count: number = 4) {
  if (!carGrid) return;
  carGrid.innerHTML = '';
  for (let i = 0; i < count; i++) {
    carGrid.innerHTML += `
      <div class="car-card"><div class="car-image skeleton" style="height: 200px;"></div></div>
    `;
  }
}

function renderCars(cars: Car[]) {
  if (!carGrid) return;
  carGrid.innerHTML = '';
  if (cars.length === 0) {
    carGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">Нет доступных авто.</p>';
    return;
  }
  cars.forEach(car => {
    const imageUrl = car.images && car.images.length > 0 ? car.images[0] : '';
    const fallbackImage = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600&auto=format&fit=crop';
    const card = document.createElement('div');
    card.className = 'car-card';
    card.innerHTML = `
      <img src="${imageUrl}" alt="${car.brand}" class="car-image" onerror="this.onerror=null; this.src='${fallbackImage}';">
      <div class="car-content">
        <h3 class="car-title">${car.brand} ${car.model}</h3>
        <div class="car-specs">
          <div class="spec-item"><i data-lucide="settings-2"></i> ${car.transmission === 'AUTOMATIC' ? 'Автомат' : 'Механика'}</div>
          <div class="spec-item"><i data-lucide="users"></i> ${car.seats} мест</div>
        </div>
        <div class="car-footer">
          <div class="car-price">${car.pricePerDay} ₽<span> / сутки</span></div>
          <button class="btn btn-black" onclick="bookCar('${car.id}')">Бронь</button>
        </div>
      </div>
    `;
    carGrid.appendChild(card);
  });
  // @ts-ignore
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

}

async function fetchCars() {
  renderSkeletons();
  try {
    const response = await fetch(`${API_URL}/cars`);
    const data = await response.json();
    renderCars(data);
  } catch (error) {
    if (carGrid) carGrid.innerHTML = '<p>Сервер временно недоступен.</p>';
  }
}

// АВТОРИЗАЦИЯ, ЛИЧНЫЙ КАБИНЕТ И KYC
const authModal = document.getElementById('auth-modal');
const loginBtn = document.getElementById('login-btn');
const cabinetSection = document.getElementById('cabinet-section');
const kycStatusContainer = document.getElementById('kyc-status-container');
const kycForm = document.getElementById('kyc-form');

async function checkAuthStatus() {
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);

    try {
      // Запрашиваем свежие данные пользователя с бэкенда
      const res = await fetch(`${API_URL}/users/${userData.id}`);
      if (res.ok) {
        const freshUser = await res.json();
        
        // Синхронизируем локальный кэш новыми данными (включая APPROVED статус KYC!)
        localStorage.setItem('user', JSON.stringify(freshUser));
        
        if (loginBtn) {
          loginBtn.textContent = `Выйти (${freshUser.firstName})`;
          loginBtn.classList.add('btn-black');
        }
        cabinetSection!.style.display = 'block';
        updateKycStatusUI(freshUser.kycStatus);
        loadUserBookings(freshUser.id);
        return; // Выходим, так как данные успешно обновились
      }
    } catch (e) {
      console.warn('Сервер недоступен, используем локальный кэш для статуса KYC');
    }

    // Запасной вариант (если сервер упал, берем данные из старого кэша)
    if (loginBtn) {
      loginBtn.textContent = `Выйти (${userData.firstName})`;
      loginBtn.classList.add('btn-black');
    }
    cabinetSection!.style.display = 'block';
    updateKycStatusUI(userData.kycStatus);
    loadUserBookings(userData.id);
  } else {
    if (loginBtn) {
      loginBtn.textContent = 'Войти';
      loginBtn.classList.remove('btn-black');
    }
    cabinetSection!.style.display = 'none';
  }
}

function updateKycStatusUI(status: string) {
  if (!kycStatusContainer) return;
  if (status === 'APPROVED') {
    kycStatusContainer.innerHTML = 'Статус: <span style="color: var(--color-success);">Одобрен ✅ (Документы верифицированы)</span>';
    kycForm!.style.display = 'none';
  } else if (status === 'PENDING') {
    kycStatusContainer.innerHTML = 'Статус: <span style="color: var(--color-warning);">На проверке ⏳ (Ожидайте одобрения админом)</span>';
    kycForm!.style.display = 'none';
  } else if (status === 'REJECTED') {
    kycStatusContainer.innerHTML = 'Статус: <span style="color: var(--color-danger);">Отклонен ❌ (Загрузите новые доки)</span>';
    kycForm!.style.display = 'block';
  } else {
    kycStatusContainer.innerHTML = 'Статус: <span style="color: var(--text-muted);">Документы не загружены ⚠️</span>';
    kycForm!.style.display = 'block';
  }
}

// Отправка документов на KYC проверку
document.getElementById('submit-kyc-btn')?.addEventListener('click', async () => {
  const user = localStorage.getItem('user');
  if (!user) return;
  const userData = JSON.parse(user);

  const passport = (document.getElementById('kyc-passport') as HTMLInputElement).value;
  const license = (document.getElementById('kyc-license') as HTMLInputElement).value;

  if (!passport || !license) { alert('Заполните данные'); return; }

  try {
    const res = await fetch(`${API_URL}/users/kyc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userData.id, passportUrl: passport, licenseUrl: license })
    });
    const data = await res.json();
    if (res.ok) {
      alert('Документы отправлены на проверку!');
      localStorage.setItem('user', JSON.stringify(data.user));
      checkAuthStatus();
    }
  } catch (e) {
    alert('Ошибка загрузки документов');
  }
});

// Загрузка поездок пользователя
async function loadUserBookings(userId: string) {
  const list = document.getElementById('user-bookings-list');
  if (!list) return;

  try {
    const res = await fetch(`${API_URL}/bookings/user/${userId}`);
    const bookings = await res.json();

    if (bookings.length === 0) {
      list.innerHTML = '<p style="color: var(--text-muted);">У вас пока нет поездок.</p>';
      return;
    }

    list.innerHTML = '';
    bookings.forEach((b: any) => {
      let actionBtn = '';
      
      // Если бронь ждет оплаты и KYC одобрен -> даем пройти осмотр
      if (b.status === 'PENDING') {
        actionBtn = `
          <button class="btn btn-primary" onclick="openInspectionModal('${b.id}')" style="padding: 6px 12px; font-size:12px;">Пройти фотоосмотр</button>
          <button class="btn" onclick="cancelBooking('${b.id}')" style="padding: 6px 12px; font-size:12px; color: red; border: 1px solid red;">Отменить</button>
        `;
      } else if (b.status === 'ACTIVE' && b.contractUrl) {
        // Если аренда активна -> даем скачать договор
        actionBtn = `<a href="http://localhost:3000${b.contractUrl}" target="_blank" class="btn btn-black" style="padding: 6px 12px; font-size:12px; text-decoration:none;">Скачать договор PDF 📄</a>`;
      } else {
        actionBtn = `<span style="font-size: 12px; color: var(--text-muted);">${b.status}</span>`;
      }

      list.innerHTML += `
        <div style="background: white; padding: 16px; border-radius: 12px; border: 1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h4 style="margin: 0 0 4px 0;">${b.car.brand} ${b.car.model}</h4>
            <p style="margin: 0; font-size: 12px; color: var(--text-muted);">
              С ${new Date(b.startDate).toLocaleDateString()} по ${new Date(b.endDate).toLocaleDateString()} | Стоимость: ${b.totalPrice} ₽
            </p>
          </div>
          <div style="display:flex; gap: 8px;">
            ${actionBtn}
          </div>
        </div>
      `;
    });
  } catch (e) {
    console.error(e);
  }
}

// ОТМЕНА БРОНИ КЛИЕНТОМ
(window as any).cancelBooking = async (id: string) => {
  if (!confirm('Вы уверены, что хотите отменить бронирование?')) return;
  try {
    const res = await fetch(`${API_URL}/bookings/${id}/cancel`, { method: 'PUT' });
    if (res.ok) {
      alert('Бронирование отменено!');
      location.reload();
    }
  } catch (e) {
    alert('Ошибка отмены');
  }
};

// ОТКРЫТИЕ МОДАЛКИ ОСМОТРА
(window as any).openInspectionModal = (bookingId: string) => {
  (document.getElementById('inspect-booking-id') as HTMLInputElement).value = bookingId;
  document.getElementById('inspection-modal')?.classList.add('active');
};

// ОТПРАВКА ОСМОТРА (ФОТО) НА СЕРВЕР
document.getElementById('inspection-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('bookingId', (document.getElementById('inspect-booking-id') as HTMLInputElement).value);
  formData.append('notes', (document.getElementById('inspect-notes') as HTMLInputElement).value);
  
  formData.append('front', (document.getElementById('file-front') as HTMLInputElement).files![0]);
  formData.append('back', (document.getElementById('file-back') as HTMLInputElement).files![0]);
  formData.append('left', (document.getElementById('file-left') as HTMLInputElement).files![0]);
  formData.append('right', (document.getElementById('file-right') as HTMLInputElement).files![0]);

  try {
    const res = await fetch(`${API_URL}/inspections`, {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      alert('Осмотр пройден! Договор сформирован. Приятной поездки!');
      document.getElementById('inspection-modal')?.classList.remove('active');
      location.reload();
    } else {
      const err = await res.json();
      alert(`Ошибка: ${err.error}`);
    }
  } catch (error) {
    alert('Ошибка при отправке файлов');
  }
});

// МОДАЛЬНОЕ ОКНО БРОНИРОВАНИЯ (С ПРОВЕРКОЙ KYC!)
let selectedCar: Car | null = null;
const modal = document.getElementById('booking-modal');
const closeModalBtn = document.getElementById('close-modal');
const startDateInput = document.getElementById('start-date') as HTMLInputElement;
const endDateInput = document.getElementById('end-date') as HTMLInputElement;
const calcBase = document.getElementById('calc-base');
const calcWeekend = document.getElementById('calc-weekend');
const calcTotal = document.getElementById('calc-total');

(window as any).bookCar = async (id: string) => {
  const user = localStorage.getItem('user');
  if (!user) {
    alert('Войдите в систему для бронирования.');
    authModal?.classList.add('active');
    return;
  }
  const userData = JSON.parse(user);
  
  // КРИТИЧЕСКИЙ БЛОК: Запрещаем бронирование, если KYC не APPROVED
  if (userData.kycStatus !== 'APPROVED') {
    alert('Бронирование заблокировано! Пожалуйста, отправьте документы на проверку в Личном Кабинете и дождитесь одобрения администратором.');
    cabinetSection?.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const response = await fetch(`${API_URL}/cars`);
  const cars = await response.json();
  selectedCar = cars.find((c: Car) => c.id === id);
  if (!selectedCar) return;

  document.getElementById('modal-car-info')!.innerText = `${selectedCar.brand} ${selectedCar.model}`;
  calcBase!.innerText = `${selectedCar.pricePerDay} ₽ / день`;
  
  const today = new Date().toISOString().split('T')[0];
  startDateInput.min = today;
  endDateInput.min = today;
  modal?.classList.add('active');
};

closeModalBtn?.addEventListener('click', () => {
  modal?.classList.remove('active');
  selectedCar = null;
  startDateInput.value = '';
  endDateInput.value = '';
});

const calculatePrice = () => {
  if (!selectedCar || !startDateInput.value || !endDateInput.value) return;
  const start = new Date(startDateInput.value);
  const end = new Date(endDateInput.value);
  if (start >= end) { calcTotal!.innerText = 'Ошибка дат'; return; }

  let totalPrice = 0;
  let weekendDays = 0;
  let currentDate = new Date(start);
  while (currentDate < end) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      totalPrice += selectedCar.pricePerDay * 1.2;
      weekendDays++;
    } else {
      totalPrice += selectedCar.pricePerDay;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  calcWeekend!.innerText = `${weekendDays} дн.`;
  calcTotal!.innerText = `${Math.round(totalPrice).toLocaleString()} ₽`;
};

startDateInput.addEventListener('change', () => {
  endDateInput.min = startDateInput.value;
  calculatePrice();
});
endDateInput.addEventListener('change', calculatePrice);

document.getElementById('confirm-booking-btn')?.addEventListener('click', async () => {
  const user = localStorage.getItem('user');
  if (!user || !selectedCar) return;
  const userData = JSON.parse(user);

  try {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userData.id,
        carId: selectedCar.id,
        start: startDateInput.value,
        end: endDateInput.value
      })
    });

    if (response.ok) {
      alert('Успешно забронировано! Теперь перейдите в Личный кабинет ниже для прохождения осмотра.');
      modal?.classList.remove('active');
      location.reload();
    }
  } catch (error) {
    alert('Ошибка отправки бронирования');
  }
});

// Кнопка Входа/Регистрации (Переключение окон)
const closeAuthModalBtn = document.getElementById('close-auth-modal');
const goToRegister = document.getElementById('go-to-register');
const goToLogin = document.getElementById('go-to-login');
const loginFormContainer = document.getElementById('login-form-container');
const registerFormContainer = document.getElementById('register-form-container');

closeAuthModalBtn?.addEventListener('click', () => authModal?.classList.remove('active'));
goToRegister?.addEventListener('click', (e) => { e.preventDefault(); loginFormContainer!.style.display = 'none'; registerFormContainer!.style.display = 'block'; });
goToLogin?.addEventListener('click', (e) => { e.preventDefault(); registerFormContainer!.style.display = 'none'; loginFormContainer!.style.display = 'block'; });

// Отправка запроса Входа
document.getElementById('submit-login-btn')?.addEventListener('click', async () => {
  const email = (document.getElementById('login-email') as HTMLInputElement).value;
  const password = (document.getElementById('login-password') as HTMLInputElement).value;
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      authModal?.classList.remove('active');
      location.reload();
    } else { alert(data.error); }
  } catch (err) { alert('Ошибка авторизации'); }
});

// Отправка запроса Регистрации
document.getElementById('submit-register-btn')?.addEventListener('click', async () => {
  const firstName = (document.getElementById('reg-name') as HTMLInputElement).value;
  const email = (document.getElementById('reg-email') as HTMLInputElement).value;
  const password = (document.getElementById('reg-password') as HTMLInputElement).value;
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName: 'User' })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      authModal?.classList.remove('active');
      location.reload();
    } else { alert(data.error); }
  } catch (err) { alert('Ошибка регистрации'); }
});

document.addEventListener('DOMContentLoaded', () => {
  fetchCars();
  checkAuthStatus();
});

// ===== Data =====
const SERVICES = [
  { id: 'cut-machine', name: 'Стрижка машинкой', desc: 'Быстрая мужская стрижка триммером и машинкой.', price: 800, time: 30 },
  { id: 'cut-scissors', name: 'Стрижка ножницами', desc: 'Классическая или модельная стрижка ножницами.', price: 1200, time: 45 },
  { id: 'shave', name: 'Королевское бритьё', desc: 'Опасная бритва, горячее полотенце, уход.', price: 1000, time: 40 },
  { id: 'beard', name: 'Оформление бороды', desc: 'Стрижка и моделирование формы бороды.', price: 700, time: 20 },
  { id: 'combo', name: 'Комплекс: стрижка + бритьё', desc: 'Стрижка ножницами и королевское бритьё со скидкой.', price: 1800, time: 70 },
  { id: 'kids', name: 'Детская стрижка', desc: 'Стрижка для юных клиентов до 12 лет.', price: 600, time: 25 },
];

const MASTERS = [
  {
    id: 'artem',
    name: 'Артём Волков',
    role: 'Мастер-барбер',
    spec: 'Классические стрижки и бритьё опасной бритвой. Стаж 8 лет.',
    photo: 'https://picsum.photos/seed/master-artem/400/500',
  },
  {
    id: 'maksim',
    name: 'Максим Орлов',
    role: 'Барбер-стилист',
    spec: 'Фейды, дизайн бороды, актуальные мужские стрижки. Стаж 5 лет.',
    photo: 'https://picsum.photos/seed/master-maksim/400/500',
  },
  {
    id: 'igor',
    name: 'Игорь Реут',
    role: 'Топ-барбер',
    spec: 'Авторские стрижки, камуфляж седины. Стаж 10 лет.',
    photo: 'https://picsum.photos/seed/master-igor/400/500',
  },
];

const WORK_START_MIN = 10 * 60; // 10:00
const WORK_END_MIN = 21 * 60;   // 21:00
const SLOT_STEP = 30;

const state = {
  selectedServices: new Set(),
  selectedMaster: null,
};

// ===== Utilities =====
function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.scrollToId = scrollToId;

function formatMinutes(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

// ===== Render services =====
function renderServices() {
  const grid = document.getElementById('servicesGrid');
  grid.innerHTML = SERVICES.map(s => `
    <label class="service-card" for="svc-${s.id}" data-id="${s.id}">
      <input type="checkbox" class="service-check" id="svc-${s.id}" data-id="${s.id}">
      <div class="service-body">
        <p class="service-name">${s.name}</p>
        <p class="service-desc">${s.desc}</p>
        <div class="service-meta">
          <span class="service-price">${s.price} ₽</span>
          <span class="service-time">${s.time} мин</span>
        </div>
      </div>
    </label>
  `).join('');

  grid.querySelectorAll('.service-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = cb.dataset.id;
      if (cb.checked) state.selectedServices.add(id);
      else state.selectedServices.delete(id);
      cb.closest('.service-card').classList.toggle('selected', cb.checked);
      updateSummary();
    });
  });
}

function updateSummary() {
  const chosen = SERVICES.filter(s => state.selectedServices.has(s.id));
  const totalPrice = chosen.reduce((sum, s) => sum + s.price, 0);
  const totalTime = chosen.reduce((sum, s) => sum + s.time, 0);

  document.getElementById('summaryCount').textContent = chosen.length
    ? `Выбрано услуг: ${chosen.length}`
    : 'Услуги не выбраны';
  document.getElementById('summaryPrice').textContent = totalPrice;
  document.getElementById('summaryTime').textContent = totalTime;

  const bookingSummary = document.getElementById('bookingServicesSummary');
  if (chosen.length === 0) {
    bookingSummary.innerHTML = `Услуги ещё не выбраны. <a href="#services" onclick="scrollToId('services');return false;">Выбрать в разделе «Услуги»</a>`;
  } else {
    bookingSummary.innerHTML = `
      <ul>${chosen.map(s => `<li>${s.name} — ${s.price} ₽, ${s.time} мин</li>`).join('')}</ul>
      <div class="bs-total">Итого: ${totalPrice} ₽ · ${totalTime} мин</div>
    `;
  }
}

// ===== Render masters =====
function renderMasters() {
  const grid = document.getElementById('mastersGrid');
  grid.innerHTML = MASTERS.map(m => `
    <div class="master-card" data-id="${m.id}">
      <div class="master-photo"><img src="${m.photo}" alt="${m.name}" loading="lazy"></div>
      <div class="master-info">
        <p class="master-name">${m.name}</p>
        <p class="master-role">${m.role}</p>
        <p class="master-spec">${m.spec}</p>
        <button type="button" class="btn btn-ghost master-select-btn" data-id="${m.id}">Выбрать мастера</button>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.master-select-btn').forEach(btn => {
    btn.addEventListener('click', () => selectMaster(btn.dataset.id));
  });

  const select = document.getElementById('fMaster');
  MASTERS.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.name} — ${m.role}`;
    select.appendChild(opt);
  });
  select.addEventListener('change', () => selectMaster(select.value || null));
}

function selectMaster(id) {
  state.selectedMaster = id;
  document.querySelectorAll('.master-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.id === id);
  });
  document.querySelectorAll('.master-select-btn').forEach(btn => {
    btn.textContent = btn.dataset.id === id ? 'Мастер выбран ✓' : 'Выбрать мастера';
  });
  const select = document.getElementById('fMaster');
  if (select.value !== (id || '')) select.value = id || '';
  clearError('errMaster');
}

// ===== Time slots =====
function renderTimeSlots() {
  const select = document.getElementById('fTime');
  for (let t = WORK_START_MIN; t <= WORK_END_MIN - SLOT_STEP; t += SLOT_STEP) {
    const opt = document.createElement('option');
    opt.value = formatMinutes(t);
    opt.textContent = formatMinutes(t);
    select.appendChild(opt);
  }
}

// ===== Date min =====
function setupDateInput() {
  const dateInput = document.getElementById('fDate');
  const today = new Date();
  dateInput.min = today.toISOString().split('T')[0];
}

// ===== Form validation =====
function setError(id, message) {
  const el = document.getElementById(id);
  el.textContent = message;
  const fieldId = id.replace('err', 'f');
  const field = document.getElementById(fieldId);
  if (field) field.classList.add('invalid');
}

function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.textContent = '';
  const fieldId = id.replace('err', 'f');
  const field = document.getElementById(fieldId);
  if (field) field.classList.remove('invalid');
}

function clearAllErrors() {
  ['errName', 'errPhone', 'errMaster', 'errServices', 'errDate', 'errTime'].forEach(clearError);
}

function validateForm() {
  clearAllErrors();
  let valid = true;

  const name = document.getElementById('fName').value.trim();
  const nameRe = /^[A-Za-zА-Яа-яЁё\s-]{2,40}$/;
  if (!nameRe.test(name)) {
    setError('errName', 'Введите имя (от 2 букв, без цифр и спецсимволов).');
    valid = false;
  }

  const phoneRaw = document.getElementById('fPhone').value.trim();
  const digits = phoneRaw.replace(/\D/g, '');
  const phoneOk = /^(7|8)\d{10}$/.test(digits);
  if (!phoneOk) {
    setError('errPhone', 'Введите телефон в формате +7 (999) 123-45-67.');
    valid = false;
  }

  const masterVal = document.getElementById('fMaster').value;
  if (!masterVal) {
    setError('errMaster', 'Выберите мастера.');
    valid = false;
  }

  if (state.selectedServices.size === 0) {
    setError('errServices', 'Выберите хотя бы одну услугу в разделе «Услуги».');
    valid = false;
  }

  const dateVal = document.getElementById('fDate').value;
  if (!dateVal) {
    setError('errDate', 'Укажите дату записи.');
    valid = false;
  } else {
    const chosenDate = new Date(dateVal + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (chosenDate < today) {
      setError('errDate', 'Дата не может быть в прошлом.');
      valid = false;
    }
  }

  const timeVal = document.getElementById('fTime').value;
  if (!timeVal) {
    setError('errTime', 'Укажите время записи.');
    valid = false;
  } else if (dateVal) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (dateVal === todayStr) {
      const [h, m] = timeVal.split(':').map(Number);
      const slotMinutes = h * 60 + m;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      if (slotMinutes <= nowMinutes) {
        setError('errTime', 'На сегодня выберите время позже текущего.');
        valid = false;
      }
    }
  }

  return valid;
}

function handleSubmit(e) {
  e.preventDefault();
  const successBox = document.getElementById('formSuccess');
  successBox.hidden = true;

  if (!validateForm()) return;

  const name = document.getElementById('fName').value.trim();
  const phone = document.getElementById('fPhone').value.trim();
  const master = MASTERS.find(m => m.id === document.getElementById('fMaster').value);
  const chosen = SERVICES.filter(s => state.selectedServices.has(s.id));
  const totalPrice = chosen.reduce((sum, s) => sum + s.price, 0);
  const totalTime = chosen.reduce((sum, s) => sum + s.time, 0);
  const date = document.getElementById('fDate').value;
  const time = document.getElementById('fTime').value;

  successBox.hidden = false;
  successBox.innerHTML = `
    Спасибо, ${name}! Вы записаны к мастеру <strong>${master.name}</strong>
    на <strong>${date} в ${time}</strong>.<br>
    Услуги: ${chosen.map(s => s.name).join(', ')}.<br>
    Итого: <strong>${totalPrice} ₽</strong>, время приёма — <strong>${totalTime} мин</strong>.<br>
    Мы позвоним на номер ${phone} для подтверждения.
  `;

  document.getElementById('bookingForm').reset();
  state.selectedServices.clear();
  document.querySelectorAll('.service-check').forEach(cb => cb.closest('.service-card').classList.remove('selected'));
  state.selectedMaster = null;
  document.querySelectorAll('.master-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.master-select-btn').forEach(btn => btn.textContent = 'Выбрать мастера');
  updateSummary();
}

// ===== Mobile nav =====
function setupBurger() {
  const burger = document.getElementById('burgerBtn');
  const nav = document.getElementById('mainNav');
  burger.addEventListener('click', () => nav.classList.toggle('open'));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  renderServices();
  renderMasters();
  renderTimeSlots();
  setupDateInput();
  setupBurger();
  updateSummary();
  document.getElementById('bookingForm').addEventListener('submit', handleSubmit);
});

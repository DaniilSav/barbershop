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
const BOOKINGS_KEY = 'blackRazorBookings';

const state = {
  selectedServices: new Set(),
  selectedMaster: null,
  selectedTime: null,
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

function parseTime(str) {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

function getTotalServiceTime() {
  return SERVICES.filter(s => state.selectedServices.has(s.id)).reduce((sum, s) => sum + s.time, 0);
}

// Каждая услуга занимает своё время, поэтому запись на несколько услуг
// бронирует несколько последовательных 30-минутных слотов подряд.
function getNeededSlotCount() {
  const total = getTotalServiceTime();
  return total > 0 ? Math.ceil(total / SLOT_STEP) : 1;
}

// ===== Bookings storage (демо: общие слоты видны только в этом браузере) =====
function getBookings() {
  try {
    return JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveBookingRecord(record) {
  const bookings = getBookings();
  bookings.push(record);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
}

function getOccupiedSlotSet(masterId, date) {
  const occupied = new Set();
  getBookings().forEach(b => {
    if (b.masterId === masterId && b.date === date) {
      b.slots.forEach(t => occupied.add(t));
    }
  });
  return occupied;
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
      renderAvailableSlots();
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
  state.selectedTime = null;
  renderAvailableSlots();
}

// ===== Time slots (calendar-style, per master + date, reads local bookings) =====
function renderAvailableSlots() {
  const container = document.getElementById('timeSlots');
  const masterId = state.selectedMaster;
  const dateVal = document.getElementById('fDate').value;

  if (!masterId || !dateVal) {
    container.innerHTML = '<p class="slots-hint">Выберите мастера, услуги и дату — покажем свободное время.</p>';
    state.selectedTime = null;
    return;
  }

  const neededSlots = getNeededSlotCount();
  const occupied = getOccupiedSlotSet(masterId, dateVal);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const isBlocked = (t) => {
    const isPast = dateVal === todayStr && t <= nowMinutes;
    if (isPast) return 'past';
    for (let k = 0; k < neededSlots; k++) {
      if (occupied.has(formatMinutes(t + k * SLOT_STEP))) return 'taken';
    }
    return null;
  };

  // Если ранее выбранное время больше не помещается (сменились услуги/дата/мастер) — сбрасываем.
  if (state.selectedTime) {
    const t = parseTime(state.selectedTime);
    if (t > WORK_END_MIN - neededSlots * SLOT_STEP || isBlocked(t)) {
      state.selectedTime = null;
    }
  }

  let html = '';
  let anySlot = false;
  for (let t = WORK_START_MIN; t <= WORK_END_MIN - neededSlots * SLOT_STEP; t += SLOT_STEP) {
    anySlot = true;
    const label = formatMinutes(t);
    const blockedReason = isBlocked(t);
    const isSelected = state.selectedTime === label;
    const classes = ['time-slot'];
    if (blockedReason) classes.push('taken');
    if (isSelected) classes.push('selected');
    const title = blockedReason === 'past' ? 'Время уже прошло' : blockedReason === 'taken' ? 'Этот мастер уже занят на это время' : `Занимает ${neededSlots * SLOT_STEP} мин`;
    html += `<button type="button" class="${classes.join(' ')}" data-time="${label}" ${blockedReason ? 'disabled' : ''} title="${title}">${label}</button>`;
  }

  container.innerHTML = anySlot ? html : '<p class="slots-hint">На эту дату нет окна нужной длительности у этого мастера. Выберите другой день.</p>';

  container.querySelectorAll('.time-slot:not(.taken)').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedTime = btn.dataset.time;
      clearError('errTime');
      renderAvailableSlots();
    });
  });
}

// ===== Date min =====
function setupDateInput() {
  const dateInput = document.getElementById('fDate');
  const today = new Date();
  dateInput.min = today.toISOString().split('T')[0];
  dateInput.addEventListener('change', () => {
    state.selectedTime = null;
    renderAvailableSlots();
  });
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

  const timeVal = state.selectedTime;
  if (!timeVal) {
    setError('errTime', 'Выберите время в календаре.');
    valid = false;
  } else if (masterVal && dateVal) {
    // Защита от гонки: время могло быть занято другой записью в этом же браузере между выбором и сабмитом.
    const neededSlots = getNeededSlotCount();
    const occupied = getOccupiedSlotSet(masterVal, dateVal);
    const t = parseTime(timeVal);
    const requiredTimes = Array.from({ length: neededSlots }, (_, k) => formatMinutes(t + k * SLOT_STEP));
    const conflict = requiredTimes.some(rt => occupied.has(rt));
    if (conflict) {
      setError('errTime', 'Это время только что заняли — выберите другое.');
      state.selectedTime = null;
      renderAvailableSlots();
      valid = false;
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
  const masterId = document.getElementById('fMaster').value;
  const master = MASTERS.find(m => m.id === masterId);
  const chosen = SERVICES.filter(s => state.selectedServices.has(s.id));
  const totalPrice = chosen.reduce((sum, s) => sum + s.price, 0);
  const totalTime = chosen.reduce((sum, s) => sum + s.time, 0);
  const date = document.getElementById('fDate').value;
  const time = state.selectedTime;
  const neededSlots = getNeededSlotCount();
  const startMin = parseTime(time);
  const occupiedSlots = Array.from({ length: neededSlots }, (_, k) => formatMinutes(startMin + k * SLOT_STEP));

  saveBookingRecord({ masterId, date, slots: occupiedSlots, name, phone });

  successBox.hidden = false;
  successBox.innerHTML = `
    Спасибо, ${name}! Вы записаны к мастеру <strong>${master.name}</strong>
    на <strong>${date} в ${time}</strong> (${totalTime} мин).<br>
    Услуги: ${chosen.map(s => s.name).join(', ')}.<br>
    Итого: <strong>${totalPrice} ₽</strong>.<br>
    Это время у мастера теперь занято — другие клиенты его не увидят. Мы позвоним на номер ${phone} для подтверждения.
  `;

  document.getElementById('bookingForm').reset();
  state.selectedServices.clear();
  document.querySelectorAll('.service-check').forEach(cb => cb.closest('.service-card').classList.remove('selected'));
  state.selectedMaster = null;
  state.selectedTime = null;
  document.querySelectorAll('.master-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.master-select-btn').forEach(btn => btn.textContent = 'Выбрать мастера');
  updateSummary();
  renderAvailableSlots();
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
  setupDateInput();
  setupBurger();
  updateSummary();
  renderAvailableSlots();
  document.getElementById('bookingForm').addEventListener('submit', handleSubmit);
});

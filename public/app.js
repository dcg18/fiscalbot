const chatEl = document.getElementById('chat');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');
const statusEl = document.getElementById('status');
const chipsEl = document.getElementById('chips');
const businessNameEl = document.getElementById('businessName');
const businessMetaEl = document.getElementById('businessMeta');
const bookingLinkEl = document.getElementById('bookingLink');

const history = [];

function addMessage(role, content) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = content;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function setLoading(loading, text = '') {
  sendBtn.disabled = loading;
  inputEl.disabled = loading;
  statusEl.textContent = text;
}

async function loadConfig() {
  const res = await fetch('/api/config');
  const data = await res.json();

  businessNameEl.textContent = data.business.name;
  businessMetaEl.textContent = `${data.business.city} · ${data.business.phone} · ${data.business.email}`;
  bookingLinkEl.href = data.business.bookingUrl;

  data.suggestedQuestions.forEach((question) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = question;
    chip.addEventListener('click', () => {
      inputEl.value = question;
      inputEl.focus();
    });
    chipsEl.appendChild(chip);
  });

  addMessage(
    'assistant',
    `Hola, soy el asistente fiscal y contable de ${data.business.name}. Puedo ayudarte con IVA, IRPF, autónomos, facturas, retenciones y obligaciones habituales en España. ¿Qué necesitas?`
  );
}

async function sendMessage() {
  const message = inputEl.value.trim();
  if (!message) return;

  addMessage('user', message);
  history.push({ role: 'user', content: message });
  inputEl.value = '';
  setLoading(true, 'Pensando...');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Error desconocido');
    }

    addMessage('assistant', data.reply);
    history.push({ role: 'assistant', content: data.reply });
  } catch (error) {
    addMessage('assistant', 'Ha habido un problema al responder. Puedes reformular la consulta o pedir cita para revisión humana.');
    statusEl.textContent = error.message;
    statusEl.classList.add('error');
  } finally {
    setLoading(false, '');
    statusEl.classList.remove('error');
  }
}

sendBtn.addEventListener('click', sendMessage);
inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

loadConfig().catch((error) => {
  statusEl.textContent = `No se pudo cargar la configuración: ${error.message}`;
  statusEl.classList.add('error');
});

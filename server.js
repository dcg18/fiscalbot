require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

const business = {
  name: process.env.BUSINESS_NAME || 'Asesoría Ejemplo SL',
  city: process.env.BUSINESS_CITY || 'Madrid',
  phone: process.env.BUSINESS_PHONE || '+34 600 000 000',
  email: process.env.BUSINESS_EMAIL || 'info@tuasesoria.com',
  website: process.env.BUSINESS_WEBSITE || 'https://tuasesoria.com',
  bookingUrl: process.env.BOOKING_URL || 'https://tuasesoria.com/citas',
};

const kbPath = path.join(__dirname, 'kb', 'spain_tax_faq.json');
const kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function getSystemPrompt(channel = 'web') {
  return `
Eres un asesor fiscal y contable en España.

Responde:
- Claro, profesional y breve
- Con normativa española real
- Sin inventar datos

IMPORTANTE:
- IVA general: 21%, reducido: 10%, superreducido: 4%
- Modelo 303: IVA trimestral
- Modelo 130: pagos IRPF autónomos

Si la consulta es compleja:
👉 recomienda cita: ${business.bookingUrl}

Aviso:
Esta información es general y no sustituye asesoramiento profesional.
`;
}

// ⚡ RESPUESTAS RÁPIDAS (MUY IMPORTANTE)
function quickResponses(msg) {
  msg = msg.toLowerCase();

  if (msg.includes('modelo 303')) {
    return 'El modelo 303 es la declaración trimestral del IVA. Se presenta en abril, julio, octubre y enero.';
  }

  if (msg.includes('iva')) {
    return 'En España el IVA puede ser 21%, 10% o 4% según el producto o servicio.';
  }

  if (msg.includes('factura')) {
    return 'Una factura debe incluir: datos fiscales, concepto, base imponible, IVA y total.';
  }

  if (msg.includes('autonomo') || msg.includes('autónomo')) {
    return 'Los autónomos cotizan según ingresos reales y deben presentar IVA e IRPF trimestralmente.';
  }

  return null;
}

async function askOpenAI(userMessage) {
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    input: [
      { role: 'system', content: getSystemPrompt() },
      { role: 'user', content: userMessage }
    ],
  });

  return response.output_text || 'No he podido responder correctamente.';
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    // ⚡ RESPUESTA RÁPIDA
    const quick = quickResponses(message);
    if (quick) {
      return res.json({ reply: quick });
    }

    const reply = await askOpenAI(message);
    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.json({
      reply: "Ha habido un problema al responder. Puedes pedir cita aquí: " + business.bookingUrl
    });
  }
});

// 📱 WHATSAPP
app.post('/webhooks/whatsapp', async (req, res) => {
  const incoming = req.body.Body;
  const twiml = new twilio.twiml.MessagingResponse();

  const quick = quickResponses(incoming);
  if (quick) {
    twiml.message(quick);
    return res.type('text/xml').send(twiml.toString());
  }

  const reply = await askOpenAI(incoming);
  twiml.message(reply);

  res.type('text/xml').send(twiml.toString());
});

app.listen(port, () => {
  console.log(`Servidor funcionando en http://localhost:${port}`);
});
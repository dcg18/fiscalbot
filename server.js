require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// INFO NEGOCIO
const business = {
  name: process.env.BUSINESS_NAME || 'Asesoría Casanova',
  city: process.env.BUSINESS_CITY || 'Madrid',
  phone: process.env.BUSINESS_PHONE || '+34 600 000 000',
  email: process.env.BUSINESS_EMAIL || 'info@tuasesoria.com',
  website: process.env.BUSINESS_WEBSITE || 'https://tuasesoria.com',
  bookingUrl: process.env.BOOKING_URL || 'https://tuasesoria.com/citas',
};

// BASE FAQ
const kbPath = path.join(__dirname, 'kb', 'spain_tax_faq.json');
let kb = [];
if (fs.existsSync(kbPath)) {
  kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
}

// OPENAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 🟢 HEALTH CHECK (IMPORTANTE PARA RENDER)
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// PROMPT
function getSystemPrompt() {
  return `
Eres un asesor fiscal y contable en España.

Responde:
- Claro, profesional y breve
- Basado en normativa española
- No inventes datos

Datos útiles:
- IVA: 21%, 10%, 4%
- Modelo 303: IVA trimestral
- Modelo 130: IRPF autónomos

Si es complejo:
👉 recomienda cita: ${business.bookingUrl}

Aviso:
Información general, no sustituye asesoramiento profesional.
`;
}

// RESPUESTAS RÁPIDAS
function quickResponses(msg) {
  msg = msg.toLowerCase();

  if (msg.includes('modelo 303')) {
    return 'El modelo 303 es la declaración trimestral del IVA.';
  }

  if (msg.includes('iva')) {
    return 'En España el IVA puede ser 21%, 10% o 4%.';
  }

  if (msg.includes('factura')) {
    return 'Una factura debe incluir: datos fiscales, base imponible, IVA y total.';
  }

  if (msg.includes('autonomo') || msg.includes('autónomo')) {
    return 'Los autónomos deben declarar IVA e IRPF trimestralmente.';
  }

  return null;
}

// OPENAI
async function askOpenAI(message) {
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    input: [
      { role: 'system', content: getSystemPrompt() },
      { role: 'user', content: message }
    ],
  });

  return response.output_text || 'No he podido responder.';
}

// CHAT WEB
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.json({ reply: "Escribe una consulta." });
    }

    const quick = quickResponses(message);
    if (quick) {
      return res.json({ reply: quick });
    }

    const reply = await askOpenAI(message);
    res.json({ reply });

  } catch (error) {
    console.error("ERROR CHAT:", error);
    res.json({
      reply: "Error del servidor. Puedes pedir cita aquí: " + business.bookingUrl
    });
  }
});

// WHATSAPP
app.post('/webhooks/whatsapp', async (req, res) => {
  const incoming = req.body.Body || '';
  const twiml = new twilio.twiml.MessagingResponse();

  try {
    const quick = quickResponses(incoming);
    if (quick) {
      twiml.message(quick);
    } else {
      const reply = await askOpenAI(incoming);
      twiml.message(reply);
    }
  } catch (error) {
    twiml.message("Error. Contacta con nosotros: " + business.bookingUrl);
  }

  res.type('text/xml').send(twiml.toString());
});

// START
app.listen(port, () => {
  console.log(`Servidor funcionando en http://localhost:${port}`);
});
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

const business = {
  bookingUrl: process.env.BOOKING_URL || 'https://tuweb.com/citas',
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors({
  origin: "*"
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

function getSystemPrompt() {
  const today = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
Eres un asesor fiscal en España.

Fecha actual: ${today}

Responde claro y profesional.

Si es complejo recomienda cita:
${business.bookingUrl}

Aviso: Información general, no sustituye asesoramiento profesional.
`;
}

async function askOpenAI(message) {
  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      input: [
        { role: 'system', content: getSystemPrompt() },
        { role: 'user', content: message }
      ],
    });

    return response.output_text || 'No he podido responder.';
  } catch (error) {
    console.error(error);
    return "Error del sistema. Inténtalo en unos segundos.";
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    const reply = await askOpenAI(message);
    res.json({ reply });

  } catch (error) {
    res.json({
      reply: "Error. Pide cita aquí: " + business.bookingUrl
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor funcionando en puerto ${port}`);
});
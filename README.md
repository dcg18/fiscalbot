# FiscalBot Web + WhatsApp

Proyecto base listo para desplegar de un chatbot fiscal y contable para España con:

- Chat web embebible en tu página.
- Backend Node.js/Express.
- Integración con OpenAI para respuestas tipo ChatGPT.
- Webhook de WhatsApp con Twilio.
- Prompt especializado en fiscalidad y contabilidad en España.
- Base inicial de preguntas frecuentes para arrancar rápido.

## 1) Requisitos

- Node.js 18+
- Una clave de OpenAI
- Una cuenta de Twilio con WhatsApp Sandbox o número WhatsApp habilitado

## 2) Instalación

```bash
npm install
cp .env.example .env
```

Rellena el archivo `.env` con tus datos.

## 3) Arranque local

```bash
npm run dev
```

Abre:

```bash
http://localhost:3000
```

## 4) Variables de entorno

- `OPENAI_API_KEY`: clave de OpenAI
- `OPENAI_MODEL`: modelo recomendado, por ejemplo `gpt-4.1-mini`
- `BUSINESS_*`: datos de tu asesoría
- `BOOKING_URL`: enlace real de reservas
- `TWILIO_*`: credenciales de Twilio para WhatsApp

## 5) Endpoints

### Chat web

`POST /api/chat`

Body JSON:

```json
{
  "message": "Soy autónomo, ¿cuándo presento el modelo 303?",
  "history": [
    { "role": "user", "content": "Hola" },
    { "role": "assistant", "content": "Hola, ¿en qué puedo ayudarte?" }
  ]
}
```

### Estado

`GET /api/health`

### Configuración del frontend

`GET /api/config`

### Webhook de WhatsApp

`POST /webhooks/whatsapp`

## 6) Configuración de WhatsApp con Twilio

### Modo rápido: Sandbox

1. Entra en Twilio y activa el **WhatsApp Sandbox**.
2. Copia la URL pública de tu servidor, por ejemplo usando ngrok.
3. Configura el webhook “WHEN A MESSAGE COMES IN” a:

```text
https://TU-DOMINIO/webhooks/whatsapp
```

4. Envía el código de unión del Sandbox al número que Twilio te indique.
5. Ya podrás conversar con el bot por WhatsApp.

### Producción

1. Habilita un número con WhatsApp en Twilio.
2. Completa el onboarding de WhatsApp Business.
3. Configura el webhook del número a `/webhooks/whatsapp`.

## 7) Cómo personalizar el conocimiento

Edita:

```text
kb/spain_tax_faq.json
```

Ahí puedes añadir:

- servicios de tu despacho
- especialidades (autónomos, pymes, ecommerce, no residentes, sociedades)
- criterios internos
- respuestas comerciales
- preguntas de cualificación del lead

## 8) Cómo mejorar el bot

### A. Añadir documentos propios

Lo ideal es conectar el bot a:

- dossier de servicios
- política de precios
- preguntas frecuentes de clientes
- checklist de alta de autónomos
- procedimientos internos

Puedes hacerlo en una segunda fase con búsqueda sobre archivos o vector store.

### B. Añadir captura de leads

Puedes crear un flujo para pedir:

- nombre
- email
- teléfono
- tipo de consulta
- facturación aproximada
- urgencia

Y guardar todo en CRM o Google Sheets.

### C. Añadir cita automática

Integra `BOOKING_URL` con Calendly, tu ERP o tu formulario de reservas.

## 9) Recomendaciones operativas

- Mantén siempre un aviso legal visible.
- Revisa periódicamente plazos y cambios normativos.
- Deriva a asesor humano cuando haya riesgo sancionador, inspecciones, operaciones internacionales o revisión documental.

## 10) Despliegue

Puedes desplegar este proyecto en:

- Render
- Railway
- Fly.io
- VPS propio
- Vercel (frontend) + backend separado

## 11) Siguiente mejora sugerida

La mejor evolución es conectar el bot a tu base documental real y añadir autenticación de clientes para consultar estado de expedientes, impuestos pendientes y documentación.

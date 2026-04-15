import { Handler } from '@netlify/functions';

// SQUARE_ACCESS_TOKEN: configure nas variáveis de ambiente do Netlify
// Nunca coloque o token diretamente no código
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;

const API_URL = process.env.VITE_SQUARE_ENV === 'production'
  ? 'https://connect.squareup.com/v2/terminals/checkouts'
  : 'https://connect.squareupsandbox.com/v2/terminals/checkouts';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!SQUARE_ACCESS_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'SQUARE_ACCESS_TOKEN não configurado nas variáveis de ambiente do Netlify.' }),
    };
  }

  try {
    const { amount, deviceId, locationId } = JSON.parse(event.body || '{}');

    if (!amount || !deviceId || !locationId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Parâmetros obrigatórios ausentes: amount, deviceId, locationId' }) };
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Square-Version': '2024-03-20',
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        checkout: {
          amount_money: {
            amount: Math.round(amount * 100),
            currency: 'CAD',
          },
          device_options: {
            device_id: deviceId,
            skip_receipt_screen: false,
            collect_signature: false,
          },
          location_id: locationId,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data.errors?.[0]?.detail || 'Square API Error' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.checkout),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};

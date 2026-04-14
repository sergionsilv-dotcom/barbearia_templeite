import { Handler } from '@netlify/functions';

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const API_URL = process.env.VITE_SQUARE_ENV === 'production' 
  ? 'https://connect.squareup.com/v2/terminals/checkouts'
  : 'https://connect.squareupsandbox.com/v2/terminals/checkouts';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { amount, deviceId, locationId, customerId } = JSON.parse(event.body || '{}');

    if (!amount || !deviceId || !locationId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing parameters' }) };
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
            amount: Math.round(amount * 100), // convert to cents
            currency: 'CAD',
          },
          device_options: {
            device_id: deviceId,
            skip_receipt_screen: false,
            // Aqui permitimos que a máquina peça a gorjeta (Tip)
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
        body: JSON.stringify({ error: data.errors?.[0]?.detail || 'Square API Error' }) 
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

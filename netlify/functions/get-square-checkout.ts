import { Handler } from '@netlify/functions';

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;

const API_URL_BASE = process.env.VITE_SQUARE_ENV === 'production'
  ? 'https://connect.squareup.com/v2/terminals/checkouts'
  : 'https://connect.squareupsandbox.com/v2/terminals/checkouts';

export const handler: Handler = async (event) => {
  const id = event.queryStringParameters?.id;

  if (!id) {
    return { statusCode: 400, body: 'Missing ID' };
  }

  if (!SQUARE_ACCESS_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'SQUARE_ACCESS_TOKEN não configurado nas variáveis de ambiente do Netlify.' }),
    };
  }

  try {
    const response = await fetch(`${API_URL_BASE}/${id}`, {
      method: 'GET',
      headers: {
        'Square-Version': '2024-03-20',
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
      },
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

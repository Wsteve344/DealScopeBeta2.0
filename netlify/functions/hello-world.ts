import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  try {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Hello from Netlify Functions!'
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
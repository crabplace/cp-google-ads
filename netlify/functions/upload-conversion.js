/**
 * upload-conversion.js
 *
 * Uploads offline/enhanced conversions to Google Ads using hashed user data.
 * This is the Google equivalent of Meta CAPI — no gclid needed.
 *
 * POST body:
 * {
 *   "conversionAction": "customers/1234567890/conversionActions/987654321",
 *   "email": "customer@example.com",
 *   "firstName": "John",
 *   "lastName": "Doe",
 *   "phone": "4105551234",
 *   "conversionValue": 125.50,
 *   "currencyCode": "USD",
 *   "orderId": "12345",
 *   "conversionDateTime": "2026-03-19 14:30:00-04:00"
 * }
 */

const { getAccessToken } = require('./get-token');
const crypto = require('crypto');

const CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID;
const DEV_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
const MCC_ID = process.env.GOOGLE_ADS_MCC_ID || '9977638905';

function sha256(value) {
  return crypto.createHash('sha256').update((value || '').trim().toLowerCase()).digest('hex');
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'POST only' }) };

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      conversionAction,
      email, firstName, lastName, phone,
      conversionValue = 0,
      currencyCode = 'USD',
      orderId,
      conversionDateTime,
    } = body;

    if (!conversionAction) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'conversionAction resource name required' }) };
    }
    if (!email) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'email required for enhanced conversion' }) };
    }

    // Build user identifiers (hashed)
    const userIdentifiers = [{ hashedEmail: sha256(email) }];
    if (phone) userIdentifiers.push({ hashedPhoneNumber: sha256(phone.replace(/\D/g, '')) });
    if (firstName && lastName) {
      userIdentifiers.push({
        addressInfo: {
          hashedFirstName: sha256(firstName),
          hashedLastName: sha256(lastName),
        },
      });
    }

    // Format datetime — Google expects "yyyy-mm-dd hh:mm:ss+|-hh:mm"
    const convTime = conversionDateTime || new Date().toISOString().replace('T', ' ').replace('Z', '+00:00').substring(0, 25) + ':00';

    const conversion = {
      conversionAction,
      conversionDateTime: convTime,
      conversionValue: parseFloat(conversionValue),
      currencyCode,
      userIdentifiers,
    };
    if (orderId) conversion.orderId = String(orderId);

    const accessToken = await getAccessToken();
    const url = `https://googleads.googleapis.com/v20/customers/${CUSTOMER_ID}:uploadClickConversions`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'developer-token': DEV_TOKEN,
        'login-customer-id': MCC_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversions: [conversion],
        partialFailure: true,
      }),
    });

    const data = await resp.json();

    return {
      statusCode: resp.status === 200 ? 200 : 500,
      headers,
      body: JSON.stringify({
        success: resp.status === 200 && !data.error,
        response: data,
      }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

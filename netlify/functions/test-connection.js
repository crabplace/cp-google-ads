const { getAccessToken } = require('./get-token');
const DEV_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
const CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID;

exports.handler = async () => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  try {
    const accessToken = await getAccessToken();

    // Test 1: list accessible customers
    const resp = await fetch('https://googleads.googleapis.com/v17/customers:listAccessibleCustomers', {
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'developer-token': DEV_TOKEN,
        'login-customer-id': CUSTOMER_ID
      }
    });
    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch(e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Non-JSON from API', status: resp.status, raw: text.substring(0, 500) }) };
    }

    if (data.error) return { statusCode: 500, headers, body: JSON.stringify({ api_error: data.error }) };

    return { statusCode: 200, headers, body: JSON.stringify({
      status: 'connected',
      customer_id: CUSTOMER_ID,
      accessible_customers: data.resourceNames || [],
      timestamp: new Date().toISOString()
    })};
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

const { getAccessToken } = require('./get-token');
const DEV_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
const CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID;

exports.handler = async () => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  try {
    const accessToken = await getAccessToken();

    // Query customer info directly - works with Explorer access
    const resp = await fetch('https://googleads.googleapis.com/v17/customers/' + CUSTOMER_ID + '/googleAds:search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'developer-token': DEV_TOKEN,
        'login-customer-id': CUSTOMER_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: 'SELECT customer.id, customer.descriptive_name, customer.status FROM customer LIMIT 1' })
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch(e) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Non-JSON', status: resp.status, raw: text.substring(0, 800) }) };
    }

    if (data.error) return { statusCode: 500, headers, body: JSON.stringify({ api_error: data.error }) };

    const customer = data.results && data.results[0] && data.results[0].customer;
    return { statusCode: 200, headers, body: JSON.stringify({
      status: 'connected',
      customer_id: CUSTOMER_ID,
      account_name: customer ? customer.descriptiveName : null,
      account_status: customer ? customer.status : null,
      timestamp: new Date().toISOString()
    })};
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

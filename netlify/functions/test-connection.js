const { getAccessToken } = require('./get-token');
const DEV_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
const CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID;
exports.handler = async () => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  try {
    const accessToken = await getAccessToken();
    const resp = await fetch('https://googleads.googleapis.com/v18/customers:listAccessibleCustomers', { headers: { 'Authorization': `Bearer ${accessToken}`, 'developer-token': DEV_TOKEN } });
    const data = await resp.json();
    return { statusCode: 200, headers, body: JSON.stringify({ status: 'connected', customer_id: CUSTOMER_ID, accessible_customers: data.resourceNames || [], timestamp: new Date().toISOString() }) };
  } catch (err) { return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) }; }
};

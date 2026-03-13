const { getAccessToken } = require('./get-token');
const CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID;
const DEV_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
const MCC_ID = process.env.GOOGLE_ADS_MCC_ID || '9977638905';

const queryGoogleAds = async (gaql) => {
  const accessToken = await getAccessToken();
  const resp = await fetch('https://googleads.googleapis.com/v20/customers/' + CUSTOMER_ID + '/googleAds:search', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'developer-token': DEV_TOKEN,
      'login-customer-id': MCC_ID,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: gaql })
  });
  const data = await resp.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.results || [];
};

module.exports = { queryGoogleAds };

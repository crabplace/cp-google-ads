const { queryGoogleAds } = require('./gaql');
exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  const days = event.queryStringParameters?.days || '30';
  const limit = event.queryStringParameters?.limit || '50';
  try {
    const results = await queryGoogleAds(`SELECT search_term_view.search_term, search_term_view.status, campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value, metrics.ctr FROM search_term_view WHERE segments.date DURING LAST_${days}_DAYS AND metrics.impressions > 0 ORDER BY metrics.cost_micros DESC LIMIT ${limit}`);
    const terms = results.map(r => ({ search_term:r.searchTermView.searchTerm, status:r.searchTermView.status, campaign:r.campaign.name, impressions:r.metrics.impressions||0, clicks:r.metrics.clicks||0, cost:((r.metrics.costMicros||0)/1e6).toFixed(2), conversions:parseFloat(r.metrics.conversions||0).toFixed(1), conversion_value:parseFloat(r.metrics.conversionsValue||0).toFixed(2), ctr:(parseFloat(r.metrics.ctr||0)*100).toFixed(2)+'%' }));
    return { statusCode:200, headers, body:JSON.stringify({ date_range:`last_${days}_days`, count:terms.length, terms }) };
  } catch(err) { return { statusCode:500, headers, body:JSON.stringify({error:err.message}) }; }
};

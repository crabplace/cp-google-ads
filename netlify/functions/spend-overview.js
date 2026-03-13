const { queryGoogleAds } = require('./gaql');
exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  const days = event.queryStringParameters?.days || '30';
  try {
    const dailyResults = await queryGoogleAds(`SELECT segments.date, metrics.cost_micros, metrics.conversions, metrics.conversions_value, metrics.clicks, metrics.impressions FROM customer WHERE segments.date DURING LAST_${days}_DAYS ORDER BY segments.date ASC`);
    const daily = dailyResults.map(r => ({ date:r.segments.date, spend:((r.metrics.costMicros||0)/1e6).toFixed(2), conversions:parseFloat(r.metrics.conversions||0).toFixed(1), conversion_value:parseFloat(r.metrics.conversionsValue||0).toFixed(2), clicks:r.metrics.clicks||0, impressions:r.metrics.impressions||0 }));
    const totals = daily.reduce((a,d) => ({ spend:(parseFloat(a.spend)+parseFloat(d.spend)).toFixed(2), conversions:(parseFloat(a.conversions)+parseFloat(d.conversions)).toFixed(1), conversion_value:(parseFloat(a.conversion_value)+parseFloat(d.conversion_value)).toFixed(2), clicks:a.clicks+parseInt(d.clicks), impressions:a.impressions+parseInt(d.impressions) }), {spend:0,conversions:0,conversion_value:0,clicks:0,impressions:0});
    totals.roas = totals.spend>0?(parseFloat(totals.conversion_value)/parseFloat(totals.spend)).toFixed(2):'0';
    totals.avg_daily_spend = (parseFloat(totals.spend)/daily.length).toFixed(2);
    return { statusCode:200, headers, body:JSON.stringify({ date_range:`last_${days}_days`, totals, daily }) };
  } catch(err) { return { statusCode:500, headers, body:JSON.stringify({error:err.message}) }; }
};

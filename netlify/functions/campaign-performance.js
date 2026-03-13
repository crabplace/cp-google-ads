const { queryGoogleAds } = require('./gaql');
exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  const days = event.queryStringParameters?.days || '30';
  try {
    const results = await queryGoogleAds(`SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value, metrics.ctr, metrics.average_cpc, metrics.cost_per_conversion FROM campaign WHERE segments.date DURING LAST_${days}_DAYS AND campaign.status != 'REMOVED' ORDER BY metrics.cost_micros DESC`);
    const campaigns = results.map(r => ({ id: r.campaign.id, name: r.campaign.name, status: r.campaign.status, type: r.campaign.advertisingChannelType, impressions: r.metrics.impressions||0, clicks: r.metrics.clicks||0, cost: ((r.metrics.costMicros||0)/1e6).toFixed(2), conversions: parseFloat(r.metrics.conversions||0).toFixed(1), conversion_value: parseFloat(r.metrics.conversionsValue||0).toFixed(2), roas: r.metrics.conversionsValue&&r.metrics.costMicros?(r.metrics.conversionsValue/(r.metrics.costMicros/1e6)).toFixed(2):'0', ctr: (parseFloat(r.metrics.ctr||0)*100).toFixed(2)+'%', avg_cpc: ((r.metrics.averageCpc||0)/1e6).toFixed(2), cost_per_conv: ((r.metrics.costPerConversion||0)/1e6).toFixed(2) }));
    const totals = campaigns.reduce((a,c) => ({ spend:(parseFloat(a.spend)+parseFloat(c.cost)).toFixed(2), conversions:(parseFloat(a.conversions)+parseFloat(c.conversions)).toFixed(1), conversion_value:(parseFloat(a.conversion_value)+parseFloat(c.conversion_value)).toFixed(2), clicks:a.clicks+parseInt(c.clicks), impressions:a.impressions+parseInt(c.impressions) }), {spend:0,conversions:0,conversion_value:0,clicks:0,impressions:0});
    totals.roas = totals.spend>0?(parseFloat(totals.conversion_value)/parseFloat(totals.spend)).toFixed(2):'0';
    return { statusCode:200, headers, body:JSON.stringify({ date_range:`last_${days}_days`, totals, campaigns }) };
  } catch(err) { return { statusCode:500, headers, body:JSON.stringify({error:err.message}) }; }
};

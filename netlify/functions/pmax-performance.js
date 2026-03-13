const { queryGoogleAds } = require('./gaql');
exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  const days = event.queryStringParameters?.days || '30';
  try {
    const pmaxResults = await queryGoogleAds(`SELECT campaign.id, campaign.name, campaign.status, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value, metrics.ctr, metrics.average_cpc FROM campaign WHERE segments.date DURING LAST_${days}_DAYS AND campaign.advertising_channel_type = 'PERFORMANCE_MAX' AND campaign.status != 'REMOVED' ORDER BY metrics.cost_micros DESC`);
    const assetResults = await queryGoogleAds(`SELECT campaign.name, asset_group.name, asset_group.status, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value FROM asset_group WHERE segments.date DURING LAST_${days}_DAYS AND campaign.advertising_channel_type = 'PERFORMANCE_MAX' ORDER BY metrics.cost_micros DESC`);
    const campaigns = pmaxResults.map(r => ({ id:r.campaign.id, name:r.campaign.name, status:r.campaign.status, impressions:r.metrics.impressions||0, clicks:r.metrics.clicks||0, cost:((r.metrics.costMicros||0)/1e6).toFixed(2), conversions:parseFloat(r.metrics.conversions||0).toFixed(1), conversion_value:parseFloat(r.metrics.conversionsValue||0).toFixed(2), roas:r.metrics.conversionsValue&&r.metrics.costMicros?(r.metrics.conversionsValue/(r.metrics.costMicros/1e6)).toFixed(2):'0', ctr:(parseFloat(r.metrics.ctr||0)*100).toFixed(2)+'%', avg_cpc:((r.metrics.averageCpc||0)/1e6).toFixed(2) }));
    const asset_groups = assetResults.map(r => ({ campaign:r.campaign.name, asset_group:r.assetGroup.name, status:r.assetGroup.status, impressions:r.metrics.impressions||0, clicks:r.metrics.clicks||0, cost:((r.metrics.costMicros||0)/1e6).toFixed(2), conversions:parseFloat(r.metrics.conversions||0).toFixed(1), conversion_value:parseFloat(r.metrics.conversionsValue||0).toFixed(2) }));
    return { statusCode:200, headers, body:JSON.stringify({ date_range:`last_${days}_days`, campaigns, asset_groups }) };
  } catch(err) { return { statusCode:500, headers, body:JSON.stringify({error:err.message}) }; }
};

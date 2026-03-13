const { queryGoogleAds } = require('./gaql');
exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  const days = event.queryStringParameters?.days || '30';
  try {
    const results = await queryGoogleAds(`SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status, campaign.name, ad_group.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value, metrics.average_cpc, metrics.quality_score FROM keyword_view WHERE segments.date DURING LAST_${days}_DAYS AND ad_group_criterion.status != 'REMOVED' AND metrics.impressions > 0 ORDER BY metrics.cost_micros DESC LIMIT 100`);
    const keywords = results.map(r => ({ keyword:r.adGroupCriterion.keyword.text, match_type:r.adGroupCriterion.keyword.matchType, status:r.adGroupCriterion.status, campaign:r.campaign.name, ad_group:r.adGroup.name, impressions:r.metrics.impressions||0, clicks:r.metrics.clicks||0, cost:((r.metrics.costMicros||0)/1e6).toFixed(2), conversions:parseFloat(r.metrics.conversions||0).toFixed(1), conversion_value:parseFloat(r.metrics.conversionsValue||0).toFixed(2), avg_cpc:((r.metrics.averageCpc||0)/1e6).toFixed(2), quality_score:r.metrics.qualityScore||null }));
    return { statusCode:200, headers, body:JSON.stringify({ date_range:`last_${days}_days`, count:keywords.length, keywords }) };
  } catch(err) { return { statusCode:500, headers, body:JSON.stringify({error:err.message}) }; }
};

const { queryGoogleAds } = require('./gaql');

exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  try {
    const results = await queryGoogleAds(
      "SELECT conversion_action.id, conversion_action.name, conversion_action.status, " +
      "conversion_action.type, conversion_action.category, conversion_action.origin " +
      "FROM conversion_action " +
      "WHERE conversion_action.status != 'REMOVED' " +
      "ORDER BY conversion_action.name"
    );

    const actions = results.map(r => ({
      id: r.conversionAction.id,
      resourceName: r.conversionAction.resourceName,
      name: r.conversionAction.name,
      status: r.conversionAction.status,
      type: r.conversionAction.type,
      category: r.conversionAction.category,
      origin: r.conversionAction.origin,
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ actions }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

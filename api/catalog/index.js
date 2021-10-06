const axios = require('axios');

module.exports = async function (context, req) {
  const locale = req.query.locale || (req.body && req.body.locale);
  const clientId = ''; //MSLearnUtilities

  let data = {};

  try {
    const response = await axios({
      method: 'get',
      url: `https://docs.microsoft.com/api/learn/catalog`, //?locale=${locale}&clientid=${clientId}
      json: true,
    });

    data = response.data;
  } catch (err) {
    context.log.error('ERROR', err);

    context.res = {
      status: 500,
      body: {
        error: err.message,
      },
    };
    context.done();
  }

  context.res = {
    body: data,
  };
};

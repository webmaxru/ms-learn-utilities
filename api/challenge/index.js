const axios = require('axios');

module.exports = async function (context, req) {
  const id = req.query.id || (req.body && req.body.id);

  let data = {};

  try {
    const response = await axios({
      method: 'get',
      url: `https://docs.microsoft.com/api/challenges/${id}`,
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
    body: {
      challengeCollectionId: data.challengeCollectionId,
      title: data.title,
      description: data.description,
    },
  };
};

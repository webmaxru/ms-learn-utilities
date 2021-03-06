const axios = require('axios');

module.exports = async function (context, req) {
  const id = req.query.id || (req.body && req.body.id);

  let data = {};

  try {
    const response = await axios({
      method: 'get',
      url: `https://docs.microsoft.com/api/lists/${id}`,
      json: true,
    });

    data = response.data;

    /*     durationInMinutes = response.data.items
      .filter((e) => e.data.durationInMinutes)
      .reduce((sum, e) => sum + e.data.durationInMinutes, 0); */
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
      totalDuration: data.totalDuration,
      moduleCount: data.moduleCount,
      itemCount: data.itemCount,
      name: data.name,
      description: data.description,
    },
  };
};

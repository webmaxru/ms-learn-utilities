module.exports = async function (context, req) {

  const id = req.query.id || (req.body && req.body.id);

  let sum = 0;

  try {
    const response = await fetch(`https://docs.microsoft.com/api/lists/${id}`);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const json = await response.json();

    sum = json.items
      .filter((e) => e.data.durationInMinutes)
      .reduce((sum, e) => sum + e.data.durationInMinutes, 0);
  } catch (err) {
    context.log.error('ERROR', err);
    throw err;
  }

  context.log(`Sum: ${sum}`);

  context.res = {
    body: {
      sum: sum,
    },
  };
};

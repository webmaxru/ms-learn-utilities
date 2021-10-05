import React, { useState } from 'react';

function TotalTime(props) {
  const [url, setUrl] = useState('');
  const [isResultReady, setIsResultReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isDebug = props.isDebug;

  const [totalDuration, setTotalDuration] = useState(``);
  const [moduleCount, setModuleCount] = useState(``);
  const [itemCount, setItemCount] = useState(``);
  const [name, setName] = useState(``);

  function minutesToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 60);
    var m = Math.floor((d % 60) / 1);

    var hDisplay = h > 0 ? h + 'h ' : '';
    var mDisplay = m > 0 ? m + 'm' : '';
    return hDisplay + mDisplay;
  }

  async function getTotalTime(props) {
    setIsResultReady(false);
    setIsLoading(true);

    const parsedUrl = new URL(url);

    if (parsedUrl.pathname.includes('/collections/')) {
      const collectionId = parsedUrl.pathname.split('/').pop();

      processCollection(collectionId);
    } else if (parsedUrl.pathname.includes('/challenges')) {
      const challengeId = parsedUrl.searchParams.get('id');

      const collectionId = await getCollectionId(challengeId);
      processCollection(collectionId);
    } else {
      if (isDebug) console.error(`Error`, `Invalid URL`);
      return;
    }
  }

  async function processCollection(collectionId) {
    try {
      const res = await fetch(`/api/collection/?id=${collectionId}`);
      const collection = await res.json();

      setTotalDuration(collection.totalDuration);
      setModuleCount(collection.moduleCount);
      setItemCount(collection.itemCount);
      setName(collection.name);

      setIsResultReady(true);
      setIsLoading(false);
    } catch (err) {
      if (isDebug) console.error(`Error`, err.message);
    }
  }

  async function getCollectionId(challengeId) {
    try {
      const res = await fetch(`/api/challenge/?id=${challengeId}`);
      const json = await res.json();

      return json.challengeCollectionId;
    } catch (err) {
      if (isDebug) console.error(`Error`, err.message);
    }
  }

  return (
    <main className="content">
      <h3>Total Time Calculator</h3>
      <label htmlFor="url">URL of the Collection or Challenge:</label>
      <p>
        <input
          id="url"
          type="url"
          placeholder="https://..."
          onChange={(e) => setUrl(e.target.value)}
          value={url}
        />
      </p>
      <p>
        <button className="button" onClick={getTotalTime}>
          Get total time
        </button>
      </p>
      {isResultReady ? (
        <>
          <br />
          <h2>{minutesToHms(totalDuration)}</h2>
          <ul>
            <li>Collection name: {name}</li>
            <li>Module count: {moduleCount}</li>
            <li>Item count: {itemCount}</li>
          </ul>
        </>
      ) : null}
      {isLoading ? (
        <p>
          <small>Calculating...</small>
        </p>
      ) : null}
      <small
        onClick={() =>
          setUrl(
            'https://docs.microsoft.com/en-us/users/webmaxru/collections/jk7zfxk2z0064y'
          )
        }
        className="hint"
      >
        Sample Collection
      </small>
      ,&nbsp;
      <small
        onClick={() =>
          setUrl(
            'https://docs.microsoft.com/en-us/learn/challenges?id=953d1dd3-16ca-458d-8347-ab49da9b0521'
          )
        }
        className="hint"
      >
        Sample Challenge
      </small>
    </main>
  );
}

export default TotalTime;

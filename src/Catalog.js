import React, { useState, useEffect } from 'react';
import Graph from 'react-graph-vis';

function Catalog(props) {
  const [isResultReady, setIsResultReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isDebug = props.isDebug;

  const [catalog, setCatalog] = useState(``);

  const [graph, setGraph] = useState({
    nodes: [{ id: 'roles', label: 'Roles', color: '#0d4c73', level: 1 }],
    edges: [],
  });

  const graphEvents = {
    select: ({ nodes, edges }) => {
      graphByRole(nodes[0]);
    },
    doubleClick: ({ pointer: { canvas } }) => {},
  };

  function graphByRole(role) {
    let counter = 1;
    catalog.learningPaths
      .filter((element) => element.roles.some((e) => e === role))
      .forEach((learningPath) => {
        const id = learningPath.uid;
        const label = `${learningPath.title}, ${learningPath.number_of_children} modules`;
        const color = '#d98c5f';

        const level = counter % 3 === 0 ? 6 : counter % 2 === 0 ? 5 : 7;
        counter++;

        setGraph((graph) => ({
          nodes: [
            ...graph.nodes,
            {
              id: id,
              label: label,
              color: color,
              level: level,
            },
          ],
          edges: [...graph.edges, { from: role, to: id }],
        }));
      });
  }

  function initGraph(catalog) {
    let counter = 1;

    catalog.roles.forEach((role) => {
      let learningPathCount = catalog.learningPaths.filter((element) =>
        element.roles.some((e) => e === role.id)
      ).length;

      const id = role.id;
      const label = `${role.name}, ${learningPathCount} paths`;
      const color = '#35748c';
      const level = counter % 3 === 0 ? 3 : counter % 2 === 0 ? 2 : 4;
      counter++;

      setGraph((graph) => ({
        nodes: [
          ...graph.nodes,
          { id: id, label: label, color: color, level: level },
        ],
        edges: [...graph.edges, { from: 'roles', to: id }],
      }));
    });
  }

  const graphOptions = {
    edges: {
      color: '#d98c5f',
    },
    layout: {
      randomSeed: undefined,
      improvedLayout: true,
      clusterThreshold: 150,
      hierarchical: {
        enabled: true,
        levelSeparation: 150,
        nodeSpacing: 100,
        treeSpacing: 200,
        blockShifting: true,
        edgeMinimization: true,
        parentCentralization: true,
        direction: 'LR', // UD, DU, LR, RL
        sortMethod: 'directed', // hubsize, directed
        shakeTowards: 'leaves', // roots, leaves
      },
    },
  };

  useEffect(() => {
    setIsLoading(true);
    setIsResultReady(false);

    const run = async () => {
      try {
        const res = await fetch('/api/catalog');
        const catalog = await res.json();

        setCatalog(catalog);
        initGraph(catalog);
      } catch (err) {
        if (isDebug) console.error(`Error`, err.message);
      }

      setIsLoading(false);
      setIsResultReady(true);
    };

    run();
  }, []);

  return (
    <>
      {isResultReady ? (
        <>
          <Graph
            graph={graph}
            options={graphOptions}
            events={graphEvents}
            style={{ height: '100%' }}
          />
        </>
      ) : null}
      {isLoading ? (
        <p>
          <small>Loading catalog...</small>
        </p>
      ) : null}
    </>
  );
}

export default Catalog;

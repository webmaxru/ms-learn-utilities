/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import Graph from 'react-graph-vis';
import Select from 'react-select';
import { capitalCase } from 'change-case';

function Catalog(props) {
  const initialGraph = {
    nodes: [{ id: 'roles', label: 'Roles', color: '#0d4c73', level: 1 }],
    edges: [],
  };
  const [isResultReady, setIsResultReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isDebug = props.isDebug;

  const [graph, setGraph] = useState(initialGraph);

  const [productSelectOptions, setProductSelectOptions] = useState([]);

  let filteredRoles,
    filteredModules,
    filteredPaths,
    selectedRoleId,
    selectedModuleId,
    selectedPathId;
  let initialCatalog = useRef(null);

  const customSelectStyles = {
    option: (provided, state) => ({
      ...provided,
      color: state.isSelected ? 'red' : 'blue',
    }),
    container: (provided) => ({
      ...provided,
      width: 300,
    }),
  };

  const openInNewTab = (url) => {
    console.log(url);
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) newWindow.opener = null;
  };

  const graphEvents = {
    click: ({ nodes, edges }) => {
      if (!nodes[0]) {
        return;
      }

      let node = graph.nodes.find((node) => node.id === nodes[0]);

      console.log(node);

      if (node.type === 'role') {
        selectedRoleId = node.id;
        deleteGraphModules();
        deleteGraphPaths();
        addGraphPaths(selectedRoleId);
      } else if (node.type === 'path') {
        selectedPathId = node.id;
        deleteGraphModules();
        addGraphModules(selectedPathId);
      } else if (node.type === 'module') {
        selectedModuleId = node.id;
        openInNewTab(node.url);
      }
    },
    doubleClick: ({ pointer: { canvas } }) => {},
  };

  const deleteGraphPaths = () => {
    let filteredNodes = graph.nodes.filter((node) => node.type !== 'path');

    setGraph({ ...graph, nodes: filteredNodes });
  };

  const deleteGraphModules = () => {
    let filteredNodes = graph.nodes.filter((node) => node.type !== 'module');

    setGraph({ ...graph, nodes: filteredNodes });
  };

  const addGraphPaths = (roleId) => {
    let counter = 1;
    let newNodes = [];
    let newEdges = [];

    initialCatalog.current.learningPaths
      .filter((path) => path.roles.some((e) => e === roleId))
      .forEach((path) => {
        const id = path.uid;
        const label = `${capitalCase(path.title)}, ${
          path.number_of_children
        } modules`;
        const color = '#d98c5f';

        const level = counter % 3 === 0 ? 6 : counter % 2 === 0 ? 5 : 7;
        counter++;

        newNodes.push({
          id: id,
          label: label,
          color: color,
          level: level,
          type: 'path',
          url: path.url,
        });

        newEdges.push({ from: roleId, to: id });
      });

    setGraph((graph) => ({
      nodes: [...graph.nodes, ...newNodes],
      edges: [...graph.edges, ...newEdges],
    }));
  };

  const addGraphModules = (pathId) => {
    let counter = 1;
    let newNodes = [];
    let newEdges = [];

    let path = initialCatalog.current.learningPaths.find(
      (path) => path.uid === pathId
    );

    initialCatalog.current.modules
      .filter((module) => {
        return path.modules.includes(module.uid);
      })
      .forEach((module) => {
        const id = module.uid;
        const label = `${capitalCase(module.title)}, ${
          module.number_of_children
        } units`;
        const color = '#d98c5f';

        const level = counter % 3 === 0 ? 9 : counter % 2 === 0 ? 8 : 10;
        counter++;

        newNodes.push({
          id: id,
          label: label,
          color: color,
          level: level,
          type: 'module',
          url: module.url,
        });

        newEdges.push({ from: pathId, to: id });
      });

    setGraph((graph) => ({
      nodes: [...graph.nodes, ...newNodes],
      edges: [...graph.edges, ...newEdges],
    }));
  };

  const initGraph = (catalog) => {
    filteredPaths = catalog.learningPaths;
    filteredModules = catalog.modules;
    filteredRoles = catalog.roles;
    initialCatalog.current = catalog;

    buildGraph(filteredRoles);
  };

  const buildGraph = (roles, paths, modules) => {
    setGraph(initialGraph);
    addGraphRoles(roles);
  };

  const addGraphRoles = (roles) => {
    let counter = 1;
    let newNodes = [];
    let newEdges = [];

    roles.forEach((role) => {
      let learningPathCount = initialCatalog.current.learningPaths.filter(
        (path) => path.roles.some((e) => e === role.id)
      ).length;

      const id = role.id;
      const label = `${capitalCase(role.name)}, ${learningPathCount} paths`;
      const color = '#35748c';
      const level = counter % 3 === 0 ? 3 : counter % 2 === 0 ? 2 : 4;
      counter++;

      newNodes.push({
        id: id,
        label: label,
        color: color,
        level: level,
        type: 'role',
      });

      newEdges.push({ from: 'roles', to: id });
    });

    setGraph((graph) => ({
      nodes: [...graph.nodes, ...newNodes],
      edges: [...graph.edges, ...newEdges],
    }));
  };

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

  const initProductSelect = (products) => {
    let options = [];

    products.forEach((product) => {
      options.push({
        value: product.id,
        label: capitalCase(product.name),
      });

      product.children.forEach((product) => {
        options.push({
          value: product.id,
          label: `- ${capitalCase(product.name)}`,
        });
      });

      setProductSelectOptions(options);
    });
  };

  useEffect(() => {
    setIsLoading(true);
    setIsResultReady(false);

    const run = async () => {
      try {
        const res = await fetch('catalog.json'); // /api/catalog
        const catalog = await res.json();

        initProductSelect(catalog.products);
        initGraph(catalog);
      } catch (err) {
        if (isDebug) console.error(`Error`, err.message);
      }

      setIsLoading(false);
      setIsResultReady(true);
    };

    run();
  }, []);

  const handleProductSelectChange = (value) => {
    console.log(initialCatalog.current);

    let selectedProducts = value.map((product) => product.value);
    filterModulesByProducts(selectedProducts);
  };

  const filterModulesByProducts = (products) => {
    console.log(initialCatalog.current);

    if (products.length === 0) {
      buildGraph(initialCatalog.current.roles);
      return;
    }
    let filteredModules = initialCatalog.current.modules.filter((module) => {
      return module.products.some((product) => products.includes(product));
    });
    filterPathsByModules(filteredModules);
  };

  const filterPathsByModules = (modules) => {
    if (modules.length === 0) {
      return;
    }

    let moduleIds = modules.map((module) => module.uid);

    let filteredPaths = initialCatalog.current.learningPaths.filter((path) => {
      return path.modules.some((module) => moduleIds.includes(module));
    });

    filterRolesByPaths(filteredPaths);
  };

  const filterRolesByPaths = (paths) => {
    if (paths.length === 0) {
      return;
    }

    let roles = [];

    paths.forEach((path) => {
      roles = [...roles, ...path.roles];
    });

    roles = [...new Set(roles)];

    let filteredRoles = initialCatalog.current.roles.filter((role) => {
      return roles.includes(role.id);
    });

    buildGraph(filteredRoles);
  };

  return (
    <>
      {isResultReady ? (
        <div className="content">
          <div className="filter" style={{ height: '50px' }}>
            Product: 
            <Select
              options={productSelectOptions}
              styles={customSelectStyles}
              isMulti={true}
              isSearchable={true}
              onChange={handleProductSelectChange}
            />
          </div>
          <div className="graph" style={{ height: 'calc(100% - 100px)' }}>
            <Graph
              graph={graph}
              options={graphOptions}
              events={graphEvents}
              style={{ height: '100%' }}
            />
          </div>
        </div>
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

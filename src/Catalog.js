/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import Graph from 'react-graph-vis';
import Select from 'react-select';
import 'vis-network/styles/vis-network.min.css';
import './Catalog.css';

function Catalog(props) {
  const initialGraph = {
    nodes: [
      {
        id: 'roles',
        label: 'Profession',
        color: {
          background: '#A5D5D8',
        },
        font: {
          color: '#333333',
        },
        level: 1,
        borderWidth: 0,
        widthConstraint: {
          minimum: 150,
          maximum: 150,
        },
      },
    ],
    edges: [],
  };
  const [isResultReady, setIsResultReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isDebug = props.isDebug;

  const [graph, setGraph] = useState(initialGraph);

  const [productSelectOptions, setProductSelectOptions] = useState([]);
  const [levelSelectOptions, setLevelSelectOptions] = useState([]);

  const maxElementsPerLevel = 10;

  let initialCatalog = useRef({});
  let filteredPaths = useRef([]);
  let filteredModules = useRef([]);
  let filteredRoles = useRef([]);

  let selectedProducts = useRef([]);
  let selectedLevels = useRef([]);
  let keyword = useRef('');

  let currentColCount = useRef(1);

  let baseRoleLevel = useRef(2);
  let basePathLevel = useRef(0);
  let baseModuleLevel = useRef(0);

  const minutesToHms = (d) => {
    d = Number(d);
    var h = Math.floor(d / 60);
    var m = Math.floor((d % 60) / 1);

    var hDisplay = h > 0 ? h + 'h ' : '';
    var mDisplay = m > 0 ? m + 'm' : '';
    return hDisplay + mDisplay;
  }

  const calcLevel = (baseLevel, counter, total) => {
    if (total <= maxElementsPerLevel) {
      currentColCount.current = 1;
      return baseLevel;
    }

    let colCount = Math.ceil(total / maxElementsPerLevel);
    currentColCount.current = colCount;

    return baseLevel + (counter % colCount);
  };

  const customSelectStyles = {
    option: (provided, state) => ({
      ...provided,
      color: state.isSelected ? '#00968D' : '#333333',
    }),
    container: (provided) => ({
      ...provided,
      width: 250,
    }),
  };

  const openInNewTab = (url) => {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) newWindow.opener = null;
  };

  const graphEvents = {
    click: ({ nodes, edges }) => {
      if (!nodes[0]) {
        return;
      }

      let node = graph.nodes.find((node) => node.id === nodes[0]);

      if (node.type === 'role') {
        addGraphPaths(node.id);
      } else if (node.type === 'path') {
        addGraphModules(node.id);
      } else if (node.type === 'module') {
        openInNewTab(node.meta.url);
      }
    },
    doubleClick: ({ pointer: { canvas } }) => {},
  };

  const deleteGraphElement = (types) => {
    let filteredNodes = graph.nodes.filter((node) => {
      return !types.includes(node.type);
    });
    let filteredEdges = graph.edges.filter((edge) => {
      return !types.includes(edge.type);
    });
    return {
      nodes: filteredNodes,
      edges: filteredEdges,
    };
  };

  const addGraphModules = (pathId) => {
    let counter = 1;
    let newNodes = [];
    let newEdges = [];

    let path = initialCatalog.current.learningPaths.find(
      (path) => path.uid === pathId
    );

    let clearedGraph = deleteGraphElement(['module']);

    let modules = filteredModules.current.filter((module) => {
      return path.modules.includes(module.uid);
    });

    modules.forEach((module) => {
      counter++;

      newNodes.push({
        id: module.uid,
        color: {
          background: '#EEA737',
        },
        level: calcLevel(baseModuleLevel.current, counter, modules.length),
        type: 'module',
        meta: module,
        label: `${module.title}`,
        title: htmlTitle(
          `Click to go to the module (${module.number_of_children} units), learning time: ${minutesToHms(module.duration_in_minutes)}`
        ),
      });

      newEdges.push({ from: pathId, to: module.uid, type: 'module' });
    });

    setGraph(() => ({
      nodes: [...clearedGraph.nodes, ...newNodes],
      edges: [...clearedGraph.edges, ...newEdges],
    }));
  };

  const addGraphPaths = (roleId) => {
    let counter = 1;
    let newNodes = [];
    let newEdges = [];

    let clearedGraph = deleteGraphElement(['module', 'path']);

    let paths = filteredPaths.current.filter((path) =>
      path.roles.some((e) => e === roleId)
    );

    paths.forEach((path) => {
      let moduleCount = filteredModules.current.filter((module) => {
        return path.modules.includes(module.uid);
      }).length;

      counter++;

      newNodes.push({
        id: path.uid,
        label: `${path.title}`,
        title: htmlTitle(`Click to see ${moduleCount} modules, learning time: ${minutesToHms(path.duration_in_minutes)}`),
        meta: path,
        color: {
          background: '#E24F6D',
        },
        level: calcLevel(basePathLevel.current, counter, paths.length),
        type: 'path',
        url: path.url,
      });

      newEdges.push({ from: roleId, to: path.uid, type: 'path' });
    });

    baseModuleLevel.current = basePathLevel.current + currentColCount.current;

    setGraph(() => ({
      nodes: [...clearedGraph.nodes, ...newNodes],
      edges: [...clearedGraph.edges, ...newEdges],
    }));
  };

  const addGraphRoles = (roles) => {
    let counter = 1;
    let newNodes = [];
    let newEdges = [];

    roles.forEach((role) => {
      let learningPathCount = filteredPaths.current.filter((path) =>
        path.roles.some((e) => e === role.id)
      ).length;

      counter++;

      newNodes.push({
        id: role.id,
        label: htmlLabel(`${role.name}`),
        title: htmlTitle(`Click to see ${learningPathCount} learning paths`),
        level: calcLevel(baseRoleLevel.current, counter, roles.length),
        type: 'role',
      });

      newEdges.push({ from: 'roles', to: role.id, type: 'role' });
    });

    basePathLevel.current = baseRoleLevel.current + currentColCount.current;

    setGraph((graph) => ({
      nodes: [...graph.nodes, ...newNodes],
      edges: [...graph.edges, ...newEdges],
    }));
  };

  const initGraph = (catalog) => {
    initialCatalog.current = catalog;
    filteredPaths.current = initialCatalog.current.learningPaths;
    filteredModules.current = initialCatalog.current.modules;
    filteredRoles.current = initialCatalog.current.roles;

    buildGraph(catalog.roles);
  };

  const buildGraph = (roles) => {
    setGraph(initialGraph); // For local hot reload
    addGraphRoles(roles);
  };

  const htmlTitle = (html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container;
  };

  const htmlLabel = (html) => {
    return `<b>${html}</b>`;
  };

  const graphOptions = {
    edges: {
      color: '#ffffff',
    },
    nodes: {
      borderWidth: 0,
      labelHighlightBold: false,
      widthConstraint: {
        minimum: 350,
        maximum: 350,
      },
      color: {
        background: '#00968D',
        hover: {
          background: '#F2A391',
        },
        highlight: {
          background: '#F2A391',
        },
      },
      font: {
        color: '#ffffff',
        multi: 'html',
        size: 20,
      },
      margin: {
        top: 10,
        bottom: 10,
        left: 20,
        right: 20,
      },
      shape: 'box',
      shapeProperties: {
        borderRadius: 5,
      },
      scaling: {
        min: 10,
        max: 150,
        label: {
          enabled: true,
          min: 14,
          max: 30,
        },
      },
    },
    layout: {
      randomSeed: undefined,
      improvedLayout: true,
      clusterThreshold: 150,
      hierarchical: {
        enabled: true,
        levelSeparation: 450,
        nodeSpacing: 100,
        treeSpacing: 100,
        blockShifting: true,
        edgeMinimization: true,
        parentCentralization: true,
        direction: 'LR', // UD, DU, LR, RL
        sortMethod: 'hubsize', // hubsize, directed
        shakeTowards: 'leaves', // roots, leaves
      },
    },

    interaction: {
      dragNodes: true,
      dragView: true,
      hideEdgesOnDrag: false,
      hideEdgesOnZoom: false,
      hideNodesOnDrag: false,
      hover: true,
      hoverConnectedEdges: true,
      keyboard: {
        enabled: false,
        speed: { x: 10, y: 10, zoom: 0.02 },
        bindToWindow: true,
        autoFocus: true,
      },
      multiselect: false,
      navigationButtons: false,
      selectable: true,
      selectConnectedEdges: true,
      tooltipDelay: 300,
      zoomSpeed: 1,
      zoomView: true,
    },
  };

  const initProductSelect = (products) => {
    let options = [];

    products.forEach((product) => {
      options.push({
        value: product.id,
        label: product.name,
      });

      product.children.forEach((product) => {
        options.push({
          value: product.id,
          label: `- ${product.name}`,
        });
      });

      setProductSelectOptions(options);
    });
  };

  const initLevelSelect = (levels) => {
    let options = [];

    levels.forEach((level) => {
      options.push({
        value: level.id,
        label: level.name,
      });

      setLevelSelectOptions(options);
    });
  };

  useEffect(() => {
    setIsLoading(true);
    setIsResultReady(false);

    const run = async () => {
      try {
        const res = await fetch('/api/catalog'); // /api/catalog OR catalog.json
        const catalog = await res.json();

        initProductSelect(catalog.products);
        initLevelSelect(catalog.levels);
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
    selectedProducts.current = value.map((product) => product.value);
    filterModulesByProductsLevelsKeyword(
      selectedProducts.current,
      selectedLevels.current,
      keyword.current
    );
  };

  const handleLevelSelectChange = (value) => {
    selectedLevels.current = value.map((level) => level.value);
    filterModulesByProductsLevelsKeyword(
      selectedProducts.current,
      selectedLevels.current,
      keyword.current
    );
  };

  const handleKeywordInputChange = (event) => {
    keyword.current = event.target.value;
    filterModulesByProductsLevelsKeyword(
      selectedProducts.current,
      selectedLevels.current,
      keyword.current
    );
  };

  const filterModulesByProductsLevelsKeyword = (products, levels, keyword) => {
    console.log(products, levels, keyword);
    if (products.length === 0 && levels.length === 0 && keyword === '') {
      filteredPaths.current = initialCatalog.current.learningPaths;
      filteredModules.current = initialCatalog.current.modules;
      filteredRoles.current = initialCatalog.current.roles;
      buildGraph(initialCatalog.current.roles);
      return;
    }
    filteredModules.current = initialCatalog.current.modules.filter(
      (module) => {
        let isProductFound =
          products.length === 0
            ? true
            : module.products.some((product) => products.includes(product));
        let isLevelFound =
          levels.length === 0
            ? true
            : module.levels.some((level) => levels.includes(level));
        let isKeywordFound =
          keyword === ''
            ? true
            : module.title.toUpperCase().includes(keyword.toUpperCase()) ||
              module.summary.toUpperCase().includes(keyword.toUpperCase());

        return isProductFound && isLevelFound && isKeywordFound;
      }
    );

    console.log(filteredModules.current.length);

    filterPathsByModules(filteredModules.current);
  };

  const filterPathsByModules = (modules) => {
    if (modules.length === 0) {
      filteredPaths.current = [];
      filterRolesByPaths(filteredPaths.current);
      return;
    }

    let moduleIds = modules.map((module) => module.uid);

    filteredPaths.current = initialCatalog.current.learningPaths.filter(
      (path) => {
        return path.modules.some((module) => moduleIds.includes(module));
      }
    );

    filterRolesByPaths(filteredPaths.current);
  };

  const filterRolesByPaths = (paths) => {
    if (paths.length === 0) {
      filteredRoles.current = [];
      buildGraph(filteredRoles.current);
      return;
    }

    let roles = [];

    paths.forEach((path) => {
      roles = [...roles, ...path.roles];
    });

    roles = [...new Set(roles)];

    filteredRoles.current = initialCatalog.current.roles.filter((role) => {
      return roles.includes(role.id);
    });

    buildGraph(filteredRoles.current);
  };

  return (
    <>
      {isResultReady ? (
        <div className="catalog">
          <div className="filter">
            <div>
              Product:
              <Select
                options={productSelectOptions}
                styles={customSelectStyles}
                isMulti={true}
                isSearchable={true}
                onChange={handleProductSelectChange}
                placeholder="[ All ]"
              />
            </div>
            <div>
              Level:
              <Select
                options={levelSelectOptions}
                styles={customSelectStyles}
                isMulti={true}
                isSearchable={true}
                onChange={handleLevelSelectChange}
                placeholder="[ All ]"
              />
            </div>
            <div>
              Module keyword:
              <input
                type="text"
                value={keyword.current}
                onChange={handleKeywordInputChange}
                className="keyword"
              />
            </div>
          </div>
          <div className="graph">
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

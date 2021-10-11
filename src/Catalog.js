/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import Graph from 'react-graph-vis';
import Select from 'react-select';
import 'vis-network/styles/vis-network.min.css';
import './Catalog.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Catalog(props) {
  const ROOT_NODE_ID = 'roles';
  const MAX_ELEMENTS_PER_LEVEL = 12;

  const FOCUS_PARAMS = {
    locked: false,
    animation: {
      duration: 1000,
      easingFunction: 'easeInOutQuad',
    },
  };

  const htmlHint = (html) => {
    const container = document.createElement('div');
    container.className = 'hint';
    container.innerHTML = html;
    return container;
  };

  const htmlLabel = (html) => {
    return `<b>${html}</b>`;
  };

  const initialGraph = {
    nodes: [
      {
        id: ROOT_NODE_ID,
        label: `${htmlLabel('Role')}`,
        color: {
          background: '#A5D5D8',
        },
        font: {
          color: '#333333',
        },
        level: 1,
        borderWidth: 0,
        widthConstraint: {
          minimum: 100,
          maximum: 100,
        },
      },
    ],
    edges: [],
  };
  const [isResultReady, setIsResultReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isDebug = props.isDebug;

  const CATALOG_URL = isDebug
    ? 'http://localhost:7071/api/catalog'
    : '/api/catalog';

  const [graph, setGraph] = useState(initialGraph);

  const [productSelectOptions, setProductSelectOptions] = useState([]);
  const [levelSelectOptions, setLevelSelectOptions] = useState([]);
  const [network, setNetwork] = useState({});

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
  };

  const buildRoleList = (roles) => {
    return roles
      .map((role) => {
        return initialCatalog.current.roles.find((r) => {
          return r.id === role;
        }).name;
      })
      .join(', ');
  };

  const buildLevelList = (levels) => {
    return levels
      .map((level) => {
        return initialCatalog.current.levels.find((l) => {
          return l.id === level;
        }).name;
      })
      .join(', ');
  };

  const buildProductList = (products) => {
    const deepSearch = (object, key, predicate) => {
      if (object.hasOwnProperty(key) && predicate(key, object[key]) === true)
        return object;

      for (let i = 0; i < Object.keys(object).length; i++) {
        const nextObject = object[Object.keys(object)[i]];
        if (nextObject && typeof nextObject === 'object') {
          let o = deepSearch(nextObject, key, predicate);
          if (o != null) return o;
        }
      }
      return null;
    };

    return products
      .map((product) => {
        return deepSearch(
          initialCatalog.current.products,
          'id',
          (k, v) => v === product
        ).name;
      })
      .join(', ');
  };

  const calcLevel = (baseLevel, counter, total) => {
    if (total <= MAX_ELEMENTS_PER_LEVEL) {
      currentColCount.current = 1;
      return baseLevel;
    }

    let colCount = Math.ceil(total / MAX_ELEMENTS_PER_LEVEL);
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
      width: 268,
    }),
  };

  const openInNewTab = (url) => {
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('target', '_blank');
    a.click();

    /*     const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) newWindow.opener = null; */
  };

  const graphEvents = {
    click: ({ nodes }) => {
      if (!nodes[0]) {
        return;
      }

      let node = graph.nodes.find((node) => node.id === nodes[0]);

      if (node.type === 'role') {
        addGraphPaths(node.id);
      } else if (node.type === 'path') {
        addGraphModules(node.id);
      } else if (node.type === 'module' || node.type === 'moduleWithoutPath') {
        openInNewTab(node.meta.url);
      }
    },
    doubleClick: ({ nodes }) => {
      if (!nodes[0]) {
        return;
      }

      network.focus(nodes[0], FOCUS_PARAMS);
    },
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

  const htmlHintModule = (module) => {
    return htmlHint(
      `<p align="center"><img src="${
        module.icon_url
      }" alt="" class="hint-icon" /></p>
      <p><strong>${module.title}</strong></p>
      <p>${module.summary}</p>
      <p>Learning time: <strong>${minutesToHms(
        module.duration_in_minutes
      )}</strong></p>
      <p>Products: <strong>${buildProductList(module.products)}</strong></p>
      <p>Levels: <strong>${buildLevelList(module.levels)}</strong></p>
      <p>Roles: <strong>${buildRoleList(module.roles)}</strong></p>
      <p>Units: <strong>${module.number_of_children}</strong></p>
      <p>This is a <span class="label-module">learning module</span>. Click to see its details on MS Learn</p>`
    );
  };

  const addGraphModules = (pathId) => {
    let counter = 0;
    let newNodes = [];
    let newEdges = [];
    let lastNodeId = null;

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
        label: `${htmlLabel(module.title)}`,
        title: htmlHintModule(module),
      });

      newEdges.push({ from: pathId, to: module.uid, type: 'module' });

      lastNodeId = module.uid;
    });

    setGraph(() => ({
      nodes: [...clearedGraph.nodes, ...newNodes],
      edges: [...clearedGraph.edges, ...newEdges],
    }));

    network.focus(lastNodeId, FOCUS_PARAMS);
  };

  const addGraphPaths = (roleId) => {
    let counter = 0;
    let newNodes = [];
    let newEdges = [];
    let lastNodeId = null;

    let clearedGraph = deleteGraphElement([
      'module',
      'path',
      'moduleWithoutPath',
    ]);

    let paths = filteredPaths.current.filter((path) =>
      path.roles.some((e) => e === roleId)
    );

    let modules = filteredModules.current.filter((module) => {
      return module.roles.some((e) => e === roleId) && module.withoutPath;
    });

    paths.forEach((path) => {
      let moduleCount = filteredModules.current.filter((module) => {
        return path.modules.includes(module.uid);
      }).length;

      counter++;

      newNodes.push({
        id: path.uid,
        label: `${htmlLabel(path.title)}`,
        title: htmlHint(
          `<p align="center"><img src="${
            path.icon_url
          }" alt="" class="hint-icon" /></p>
          <p><strong>${path.title}</strong></p>
          <p>${path.summary}</p>
          <p>Learning time: <strong>${minutesToHms(
            path.duration_in_minutes
          )}</strong></p>
          <p>Products: <strong>${buildProductList(path.products)}</strong></p>
          <p>Levels: <strong>${buildLevelList(path.levels)}</strong></p>
          <p>Roles: <strong>${buildRoleList(path.roles)}</strong></p>
          <p>This is a <span class="label-path">learning path</span>. Click to see <span class="label-module">${moduleCount} included modules</span></p>`
        ),
        meta: path,
        color: {
          background: '#E24F6D',
        },
        level: calcLevel(
          basePathLevel.current,
          counter,
          paths.length + modules.length
        ),
        type: 'path',
      });

      newEdges.push({ from: roleId, to: path.uid, type: 'path' });

      lastNodeId = path.uid;
    });

    modules.forEach((module) => {
      counter++;

      newNodes.push({
        id: module.uid,
        color: {
          background: '#EEA737',
        },
        level: calcLevel(
          basePathLevel.current,
          counter,
          paths.length + modules.length
        ),
        type: 'moduleWithoutPath',
        meta: module,
        label: `${htmlLabel(module.title)}`,
        title: htmlHintModule(module),
      });

      newEdges.push({
        from: roleId,
        to: module.uid,
        type: 'moduleWithoutPath',
      });

      lastNodeId = module.uid;
    });

    baseModuleLevel.current = basePathLevel.current + currentColCount.current;

    setGraph(() => ({
      nodes: [...clearedGraph.nodes, ...newNodes],
      edges: [...clearedGraph.edges, ...newEdges],
    }));

    network.focus(lastNodeId, FOCUS_PARAMS);
  };

  const addGraphRoles = (roles) => {
    let counter = 0;
    let newNodes = [];
    let newEdges = [];

    roles.forEach((role) => {
      let learningPathCount = filteredPaths.current.filter((path) =>
        path.roles.some((e) => e === role.id)
      ).length;

      let moduleCount = filteredModules.current.filter((module) => {
        return module.roles.some((e) => e === role.id) && module.withoutPath;
      }).length;

      counter++;

      newNodes.push({
        id: role.id,
        label: htmlLabel(`${role.name}`),
        title: htmlHint(
          `Click to see <span class="label-path">${learningPathCount} learning paths</span> and <span class="label-module">${moduleCount} modules</span> for this role`
        ),
        level: calcLevel(baseRoleLevel.current, counter, roles.length),
        type: 'role',
      });

      newEdges.push({ from: ROOT_NODE_ID, to: role.id, type: 'role' });
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
    if (network && network.focus) {
      network.focus(ROOT_NODE_ID, FOCUS_PARAMS);
      network.fit();
    }
  };

  const graphOptions = {
    edges: {
      color: '#cccccc',
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
        face: 'Saira',
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
        sortMethod: 'directed', // hubsize, directed
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
      multiselect: true,
      navigationButtons: true,
      selectable: true,
      selectConnectedEdges: true,
      tooltipDelay: 300,
      zoomSpeed: 2,
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
        const res = await fetch(CATALOG_URL);
        let catalog = await res.json();

        initProductSelect(catalog.products);
        initLevelSelect(catalog.levels);

        catalog = { ...catalog, modules: markModuleWithoutPath(catalog) };

        initGraph(catalog);

        setIsLoading(false);
        setIsResultReady(true);
      } catch (err) {
        toast.error(
          'No network connection. Refresh page to use locally stored data.'
        );
        console.error(`Error`, err.message);
      }
    };

    run();
  }, []);

  const markModuleWithoutPath = (catalog) => {
    return catalog.modules.map((module) => {
      return catalog.learningPaths.some((path) =>
        path.modules.includes(module.uid)
      )
        ? module
        : { ...module, withoutPath: true };
    });
  };

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
    filterPathsByModules(filteredModules.current);
  };

  const filterPathsByModules = (modules) => {
    if (modules.length === 0) {
      filteredPaths.current = [];
      filterRolesByPathsModules(filteredPaths.current, filteredModules.current);
      return;
    }

    let moduleIds = modules.map((module) => module.uid);

    filteredPaths.current = initialCatalog.current.learningPaths.filter(
      (path) => {
        return path.modules.some((module) => moduleIds.includes(module));
      }
    );

    filterRolesByPathsModules(filteredPaths.current, filteredModules.current);
  };

  const filterRolesByPathsModules = (paths, modules) => {
    let roles = [];

    paths.forEach((path) => {
      roles = [...roles, ...path.roles];
    });

    modules
      .filter((module) => module.withoutPath)
      .forEach((module) => {
        roles = [...roles, ...module.roles];
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
            <div className="keyword">
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
              style={{ height: '98%' }}
              getNetwork={(network) => {
                setNetwork(network);
              }}
            />
          </div>
        </div>
      ) : null}
      {isLoading ? (
        <p>
          <small>Loading catalog...</small>
        </p>
      ) : null}
      <ToastContainer />
    </>
  );
}

export default Catalog;

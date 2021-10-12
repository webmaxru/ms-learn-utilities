/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import Graph from 'react-graph-vis';
import Select from 'react-select';
import 'vis-network/styles/vis-network.min.css';
import './Catalog.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useStateWithPromise } from '@kirekov/great-hooks';
import {
  ROOT_NODE_ID,
  MAX_ELEMENTS_PER_LEVEL,
  FOCUS_PARAMS,
  CUSTOM_SELECT_STYLES,
  INITIAL_GRAPH,
  GRAPH_OPTIONS,
  TRACKING_TAG,
} from './settings.js';

function Catalog(props) {
  const isDebug = props.isDebug;

  const CATALOG_URL = isDebug
    ? 'http://localhost:7071/api/catalog'
    : '/api/catalog';

  let query = new URLSearchParams(window.location.search);
  // ?debug=true&levels=advanced,beginner&products=azure-app-service&keywords=static&role=developer&path=learn.azure-static-web-apps

  let selectedProducts = useRef([]);
  let selectedLevels = useRef([]);
  let keyword = useRef('');

  let activeRole = useRef('');
  let activePath = useRef('');

  const htmlHint = (html) => {
    const container = document.createElement('div');
    container.className = 'hint';
    container.innerHTML = html;
    return container;
  };

  const htmlLabel = (html) => {
    return `<b>${html}</b>`;
  };

  const [isResultReady, setIsResultReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [graph, setGraph] = useStateWithPromise(INITIAL_GRAPH);

  const [productSelectOptions, setProductSelectOptions] = useState([]);
  const [levelSelectOptions, setLevelSelectOptions] = useState([]);
  const [network, setNetwork] = useState({});

  let initialCatalog = useRef({});
  let filteredPaths = useRef([]);
  let filteredModules = useRef([]);
  let filteredRoles = useRef([]);

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

  const buildExternalUrl = (url) => {
    return `${url.split('?')[0]}?${TRACKING_TAG}`;
  };

  const openInNewTab = (url) => {
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('target', '_blank');
    a.click();
  };

  const expandRole = (graph, roleId) => {
    addGraphPaths(graph, roleId, false);
  };

  const expandPath = (graph, pathId) => {
    addGraphModules(graph, pathId, false);
  };

  const graphEvents = {
    click: ({ nodes }) => {
      if (!nodes[0]) {
        return;
      }

      let node = graph.nodes.find((node) => node.id === nodes[0]);

      if (node.type === 'role') {
        activeRole.current = node.id;
        addGraphPaths(graph, node.id, true);
      } else if (node.type === 'path') {
        activePath.current = node.id;
        addGraphModules(graph, node.id, true);
      } else if (node.type === 'module' || node.type === 'moduleWithoutPath') {
        openInNewTab(buildExternalUrl(node.meta.url));
      }
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

  const addGraphModules = (graph, pathId, clearGraph = false) => {
    let counter = 0;
    let newNodes = [];
    let newEdges = [];
    let lastNodeId = null;

    let path = initialCatalog.current.learningPaths.find(
      (path) => path.uid === pathId
    );

    let clearedGraph = clearGraph ? deleteGraphElement(['module']) : graph;

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

    //if (network && network.focus) network.focus(lastNodeId, FOCUS_PARAMS);
  };

  const addGraphPaths = (graph, roleId, clearGraph = false) => {
    let counter = 0;
    let newNodes = [];
    let newEdges = [];
    let lastNodeId = null;

    let clearedGraph = clearGraph
      ? deleteGraphElement(['module', 'path', 'moduleWithoutPath'])
      : graph;

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
    })).then((graph) => {
      if (activePath.current) {
        expandPath(graph, activePath.current);
      }
    });

    //if (network && network.focus) network.focus(lastNodeId, FOCUS_PARAMS);
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
    })).then((graph) => {
      if (activeRole.current) {
        expandRole(graph, activeRole.current);
      }
    });
  };

  const buildGraph = (roles) => {
    setGraph(INITIAL_GRAPH); // For local hot reload
    addGraphRoles(roles);

    if (network && network.focus) {
      //network.focus(ROOT_NODE_ID, FOCUS_PARAMS);
      //network.fit();
    }
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

  const buildLevelSelectDefaultOptions = (levels) => {
    return levels.map((level) => {
      let foundLevel = initialCatalog.current.levels.find((e) => {
        return e.id === level;
      });

      return {
        value: foundLevel.id,
        label: foundLevel.name,
      };
    });
  };

  const buildProductSelectDefaultOptions = (products) => {
    return products.map((product) => {
      let foundElement = deepSearch(
        initialCatalog.current.products,
        'id',
        (k, v) => v === product
      );

      return {
        value: foundElement.id,
        label: foundElement.name,
      };
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

        initialCatalog.current = catalog;
        filteredPaths.current = initialCatalog.current.learningPaths;
        filteredModules.current = initialCatalog.current.modules;
        filteredRoles.current = initialCatalog.current.roles;

        if (query.get('sharedUrl')) {
          query = new URLSearchParams(query.get('sharedUrl'));
        }

        selectedLevels.current = buildLevelSelectDefaultOptions(
          query.get('levels') ? query.get('levels').trim().split(',') : []
        );
        selectedProducts.current = buildProductSelectDefaultOptions(
          query.get('products') ? query.get('products').trim().split(',') : []
        );
        keyword.current = query.get('keywords')
          ? query.get('keywords').trim()
          : '';

        activeRole.current = query.get('role') ? query.get('role').trim() : '';
        activePath.current = query.get('path') ? query.get('path').trim() : '';

        applyFilter(
          selectedProducts.current,
          selectedLevels.current,
          keyword.current
        );

        setIsLoading(false);
        setIsResultReady(true);
      } catch (err) {
        toast.error(
          'No network connection. Refresh page to use locally stored data.'
        );
        console.error(`[Error]`, err.message);
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
    selectedProducts.current = value;
    applyFilter(
      selectedProducts.current,
      selectedLevels.current,
      keyword.current
    );
  };

  const handleLevelSelectChange = (value) => {
    selectedLevels.current = value;
    applyFilter(
      selectedProducts.current,
      selectedLevels.current,
      keyword.current
    );
  };

  const handleKeywordInputChange = (event) => {
    keyword.current = event.target.value;

    //if (keyword.current.length === 1) return;

    applyFilter(
      selectedProducts.current,
      selectedLevels.current,
      keyword.current
    );
  };

  const escapeRegExp = (string) => {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
  };

  const findKeyword = (target, keywords) => {
    target = escapeRegExp(target.toUpperCase());
    return keywords.every((keyword) =>
      new RegExp('\\b' + keyword + '\\b').test(target)
    ); //target.includes(keyword)
  };

  const applyFilter = (products, levels, keyword) => {
    if (products.length === 0 && levels.length === 0 && keyword === '') {
      filteredPaths.current = initialCatalog.current.learningPaths;
      filteredModules.current = initialCatalog.current.modules;
      filteredRoles.current = initialCatalog.current.roles;
      buildGraph(initialCatalog.current.roles);
      return;
    }

    levels = levels.map((level) => level.value);
    products = products.map((product) => product.value);

    let keywords = keyword
      .trim()
      .split(' ')
      .map((keyword) => keyword.toUpperCase());

    filterModules(products, levels, keywords);
    filterPaths(products, levels, keywords);
    filterRoles(filteredPaths.current, filteredModules.current);

    buildGraph(filteredRoles.current);
  };

  const filterModules = (products, levels, keywords) => {
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
          keywords === []
            ? true
            : findKeyword(module.title, keywords) ||
              findKeyword(module.summary, keywords);

        return isProductFound && isLevelFound && isKeywordFound;
      }
    );
  };

  const filterPaths = (products, levels, keywords) => {
    let filteredModuleIds = filteredModules.current.map((module) => module.uid);

    let foundModulePaths = initialCatalog.current.learningPaths.filter(
      (path) => {
        return path.modules.some((module) =>
          filteredModuleIds.includes(module)
        );
      }
    );

    let foundPaths = initialCatalog.current.learningPaths.filter((path) => {
      let isProductFound =
        products.length === 0
          ? true
          : path.products.some((product) => products.includes(product));
      let isLevelFound =
        levels.length === 0
          ? true
          : path.levels.some((level) => levels.includes(level));
      let isKeywordFound =
        keywords === []
          ? true
          : findKeyword(path.title, keywords) ||
            findKeyword(path.summary, keywords);

      return isProductFound && isLevelFound && isKeywordFound;
    });

    filteredPaths.current = [...new Set(foundModulePaths.concat(foundPaths))];
  };

  const filterRoles = (paths, modules) => {
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
  };

  const buildUrl = (source) => {
    let params = {
      source: source,
    };

    if (selectedLevels.current.length > 0)
      params['levels'] = selectedLevels.current.map((e) => e.value).join(',');
    if (selectedProducts.current.length > 0)
      params['products'] = selectedProducts.current
        .map((e) => e.value)
        .join(',');
    if (keyword.current !== '') params['keywords'] = keyword.current;
    if (activeRole.current !== '') params['role'] = activeRole.current;
    if (activePath.current !== '') params['path'] = activePath.current;

    const urlParams = new URLSearchParams(params);

    return `${window.location.origin}/?${urlParams.toString()}`;
  };

  const copyUrl = () => {
    let url = buildUrl('copy');
    let textArea = document.createElement('textarea');
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
    toast.success(`The link was copied to clipboard.`);
  };

  const shareUrl = () => {
    let url = buildUrl('share');

    if (navigator.share) {
      navigator
        .share({
          title: 'MS Learn Navigator - A Visual Way to Navigate MS Learn',
          text: 'Please, have a look at the learning materials I found on MS Learn',
          url: url,
        })
        .catch((err) => console.error(`[Error]`, err.message));
    } else {
      toast.warning(
        `Your browser doesn't support sharing. Please share the link manually.`
      );
      copyUrl();
    }
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
                styles={CUSTOM_SELECT_STYLES}
                isMulti={true}
                isSearchable={true}
                onChange={handleProductSelectChange}
                placeholder="[ All ]"
                value={selectedProducts.current}
              />
            </div>
            <div>
              Level:
              <Select
                options={levelSelectOptions}
                styles={CUSTOM_SELECT_STYLES}
                isMulti={true}
                isSearchable={true}
                onChange={handleLevelSelectChange}
                placeholder="[ All ]"
                value={selectedLevels.current}
              />
            </div>
            <div className="keyword">
              Keywords:
              <br />
              <input
                type="text"
                value={keyword.current}
                onChange={handleKeywordInputChange}
                className="keyword"
              />
            </div>
            <div className="share">
              Share your findings:
              <br />
              <button onClick={shareUrl}>Post on social</button>
              &nbsp;
              <button onClick={copyUrl}>Copy URL</button>
            </div>
          </div>
          <div className="graph">
            <Graph
              graph={graph}
              options={GRAPH_OPTIONS}
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

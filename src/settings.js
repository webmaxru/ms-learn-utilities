export const ROOT_NODE_ID = 'roles';
export const MAX_ELEMENTS_PER_LEVEL = 12;
export const FOCUS_PARAMS = {
  locked: false,
  animation: {
    duration: 1000,
    easingFunction: 'easeInOutQuad',
  },
};

export const INITIAL_GRAPH = {
  nodes: [
    {
      id: ROOT_NODE_ID,
      label: `<b>Role</b>`,
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

export const CUSTOM_SELECT_STYLES = {
  option: (provided, state) => ({
    ...provided,
    color: state.isSelected ? '#00968D' : '#333333',
  }),
  container: (provided) => ({
    ...provided,
    width: 240,
  }),
};

export const GRAPH_OPTIONS = {
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

export const TRACKING_TAG = 'ocid=aid3042057';

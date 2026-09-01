const createAuditState = () => ({
  animationReferences: [],
  cssRules: [],
  customProperties: [],
  customRootLocations: new Map(),
  customRoots: new Set(),
  declarations: [],
  dynamicClassPrefixes: new Set(),
  errors: [],
  keyframeRoots: new Set(),
  keyframes: [],
  runtimeProvided: new Set(),
  staticClasses: new Set(),
  staticIds: new Set(),
  unverified: [],
});

const locationOf = (source, node) => ({
  file: source.path,
  line: (source.lineOffset ?? 1) + (node.source?.start.line ?? 1) - 1,
});

export { createAuditState, locationOf };

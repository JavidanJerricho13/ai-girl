const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Pin react and react-native to mobile's own node_modules.
// The monorepo root has React 18 (for the Next.js web app) which npm
// hoists to the root, and Metro can pick it up causing two React copies.
// Explicitly mapping each import prevents the "Invalid hook call" /
// "Cannot read property 'useEffect' of null" crash.
const reactDir = path.resolve(projectRoot, 'node_modules/react');
const reactNativeDir = path.resolve(projectRoot, 'node_modules/react-native');

const PINNED = {
  'react':                  path.resolve(reactDir, 'index.js'),
  'react/jsx-runtime':      path.resolve(reactDir, 'jsx-runtime.js'),
  'react/jsx-dev-runtime':  path.resolve(reactDir, 'jsx-dev-runtime.js'),
  'react-native':           path.resolve(reactNativeDir, 'index.js'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (PINNED[moduleName]) {
    return { filePath: PINNED[moduleName], type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

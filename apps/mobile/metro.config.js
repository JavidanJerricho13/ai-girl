const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root so Metro can find hoisted packages
config.watchFolders = [monorepoRoot];

// Resolve modules from both local and root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Pin react and react-native to mobile's own node_modules
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

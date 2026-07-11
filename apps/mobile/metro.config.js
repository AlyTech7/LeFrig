const { getDefaultConfig } = require('expo/metro-config');

/** Expo SDK 52+ detecta el monorepo automáticamente — no tocar watchFolders/nodeModulesPaths */
const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  /\.next\/.*/,
  /apps\/web\/\.next\/.*/,
  /apps\/admin\/\.next\/.*/,
];

module.exports = config;

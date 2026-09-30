const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'wasm' to asset extensions so Metro can resolve WebAssembly files for web
config.resolver.assetExts.push('wasm');

module.exports = config;
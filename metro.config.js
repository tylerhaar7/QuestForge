const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const threePackagePath = path.resolve(__dirname, "node_modules/three");

// Redirect Three.js imports to WebGPU build for react-native-wgpu
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "three" || moduleName === "three/webgpu") {
    return {
      filePath: path.resolve(threePackagePath, "build/three.webgpu.js"),
      type: "sourceFile",
    };
  }
  if (moduleName === "three/tsl") {
    return {
      filePath: path.resolve(threePackagePath, "build/three.tsl.js"),
      type: "sourceFile",
    };
  }
  if (moduleName.startsWith("three/addons/")) {
    return {
      filePath: path.resolve(
        threePackagePath,
        "examples/jsm/" + moduleName.replace("three/addons/", "") + ".js"
      ),
      type: "sourceFile",
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Add 3D asset extensions
config.resolver.assetExts.push("glb", "gltf", "hdr", "bin");

module.exports = config;

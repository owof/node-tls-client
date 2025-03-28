import path from "path";
import fs from "fs";
import os from "os";
import { load as koffi } from "koffi";
// import { Download } from "./download"; // No longer needed as we're using local files
import { IClient } from "../interface/client";

/**
 * Loads the native library from the lib directory.
 * @returns {Promise<IClient>}
 */
export async function load(): Promise<IClient> {
  const file = fileInfo();
  
  // Use the module's directory path instead of the current working directory
  // This ensures we look for libraries in node_modules/node-tls-client/lib
  // regardless of where the app is being run from
  const moduleRoot = path.resolve(__dirname, '../../');
  const libraryPath = path.join(moduleRoot, "lib", file.name);

  console.log(`Looking for library at: ${libraryPath}`);

  // log all files in the lib directory
  console.log(`Files in lib directory: ${fs.readdirSync(path.join(moduleRoot, "lib"))}`);
  

  if (!fs.existsSync(libraryPath)) {
    throw new Error(`Native library not found: ${file.name}. Please ensure it exists in the lib directory.`);
  }

  const lib = koffi(libraryPath);

  return {
    request: lib.func("request", "string", ["string"]),
    freeMemory: lib.func("freeMemory", "void", ["string"]),
    destroyAll: lib.func("destroyAll", "string", []),
    destroySession: lib.func("destroySession", "string", ["string"]),
  };
}

function fileInfo() {
  const platform = process.platform;
  const arch = process.arch;

  const map: Record<string, any> = {
    darwin: {
      arm64: {
        name: "tls-client-arm64.dylib",
        downloadName: "tls-client-darwin-arm64-{version}.dylib",
      },
      x64: {
        name: "tls-client-x86.dylib",
        downloadName: "tls-client-darwin-amd64-{version}.dylib",
      },
    },
    win32: {
      x64: {
        name: "tls-client-64.dll",
        downloadName: "tls-client-windows-64-{version}.dll",
      },
      ia32: {
        name: "tls-client-32.dll",
        downloadName: "tls-client-windows-32-{version}.dll",
      },
    },
    linux: {
      arm64: {
        name: "tls-client-arm64.so",
        downloadName: "tls-client-linux-arm64-{version}.so",
      },
      x64: {
        name: "tls-client-x64.so",
        downloadName: "tls-client-linux-ubuntu-amd64-{version}.so",
      },
      default: {
        name: "tls-client-amd64.so",
        downloadName: "tls-client-linux-ubuntu-amd64-{version}.so",
      },
    },
  };

  return map[platform]?.[arch] || map.linux.default;
}

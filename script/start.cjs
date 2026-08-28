/* global __dirname, console, process, setTimeout */
const { spawn } = require("node:child_process");
const http = require("node:http");
const path = require("node:path");
require("dotenv").config({ quiet: true });

const port = Number.parseInt(process.env.PORT || "5000", 10);
const siteUrl = process.env.SUPPORTSPARK_START_URL || `http://localhost:${port}/`;
const probeUrl = process.env.SUPPORTSPARK_PROBE_URL || `http://127.0.0.1:${port}/`;
const serverPath = path.resolve(__dirname, "..", "dist", "index.cjs");

waitForServer(probeUrl, 1000)
  .then(() => openSite())
  .catch(() => {
    const server = spawn(process.execPath, [serverPath], {
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
      stdio: "inherit",
    });

    let shuttingDown = false;

    server.on("exit", (code, signal) => {
      if (shuttingDown) {
        return;
      }

      process.exit(code ?? (signal ? 1 : 0));
    });

    for (const signal of ["SIGINT", "SIGTERM"]) {
      process.on(signal, () => {
        shuttingDown = true;
        server.kill(signal);
      });
    }

    waitForServer(probeUrl)
      .then(() => openSite())
      .catch((error) => {
        console.warn(`Could not open ${siteUrl}: ${error.message}`);
      });
  });

function waitForServer(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const probe = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });

      request.on("error", () => {
        if (Date.now() >= deadline) {
          reject(new Error(`server did not respond within ${timeoutMs}ms`));
          return;
        }

        setTimeout(probe, 250);
      });

      request.setTimeout(1000, () => {
        request.destroy();
      });
    };

    probe();
  });
}

function openUrl(url) {
  const platform = process.platform;
  const command =
    platform === "win32" ? "explorer.exe" : platform === "darwin" ? "open" : "xdg-open";
  const args =
    platform === "win32"
      ? [url]
      : [url];

  return new Promise((resolve, reject) => {
    const opener = spawn(command, args, {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });

    opener.once("error", reject);
    opener.unref();
    resolve();
  });
}

function openSite() {
  if (process.env.SUPPORTSPARK_NO_OPEN === "1") {
    return undefined;
  }

  console.log(`Opening ${siteUrl}`);
  return openUrl(siteUrl);
}

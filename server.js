const http = require("node:http");
const fsSync = require("node:fs");
const fs = require("node:fs/promises");
const path = require("node:path");

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const rootDir = __dirname;
const liveReloadClients = new Set();
let reloadTimer = null;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function resolvePath(urlPathname) {
  const safePath = path.normalize(decodeURIComponent(urlPathname)).replace(/^([.][.][/\\])+/, "");
  const requestedPath = safePath === "/" ? "/index.html" : safePath;
  return path.join(rootDir, requestedPath);
}

async function readResponseBody(filePath) {
  try {
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      return readResponseBody(path.join(filePath, "index.html"));
    }

    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

function shouldReload(filePath) {
  if (!filePath || filePath.includes(`${path.sep}.git${path.sep}`)) {
    return false;
  }

  return [".html", ".css", ".js", ".png", ".jpg", ".jpeg", ".svg", ".webp", ".json"].includes(
    path.extname(filePath).toLowerCase(),
  );
}

function broadcastReload(changedPath, eventType) {
  const payload = JSON.stringify({
    eventType,
    path: path.relative(rootDir, changedPath),
    timestamp: new Date().toISOString(),
  });

  for (const client of liveReloadClients) {
    client.write(`event: reload\n`);
    client.write(`data: ${payload}\n\n`);
  }
}

function scheduleReload(changedPath, eventType) {
  if (reloadTimer) {
    clearTimeout(reloadTimer);
  }

  reloadTimer = setTimeout(() => {
    broadcastReload(changedPath, eventType);
    reloadTimer = null;
  }, 120);
}

function startLiveReloadWatcher() {
  const watcher = fsSync.watch(rootDir, { recursive: true }, (eventType, fileName) => {
    if (!fileName) {
      return;
    }

    const changedPath = path.join(rootDir, fileName.toString());
    if (!shouldReload(changedPath)) {
      return;
    }

    scheduleReload(changedPath, eventType);
  });

  watcher.on("error", (error) => {
    console.error("Live reload watcher error", error);
  });

  return watcher;
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (requestUrl.pathname === "/__live-reload") {
    response.writeHead(200, {
      "Cache-Control": "no-store",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
    });
    response.write(`retry: 500\n\n`);
    liveReloadClients.add(response);

    request.on("close", () => {
      liveReloadClients.delete(response);
    });
    return;
  }

  const filePath = resolvePath(requestUrl.pathname);
  const body = await readResponseBody(filePath);

  if (!body) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": contentTypes[extension] || "application/octet-stream",
  });
  response.end(body);
});

const watcher = startLiveReloadWatcher();

server.listen(port, host, () => {
  console.log(`Race Legends dev server running at http://${host}:${port}`);
});

function shutdown() {
  watcher.close();
  for (const client of liveReloadClients) {
    client.end();
  }
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
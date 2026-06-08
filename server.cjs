const http = require("http");
const fs = require("fs");
const path = require("path");

const host = "0.0.0.0";
const port = 4173;
const root = __dirname;

const mimeTypes = {
  ".css": "text/css; charset=UTF-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=UTF-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=UTF-8",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=UTF-8",
};

http
  .createServer((req, res) => {
    const requestPath = decodeURIComponent(req.url.split("?")[0]);
    const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
    let filePath = path.join(root, relativePath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain; charset=UTF-8");
        res.end("Not found");
        return;
      }

      const extension = path.extname(filePath).toLowerCase();
      res.setHeader("Content-Type", mimeTypes[extension] || "application/octet-stream");
      res.end(data);
    });
  })
  .listen(port, host, () => {
    console.log(`JK Computer website running at http://localhost:${port}/`);
  });

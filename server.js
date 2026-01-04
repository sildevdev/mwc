const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 2345;

const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "font/otf",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.url}`);

  let filePath = "." + req.url.split("?")[0];
  if (filePath === "./") {
    filePath = "./index.html";
  }
  if (filePath === "./widget") {
    filePath = "./widget/widget.html";
  }
  if (filePath === "./404") {
    filePath = "./404.html";
  }
  if (filePath === "./widget.min.js") {
    filePath = "./widget/widget.min.js";
  }
  if (filePath === "./template/wt.html") {
    filePath = "./widget/template/wt.html";
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || "application/octet-stream";

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code == "ENOENT") {
        fs.readFile("./404.html", (err, content) => {
          res.writeHead(404, { "Content-Type": "text/html" });
          if (err) {
            res.end("<h1>404 - File not found</h1>", "utf-8");
          } else {
            res.end(content, "utf-8");
          }
        });
      } else {
        res.writeHead(500);
        res.end("Spiacenti, errore del server: " + error.code + " ..\n");
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server starter on port ${PORT}`);
  console.log("Press Ctrl+C to stop the process.");
});

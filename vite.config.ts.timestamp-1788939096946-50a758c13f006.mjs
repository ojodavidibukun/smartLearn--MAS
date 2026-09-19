// vite.config.ts
import { jsxLocPlugin } from "file:///C:/Users/HP/Documents/lab6/smartlearn-mas%20(1)/smartlearn-mas/node_modules/.pnpm/@builder.io+vite-plugin-jsx_507101ee9b64682fd78090cd22bab3b3/node_modules/@builder.io/vite-plugin-jsx-loc/dist/index.js";
import tailwindcss from "file:///C:/Users/HP/Documents/lab6/smartlearn-mas%20(1)/smartlearn-mas/node_modules/.pnpm/@tailwindcss+vite@4.1.14_vi_3d2b98f0499fab07e5541e1c1096adf0/node_modules/@tailwindcss/vite/dist/index.mjs";
import react from "file:///C:/Users/HP/Documents/lab6/smartlearn-mas%20(1)/smartlearn-mas/node_modules/.pnpm/@vitejs+plugin-react@5.0.4__94d75084908fd62ac71fe531774e4fe9/node_modules/@vitejs/plugin-react/dist/index.js";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "file:///C:/Users/HP/Documents/lab6/smartlearn-mas%20(1)/smartlearn-mas/node_modules/.pnpm/vite@7.1.9_@types+node@24.7_61597552e415200265e44ff54b51c03e/node_modules/vite/dist/node/index.js";
import { vitePluginManusRuntime } from "file:///C:/Users/HP/Documents/lab6/smartlearn-mas%20(1)/smartlearn-mas/node_modules/.pnpm/vite-plugin-manus-runtime@0.0.58/node_modules/vite-plugin-manus-runtime/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\HP\\Documents\\lab6\\smartlearn-mas (1)\\smartlearn-mas";
var PROJECT_ROOT = __vite_injected_original_dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
function vitePluginStorageProxy() {
  return {
    name: "manus-storage-proxy",
    configureServer(server) {
      server.middlewares.use("/manus-storage", async (req, res) => {
        const key = req.url?.replace(/^\//, "");
        if (!key) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Missing storage key");
          return;
        }
        const forgeBaseUrl = (process.env.BUILT_IN_FORGE_API_URL || "").replace(/\/+$/, "");
        const forgeKey = process.env.BUILT_IN_FORGE_API_KEY;
        if (!forgeBaseUrl || !forgeKey) {
          res.writeHead(500, { "Content-Type": "text/plain" });
          res.end("Storage proxy not configured");
          return;
        }
        try {
          const forgeUrl = new URL("v1/storage/presign/get", forgeBaseUrl + "/");
          forgeUrl.searchParams.set("path", key);
          const forgeResp = await fetch(forgeUrl, {
            headers: { Authorization: `Bearer ${forgeKey}` }
          });
          if (!forgeResp.ok) {
            res.writeHead(502, { "Content-Type": "text/plain" });
            res.end("Storage backend error");
            return;
          }
          const { url } = await forgeResp.json();
          if (!url) {
            res.writeHead(502, { "Content-Type": "text/plain" });
            res.end("Empty signed URL");
            return;
          }
          res.writeHead(307, { Location: url, "Cache-Control": "no-store" });
          res.end();
        } catch {
          res.writeHead(502, { "Content-Type": "text/plain" });
          res.end("Storage proxy error");
        }
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector(), vitePluginStorageProxy()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "client", "src"),
      "@shared": path.resolve(__vite_injected_original_dirname, "shared"),
      "@assets": path.resolve(__vite_injected_original_dirname, "attached_assets")
    }
  },
  envDir: path.resolve(__vite_injected_original_dirname),
  root: path.resolve(__vite_injected_original_dirname, "client"),
  build: {
    outDir: path.resolve(__vite_injected_original_dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    port: 3e3,
    strictPort: false,
    // Will find next available port if 3000 is busy
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxIUFxcXFxEb2N1bWVudHNcXFxcbGFiNlxcXFxzbWFydGxlYXJuLW1hcyAoMSlcXFxcc21hcnRsZWFybi1tYXNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEhQXFxcXERvY3VtZW50c1xcXFxsYWI2XFxcXHNtYXJ0bGVhcm4tbWFzICgxKVxcXFxzbWFydGxlYXJuLW1hc1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvSFAvRG9jdW1lbnRzL2xhYjYvc21hcnRsZWFybi1tYXMlMjAoMSkvc21hcnRsZWFybi1tYXMvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBqc3hMb2NQbHVnaW4gfSBmcm9tIFwiQGJ1aWxkZXIuaW8vdml0ZS1wbHVnaW4tanN4LWxvY1wiO1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gXCJAdGFpbHdpbmRjc3Mvdml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IGZzIGZyb20gXCJub2RlOmZzXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIHR5cGUgUGx1Z2luLCB0eXBlIFZpdGVEZXZTZXJ2ZXIgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHsgdml0ZVBsdWdpbk1hbnVzUnVudGltZSB9IGZyb20gXCJ2aXRlLXBsdWdpbi1tYW51cy1ydW50aW1lXCI7XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBNYW51cyBEZWJ1ZyBDb2xsZWN0b3IgLSBWaXRlIFBsdWdpblxuLy8gV3JpdGVzIGJyb3dzZXIgbG9ncyBkaXJlY3RseSB0byBmaWxlcywgdHJpbW1lZCB3aGVuIGV4Y2VlZGluZyBzaXplIGxpbWl0XG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5jb25zdCBQUk9KRUNUX1JPT1QgPSBpbXBvcnQubWV0YS5kaXJuYW1lO1xuY29uc3QgTE9HX0RJUiA9IHBhdGguam9pbihQUk9KRUNUX1JPT1QsIFwiLm1hbnVzLWxvZ3NcIik7XG5jb25zdCBNQVhfTE9HX1NJWkVfQllURVMgPSAxICogMTAyNCAqIDEwMjQ7IC8vIDFNQiBwZXIgbG9nIGZpbGVcbmNvbnN0IFRSSU1fVEFSR0VUX0JZVEVTID0gTWF0aC5mbG9vcihNQVhfTE9HX1NJWkVfQllURVMgKiAwLjYpOyAvLyBUcmltIHRvIDYwJSB0byBhdm9pZCBjb25zdGFudCByZS10cmltbWluZ1xuXG50eXBlIExvZ1NvdXJjZSA9IFwiYnJvd3NlckNvbnNvbGVcIiB8IFwibmV0d29ya1JlcXVlc3RzXCIgfCBcInNlc3Npb25SZXBsYXlcIjtcblxuZnVuY3Rpb24gZW5zdXJlTG9nRGlyKCkge1xuICBpZiAoIWZzLmV4aXN0c1N5bmMoTE9HX0RJUikpIHtcbiAgICBmcy5ta2RpclN5bmMoTE9HX0RJUiwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdHJpbUxvZ0ZpbGUobG9nUGF0aDogc3RyaW5nLCBtYXhTaXplOiBudW1iZXIpIHtcbiAgdHJ5IHtcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMobG9nUGF0aCkgfHwgZnMuc3RhdFN5bmMobG9nUGF0aCkuc2l6ZSA8PSBtYXhTaXplKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbGluZXMgPSBmcy5yZWFkRmlsZVN5bmMobG9nUGF0aCwgXCJ1dGYtOFwiKS5zcGxpdChcIlxcblwiKTtcbiAgICBjb25zdCBrZXB0TGluZXM6IHN0cmluZ1tdID0gW107XG4gICAgbGV0IGtlcHRCeXRlcyA9IDA7XG5cbiAgICAvLyBLZWVwIG5ld2VzdCBsaW5lcyAoZnJvbSBlbmQpIHRoYXQgZml0IHdpdGhpbiA2MCUgb2YgbWF4U2l6ZVxuICAgIGNvbnN0IHRhcmdldFNpemUgPSBUUklNX1RBUkdFVF9CWVRFUztcbiAgICBmb3IgKGxldCBpID0gbGluZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGNvbnN0IGxpbmVCeXRlcyA9IEJ1ZmZlci5ieXRlTGVuZ3RoKGAke2xpbmVzW2ldfVxcbmAsIFwidXRmLThcIik7XG4gICAgICBpZiAoa2VwdEJ5dGVzICsgbGluZUJ5dGVzID4gdGFyZ2V0U2l6ZSkgYnJlYWs7XG4gICAgICBrZXB0TGluZXMudW5zaGlmdChsaW5lc1tpXSk7XG4gICAgICBrZXB0Qnl0ZXMgKz0gbGluZUJ5dGVzO1xuICAgIH1cblxuICAgIGZzLndyaXRlRmlsZVN5bmMobG9nUGF0aCwga2VwdExpbmVzLmpvaW4oXCJcXG5cIiksIFwidXRmLThcIik7XG4gIH0gY2F0Y2gge1xuICAgIC8qIGlnbm9yZSB0cmltIGVycm9ycyAqL1xuICB9XG59XG5cbmZ1bmN0aW9uIHdyaXRlVG9Mb2dGaWxlKHNvdXJjZTogTG9nU291cmNlLCBlbnRyaWVzOiB1bmtub3duW10pIHtcbiAgaWYgKGVudHJpZXMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgZW5zdXJlTG9nRGlyKCk7XG4gIGNvbnN0IGxvZ1BhdGggPSBwYXRoLmpvaW4oTE9HX0RJUiwgYCR7c291cmNlfS5sb2dgKTtcblxuICAvLyBGb3JtYXQgZW50cmllcyB3aXRoIHRpbWVzdGFtcHNcbiAgY29uc3QgbGluZXMgPSBlbnRyaWVzLm1hcCgoZW50cnkpID0+IHtcbiAgICBjb25zdCB0cyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICByZXR1cm4gYFske3RzfV0gJHtKU09OLnN0cmluZ2lmeShlbnRyeSl9YDtcbiAgfSk7XG5cbiAgLy8gQXBwZW5kIHRvIGxvZyBmaWxlXG4gIGZzLmFwcGVuZEZpbGVTeW5jKGxvZ1BhdGgsIGAke2xpbmVzLmpvaW4oXCJcXG5cIil9XFxuYCwgXCJ1dGYtOFwiKTtcblxuICAvLyBUcmltIGlmIGV4Y2VlZHMgbWF4IHNpemVcbiAgdHJpbUxvZ0ZpbGUobG9nUGF0aCwgTUFYX0xPR19TSVpFX0JZVEVTKTtcbn1cblxuLyoqXG4gKiBWaXRlIHBsdWdpbiB0byBjb2xsZWN0IGJyb3dzZXIgZGVidWcgbG9nc1xuICogLSBQT1NUIC9fX21hbnVzX18vbG9nczogQnJvd3NlciBzZW5kcyBsb2dzLCB3cml0dGVuIGRpcmVjdGx5IHRvIGZpbGVzXG4gKiAtIEZpbGVzOiBicm93c2VyQ29uc29sZS5sb2csIG5ldHdvcmtSZXF1ZXN0cy5sb2csIHNlc3Npb25SZXBsYXkubG9nXG4gKiAtIEF1dG8tdHJpbW1lZCB3aGVuIGV4Y2VlZGluZyAxTUIgKGtlZXBzIG5ld2VzdCBlbnRyaWVzKVxuICovXG5mdW5jdGlvbiB2aXRlUGx1Z2luTWFudXNEZWJ1Z0NvbGxlY3RvcigpOiBQbHVnaW4ge1xuICByZXR1cm4ge1xuICAgIG5hbWU6IFwibWFudXMtZGVidWctY29sbGVjdG9yXCIsXG5cbiAgICB0cmFuc2Zvcm1JbmRleEh0bWwoaHRtbCkge1xuICAgICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSBcInByb2R1Y3Rpb25cIikge1xuICAgICAgICByZXR1cm4gaHRtbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGh0bWwsXG4gICAgICAgIHRhZ3M6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0YWc6IFwic2NyaXB0XCIsXG4gICAgICAgICAgICBhdHRyczoge1xuICAgICAgICAgICAgICBzcmM6IFwiL19fbWFudXNfXy9kZWJ1Zy1jb2xsZWN0b3IuanNcIixcbiAgICAgICAgICAgICAgZGVmZXI6IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW5qZWN0VG86IFwiaGVhZFwiLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9O1xuICAgIH0sXG5cbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyOiBWaXRlRGV2U2VydmVyKSB7XG4gICAgICAvLyBQT1NUIC9fX21hbnVzX18vbG9nczogQnJvd3NlciBzZW5kcyBsb2dzICh3cml0dGVuIGRpcmVjdGx5IHRvIGZpbGVzKVxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShcIi9fX21hbnVzX18vbG9nc1wiLCAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09IFwiUE9TVFwiKSB7XG4gICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGhhbmRsZVBheWxvYWQgPSAocGF5bG9hZDogYW55KSA9PiB7XG4gICAgICAgICAgLy8gV3JpdGUgbG9ncyBkaXJlY3RseSB0byBmaWxlc1xuICAgICAgICAgIGlmIChwYXlsb2FkLmNvbnNvbGVMb2dzPy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB3cml0ZVRvTG9nRmlsZShcImJyb3dzZXJDb25zb2xlXCIsIHBheWxvYWQuY29uc29sZUxvZ3MpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocGF5bG9hZC5uZXR3b3JrUmVxdWVzdHM/Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHdyaXRlVG9Mb2dGaWxlKFwibmV0d29ya1JlcXVlc3RzXCIsIHBheWxvYWQubmV0d29ya1JlcXVlc3RzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHBheWxvYWQuc2Vzc2lvbkV2ZW50cz8ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgd3JpdGVUb0xvZ0ZpbGUoXCJzZXNzaW9uUmVwbGF5XCIsIHBheWxvYWQuc2Vzc2lvbkV2ZW50cyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVzLndyaXRlSGVhZCgyMDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSk7XG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUgfSkpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHJlcUJvZHkgPSAocmVxIGFzIHsgYm9keT86IHVua25vd24gfSkuYm9keTtcbiAgICAgICAgaWYgKHJlcUJvZHkgJiYgdHlwZW9mIHJlcUJvZHkgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgaGFuZGxlUGF5bG9hZChyZXFCb2R5KTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IFN0cmluZyhlKSB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBib2R5ID0gXCJcIjtcbiAgICAgICAgcmVxLm9uKFwiZGF0YVwiLCAoY2h1bmspID0+IHtcbiAgICAgICAgICBib2R5ICs9IGNodW5rLnRvU3RyaW5nKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlcS5vbihcImVuZFwiLCAoKSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHBheWxvYWQgPSBKU09OLnBhcnNlKGJvZHkpO1xuICAgICAgICAgICAgaGFuZGxlUGF5bG9hZChwYXlsb2FkKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDQwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9KTtcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgZXJyb3I6IFN0cmluZyhlKSB9KSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIHZpdGVQbHVnaW5TdG9yYWdlUHJveHkoKTogUGx1Z2luIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBcIm1hbnVzLXN0b3JhZ2UtcHJveHlcIixcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyOiBWaXRlRGV2U2VydmVyKSB7XG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKFwiL21hbnVzLXN0b3JhZ2VcIiwgYXN5bmMgKHJlcSwgcmVzKSA9PiB7XG4gICAgICAgIGNvbnN0IGtleSA9IHJlcS51cmw/LnJlcGxhY2UoL15cXC8vLCBcIlwiKTtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICByZXMud3JpdGVIZWFkKDQwMCwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9KTtcbiAgICAgICAgICByZXMuZW5kKFwiTWlzc2luZyBzdG9yYWdlIGtleVwiKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmb3JnZUJhc2VVcmwgPSAocHJvY2Vzcy5lbnYuQlVJTFRfSU5fRk9SR0VfQVBJX1VSTCB8fCBcIlwiKS5yZXBsYWNlKC9cXC8rJC8sIFwiXCIpO1xuICAgICAgICBjb25zdCBmb3JnZUtleSA9IHByb2Nlc3MuZW52LkJVSUxUX0lOX0ZPUkdFX0FQSV9LRVk7XG5cbiAgICAgICAgaWYgKCFmb3JnZUJhc2VVcmwgfHwgIWZvcmdlS2V5KSB7XG4gICAgICAgICAgcmVzLndyaXRlSGVhZCg1MDAsIHsgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIgfSk7XG4gICAgICAgICAgcmVzLmVuZChcIlN0b3JhZ2UgcHJveHkgbm90IGNvbmZpZ3VyZWRcIik7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBmb3JnZVVybCA9IG5ldyBVUkwoXCJ2MS9zdG9yYWdlL3ByZXNpZ24vZ2V0XCIsIGZvcmdlQmFzZVVybCArIFwiL1wiKTtcbiAgICAgICAgICBmb3JnZVVybC5zZWFyY2hQYXJhbXMuc2V0KFwicGF0aFwiLCBrZXkpO1xuXG4gICAgICAgICAgY29uc3QgZm9yZ2VSZXNwID0gYXdhaXQgZmV0Y2goZm9yZ2VVcmwsIHtcbiAgICAgICAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogYEJlYXJlciAke2ZvcmdlS2V5fWAgfSxcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmICghZm9yZ2VSZXNwLm9rKSB7XG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMiwgeyBcIkNvbnRlbnQtVHlwZVwiOiBcInRleHQvcGxhaW5cIiB9KTtcbiAgICAgICAgICAgIHJlcy5lbmQoXCJTdG9yYWdlIGJhY2tlbmQgZXJyb3JcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgeyB1cmwgfSA9IChhd2FpdCBmb3JnZVJlc3AuanNvbigpKSBhcyB7IHVybDogc3RyaW5nIH07XG4gICAgICAgICAgaWYgKCF1cmwpIHtcbiAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNTAyLCB7IFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0pO1xuICAgICAgICAgICAgcmVzLmVuZChcIkVtcHR5IHNpZ25lZCBVUkxcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVzLndyaXRlSGVhZCgzMDcsIHsgTG9jYXRpb246IHVybCwgXCJDYWNoZS1Db250cm9sXCI6IFwibm8tc3RvcmVcIiB9KTtcbiAgICAgICAgICByZXMuZW5kKCk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIHJlcy53cml0ZUhlYWQoNTAyLCB7IFwiQ29udGVudC1UeXBlXCI6IFwidGV4dC9wbGFpblwiIH0pO1xuICAgICAgICAgIHJlcy5lbmQoXCJTdG9yYWdlIHByb3h5IGVycm9yXCIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LFxuICB9O1xufVxuXG5jb25zdCBwbHVnaW5zID0gW3JlYWN0KCksIHRhaWx3aW5kY3NzKCksIGpzeExvY1BsdWdpbigpLCB2aXRlUGx1Z2luTWFudXNSdW50aW1lKCksIHZpdGVQbHVnaW5NYW51c0RlYnVnQ29sbGVjdG9yKCksIHZpdGVQbHVnaW5TdG9yYWdlUHJveHkoKV07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnMsXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShpbXBvcnQubWV0YS5kaXJuYW1lLCBcImNsaWVudFwiLCBcInNyY1wiKSxcbiAgICAgIFwiQHNoYXJlZFwiOiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCJzaGFyZWRcIiksXG4gICAgICBcIkBhc3NldHNcIjogcGF0aC5yZXNvbHZlKGltcG9ydC5tZXRhLmRpcm5hbWUsIFwiYXR0YWNoZWRfYXNzZXRzXCIpLFxuICAgIH0sXG4gIH0sXG4gIGVudkRpcjogcGF0aC5yZXNvbHZlKGltcG9ydC5tZXRhLmRpcm5hbWUpLFxuICByb290OiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCJjbGllbnRcIiksXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCJkaXN0L3B1YmxpY1wiKSxcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogMzAwMCxcbiAgICBzdHJpY3RQb3J0OiBmYWxzZSwgLy8gV2lsbCBmaW5kIG5leHQgYXZhaWxhYmxlIHBvcnQgaWYgMzAwMCBpcyBidXN5XG4gICAgaG9zdDogdHJ1ZSxcbiAgICBhbGxvd2VkSG9zdHM6IFtcbiAgICAgIFwiLm1hbnVzcHJlLmNvbXB1dGVyXCIsXG4gICAgICBcIi5tYW51cy5jb21wdXRlclwiLFxuICAgICAgXCIubWFudXMtYXNpYS5jb21wdXRlclwiLFxuICAgICAgXCIubWFudXNjb21wdXRlci5haVwiLFxuICAgICAgXCIubWFudXN2bS5jb21wdXRlclwiLFxuICAgICAgXCJsb2NhbGhvc3RcIixcbiAgICAgIFwiMTI3LjAuMC4xXCIsXG4gICAgXSxcbiAgICBmczoge1xuICAgICAgc3RyaWN0OiB0cnVlLFxuICAgICAgZGVueTogW1wiKiovLipcIl0sXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFzWCxTQUFTLG9CQUFvQjtBQUNuWixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLFdBQVc7QUFDbEIsT0FBTyxRQUFRO0FBQ2YsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsb0JBQXFEO0FBQzlELFNBQVMsOEJBQThCO0FBTnZDLElBQU0sbUNBQW1DO0FBYXpDLElBQU0sZUFBZTtBQUNyQixJQUFNLFVBQVUsS0FBSyxLQUFLLGNBQWMsYUFBYTtBQUNyRCxJQUFNLHFCQUFxQixJQUFJLE9BQU87QUFDdEMsSUFBTSxvQkFBb0IsS0FBSyxNQUFNLHFCQUFxQixHQUFHO0FBSTdELFNBQVMsZUFBZTtBQUN0QixNQUFJLENBQUMsR0FBRyxXQUFXLE9BQU8sR0FBRztBQUMzQixPQUFHLFVBQVUsU0FBUyxFQUFFLFdBQVcsS0FBSyxDQUFDO0FBQUEsRUFDM0M7QUFDRjtBQUVBLFNBQVMsWUFBWSxTQUFpQixTQUFpQjtBQUNyRCxNQUFJO0FBQ0YsUUFBSSxDQUFDLEdBQUcsV0FBVyxPQUFPLEtBQUssR0FBRyxTQUFTLE9BQU8sRUFBRSxRQUFRLFNBQVM7QUFDbkU7QUFBQSxJQUNGO0FBRUEsVUFBTSxRQUFRLEdBQUcsYUFBYSxTQUFTLE9BQU8sRUFBRSxNQUFNLElBQUk7QUFDMUQsVUFBTSxZQUFzQixDQUFDO0FBQzdCLFFBQUksWUFBWTtBQUdoQixVQUFNLGFBQWE7QUFD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

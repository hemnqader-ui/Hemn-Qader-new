import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const DEFAULT_M3U_URL = "https://raw.githubusercontent.com/Kardo26/KardoServices/refs/heads/main/B.m3u";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Fetch M3U Playlist proxy to avoid CORS issues
  app.get("/api/playlist", async (req, res) => {
    try {
      const targetUrl = (req.query.url as string) || DEFAULT_M3U_URL;
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Failed to fetch playlist: ${response.statusText}` });
      }

      const m3uContent = await response.text();
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.send(m3uContent);
    } catch (err: any) {
      console.error("Error fetching M3U:", err);
      res.status(500).json({ error: err.message || "Failed to fetch M3U playlist" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mand TV server running on http://localhost:${PORT}`);
  });
}

startServer();

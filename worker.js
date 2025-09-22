// worker.js - Cloudflare Worker for M3U8 Player + Proxy

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Serve the player UI
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(HTML_CONTENT, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    // Proxy endpoint: /api/proxy?url=...&cookie=...
    if (url.pathname === "/api/proxy") {
      const target = url.searchParams.get("url");
      const cookie = url.searchParams.get("cookie") || "";

      if (!target) {
        return new Response("Missing url parameter", { status: 400 });
      }

      try {
        const proxied = await fetch(target, {
          headers: cookie ? { cookie } : {},
        });

        return new Response(proxied.body, {
          status: proxied.status,
          headers: {
            "content-type":
              proxied.headers.get("content-type") || "application/octet-stream",
            "access-control-allow-origin": "*",
          },
        });
      } catch (err) {
        return new Response("Proxy error: " + err.message, { status: 500 });
      }
    }

    return new Response("Not found", { status: 404 });
  },
};

// === HTML Player UI ===
const HTML_CONTENT = String.raw`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>M3U8 Player</title>
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    video { width: 100%; max-width: 800px; margin-top: 20px; }
    input, button { margin: 5px 0; padding: 8px; width: 100%; max-width: 600px; }
    #status { margin-top: 10px; font-size: 14px; }
  </style>
</head>
<body>
  <h2>M3U8 Player with Cookie Support</h2>
  <input id="urlInput" type="text" placeholder="Enter M3U8 URL" />
  <input id="cookieInput" type="text" placeholder="Enter Cookie (optional)" />
  <button id="playBtn">Play</button>
  <div id="status"></div>
  <video id="video" controls></video>

  <script>
    const playBtn = document.getElementById("playBtn");
    const urlInput = document.getElementById("urlInput");
    const cookieInput = document.getElementById("cookieInput");
    const video = document.getElementById("video");
    const statusEl = document.getElementById("status");

    function updateStatus(msg, ok = true) {
      statusEl.textContent = msg;
      statusEl.style.color = ok ? "green" : "red";
    }

    playBtn.onclick = async () => {
      const m3u8Url = urlInput.value.trim();
      const cookie = cookieInput.value.trim();

      if (!m3u8Url) {
        updateStatus("Please enter a valid M3U8 URL", false);
        return;
      }

      const proxyUrl = "/api/proxy?url=" + encodeURIComponent(m3u8Url) +
        (cookie ? "&cookie=" + encodeURIComponent(cookie) : "");

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(proxyUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          updateStatus("Manifest loaded. Starting playback...");
          video.play();
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          updateStatus("Error: " + data.details, false);
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = proxyUrl;
        video.addEventListener("loadedmetadata", () => {
          updateStatus("Native HLS supported. Playing...");
          video.play();
        });
      } else {
        updateStatus("Your browser does not support HLS.", false);
      }
    };
  </script>
</body>
</html>
`;

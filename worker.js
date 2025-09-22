// Complete M3U8 Player with Cloudflare Workers
const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>M3U8 Stream Player</title>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f0f2f5;
            color: #1a1a1a;
            line-height: 1.6;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px 0;
        }
        
        .header h1 {
            font-size: 2.5rem;
            color: #2563eb;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #6b7280;
            font-size: 1.1rem;
        }
        
        .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 25px;
            margin-bottom: 20px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            color: #374151;
            font-size: 0.95rem;
        }
        
        input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        input:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        
        .help-text {
            font-size: 0.85rem;
            color: #6b7280;
            margin-top: 5px;
        }
        
        .button-group {
            display: flex;
            gap: 12px;
            margin-top: 25px;
        }
        
        button {
            flex: 1;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .btn-primary {
            background: #2563eb;
            color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
            background: #1d4ed8;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(37,99,235,0.3);
        }
        
        .btn-danger {
            background: #ef4444;
            color: white;
        }
        
        .btn-danger:hover:not(:disabled) {
            background: #dc2626;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(239,68,68,0.3);
        }
        
        button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
            transform: none;
        }
        
        .error {
            background: #fee;
            border: 1px solid #fcc;
            color: #b91c1c;
            padding: 16px;
            border-radius: 8px;
            margin-top: 20px;
            display: none;
            animation: slideIn 0.3s ease;
        }
        
        .success {
            background: #d1fae5;
            border: 1px solid #6ee7b7;
            color: #065f46;
            padding: 16px;
            border-radius: 8px;
            margin-top: 20px;
            display: none;
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .video-container {
            position: relative;
            background: #000;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        
        video {
            width: 100%;
            display: block;
            min-height: 400px;
        }
        
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.2rem;
            display: none;
        }
        
        .loading-overlay.active {
            display: flex;
        }
        
        .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 15px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .info-box {
            background: #eff6ff;
            border: 1px solid #93c5fd;
            color: #1e40af;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
        }
        
        .info-box h3 {
            margin-bottom: 10px;
            font-size: 1.1rem;
        }
        
        .info-box ul {
            margin-left: 20px;
            margin-top: 10px;
        }
        
        .info-box li {
            margin-bottom: 5px;
        }
        
        .status {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 15px;
            padding: 10px;
            background: #f3f4f6;
            border-radius: 6px;
            font-size: 0.9rem;
        }
        
        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #6b7280;
        }
        
        .status-dot.playing {
            background: #10b981;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        @media (max-width: 640px) {
            .container {
                padding: 15px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .card {
                padding: 20px;
            }
            
            video {
                min-height: 250px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>M3U8 Stream Player</h1>
            <p>Stream HLS content with geo-proxy support</p>
        </div>

        <div class="card">
            <div class="form-group">
                <label for="url">M3U8 Stream URL</label>
                <input 
                    id="url" 
                    type="url" 
                    placeholder="https://example.com/stream/playlist.m3u8"
                    autocomplete="off"
                />
                <p class="help-text">Enter the full URL of your M3U8 stream</p>
            </div>

            <div class="form-group">
                <label for="cookie">Authentication Cookie (Optional)</label>
                <input 
                    id="cookie" 
                    type="text" 
                    placeholder="session=abc123; token=xyz789"
                    autocomplete="off"
                />
                <p class="help-text">Add cookies if required for authentication</p>
            </div>

            <div class="button-group">
                <button id="playBtn" class="btn-primary" onclick="playStream()">
                    <span>▶</span> Play Stream
                </button>
                <button id="stopBtn" class="btn-danger" onclick="stopStream()" disabled>
                    <span>■</span> Stop
                </button>
            </div>

            <div id="error" class="error"></div>
            <div id="success" class="success"></div>
            
            <div id="status" class="status" style="display: none;">
                <span class="status-dot"></span>
                <span id="statusText">Idle</span>
            </div>
        </div>

        <div class="card">
            <div class="video-container">
                <video id="video" controls playsinline></video>
                <div id="loadingOverlay" class="loading-overlay">
                    <div class="spinner"></div>
                    <span>Loading stream...</span>
                </div>
            </div>
        </div>

        <div class="info-box">
            <h3>📡 How it works</h3>
            <ul>
                <li>This player uses Cloudflare Workers as a proxy</li>
                <li>Helps bypass geo-restrictions and CORS issues</li>
                <li>Supports HLS.js for better compatibility</li>
                <li>All traffic is routed through Cloudflare's network</li>
            </ul>
        </div>
    </div>

    <script>
        let hls = null;
        const video = document.getElementById('video');
        const urlInput = document.getElementById('url');
        const cookieInput = document.getElementById('cookie');
        const playBtn = document.getElementById('playBtn');
        const stopBtn = document.getElementById('stopBtn');
        const errorDiv = document.getElementById('error');
        const successDiv = document.getElementById('success');
        const loadingOverlay = document.getElementById('loadingOverlay');
        const statusDiv = document.getElementById('status');
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.getElementById('statusText');

        function showError(message) {
            errorDiv.textContent = '❌ ' + message;
            errorDiv.style.display = 'block';
            successDiv.style.display = 'none';
        }

        function showSuccess(message) {
            successDiv.textContent = '✅ ' + message;
            successDiv.style.display = 'block';
            errorDiv.style.display = 'none';
        }

        function hideMessages() {
            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';
        }

        function updateStatus(text, playing = false) {
            statusDiv.style.display = 'flex';
            statusText.textContent = text;
            if (playing) {
                statusDot.classList.add('playing');
            } else {
                statusDot.classList.remove('playing');
            }
        }

        function showLoading(show) {
            if (show) {
                loadingOverlay.classList.add('active');
            } else {
                loadingOverlay.classList.remove('active');
            }
        }

        async function playStream() {
            const url = urlInput.value.trim();
            const cookie = cookieInput.value.trim();

            if (!url) {
                showError('Please enter a valid M3U8 URL');
                return;
            }

            if (!url.toLowerCase().includes('.m3u8') && !url.toLowerCase().includes('playlist')) {
                showError('URL should be an M3U8 stream (contains .m3u8 or playlist)');
                return;
            }

            hideMessages();
            showLoading(true);
            playBtn.disabled = true;
            playBtn.innerHTML = '<span>⏳</span> Loading...';
            updateStatus('Connecting to stream...');

            try {
                // Build proxy URL
                const params = new URLSearchParams();
                params.append('url', url);
                if (cookie) {
                    params.append('cookie', cookie);
                }
                const proxyUrl = '/proxy?' + params.toString();

                if (Hls.isSupported()) {
                    // Destroy previous instance
                    if (hls) {
                        hls.destroy();
                    }

                    // Create new HLS instance
                    hls = new Hls({
                        debug: false,
                        enableWorker: true,
                        lowLatencyMode: true,
                        backBufferLength: 90,
                        maxBufferLength: 30,
                        maxMaxBufferLength: 600,
                        maxBufferSize: 60 * 1000 * 1000,
                        maxBufferHole: 0.5,
                        highBufferWatchdogPeriod: 2,
                        nudgeOffset: 0.1,
                        nudgeMaxRetry: 3,
                        maxFragLookUpTolerance: 0.25,
                        liveSyncDurationCount: 3,
                        liveMaxLatencyDurationCount: Infinity,
                        liveDurationInfinity: true,
                        enableWebVTT: true,
                        enableCEA708Captions: true,
                        stretchShortVideoTrack: false,
                        forceKeyFrameOnDiscontinuity: true,
                        abrEwmaFastLive: 3,
                        abrEwmaSlowLive: 9,
                        abrEwmaFastVoD: 3,
                        abrEwmaSlowVoD: 9,
                        abrEwmaDefaultEstimate: 5e5,
                        abrBandWidthFactor: 0.95,
                        abrBandWidthUpFactor: 0.7,
                        maxStarvationDelay: 4,
                        maxLoadingDelay: 4,
                        minAutoBitrate: 0,
                        emeEnabled: false,
                        widevineLicenseUrl: undefined,
                        requestMediaKeySystemAccessFunc: null,
                    });

                    // Event handlers
                    hls.on(Hls.Events.ERROR, function (event, data) {
                        console.error('HLS Error:', data);
                        showLoading(false);
                        
                        if (data.fatal) {
                            switch (data.type) {
                                case Hls.ErrorTypes.NETWORK_ERROR:
                                    showError('Network error: Unable to load stream. Check URL or connection.');
                                    updateStatus('Network error', false);
                                    break;
                                case Hls.ErrorTypes.MEDIA_ERROR:
                                    showError('Media error: Stream format not supported.');
                                    updateStatus('Media error', false);
                                    hls.recoverMediaError();
                                    break;
                                default:
                                    showError('An error occurred while loading the stream.');
                                    updateStatus('Error', false);
                                    hls.destroy();
                                    break;
                            }
                            playBtn.disabled = false;
                            playBtn.innerHTML = '<span>▶</span> Play Stream';
                        }
                    });

                    hls.on(Hls.Events.MANIFEST_LOADED, function(event, data) {
                        console.log('Manifest loaded:', data);
                        showLoading(false);
                        showSuccess('Stream loaded successfully!');
                        updateStatus('Stream ready', false);
                        playBtn.disabled = false;
                        playBtn.innerHTML = '<span>▶</span> Play Stream';
                        stopBtn.disabled = false;
                    });

                    hls.on(Hls.Events.LEVEL_LOADED, function(event, data) {
                        console.log('Level loaded:', data);
                        updateStatus('Playing', true);
                    });

                    hls.on(Hls.Events.FRAG_LOADED, function(event, data) {
                        updateStatus(`Playing (${data.frag.sn})`, true);
                    });

                    // Load source
                    hls.loadSource(proxyUrl);
                    hls.attachMedia(video);

                    // Auto-play when ready
                    hls.on(Hls.Events.MANIFEST_PARSED, function() {
                        video.play().catch(e => {
                            console.warn('Auto-play prevented:', e);
                            showError('Auto-play blocked. Please click the play button on the video.');
                        });
                    });

                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    // Native HLS support (Safari)
                    video.src = proxyUrl;
                    video.addEventListener('loadedmetadata', () => {
                        showLoading(false);
                        showSuccess('Stream loaded successfully!');
                        updateStatus('Stream ready', false);
                        playBtn.disabled = false;
                        playBtn.innerHTML = '<span>▶</span> Play Stream';
                        stopBtn.disabled = false;
                        video.play().catch(e => {
                            console.warn('Auto-play prevented:', e);
                            showError('Auto-play blocked. Please click the play button on the video.');
                        });
                    });
                    
                    video.addEventListener('error', (e) => {
                        showLoading(false);
                        showError('Failed to load stream. Check URL or try a different browser.');
                        updateStatus('Error', false);
                        playBtn.disabled = false;
                        playBtn.innerHTML = '<span>▶</span> Play Stream';
                    });
                } else {
                    showError('HLS streaming is not supported in this browser.');
                    showLoading(false);
                    playBtn.disabled = false;
                    playBtn.innerHTML = '<span>▶</span> Play Stream';
                }

            } catch (error) {
                showError('Failed to initialize player: ' + error.message);
                showLoading(false);
                updateStatus('Error', false);
                playBtn.disabled = false;
                playBtn.innerHTML = '<span>▶</span> Play Stream';
                console.error('Player initialization error:', error);
            }
        }

        function stopStream() {
            if (hls) {
                hls.destroy();
                hls = null;
            }
            video.pause();
            video.src = '';
            video.load();
            
            stopBtn.disabled = true;
            hideMessages();
            updateStatus('Stopped', false);
            showSuccess('Stream stopped');
            
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 2000);
        }

        // Video event listeners
        video.addEventListener('play', () => {
            updateStatus('Playing', true);
        });

        video.addEventListener('pause', () => {
            updateStatus('Paused', false);
        });

        video.addEventListener('ended', () => {
            updateStatus('Ended', false);
            stopBtn.disabled = true;
        });

        // Allow Enter key to play
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !playBtn.disabled) {
                playStream();
            }
        });

        cookieInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !playBtn.disabled) {
                playStream();
            }
        });
    </script>
</body>
</html>
`;

// Main worker code
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Serve the main HTML page
    if (url.pathname === '/' || url.pathname === '') {
      return new Response(HTML_CONTENT, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    
    // Handle proxy requests
    if (url.pathname === '/proxy') {
      return handleProxy(request, url);
    }
    
    // 404 for other paths
    return new Response('Not Found', { status: 404 });
  },
};

async function handleProxy(request, url) {
  const streamUrl = url.searchParams.get('url');
  const cookie = url.searchParams.get('cookie');
  
  if (!streamUrl) {
    return new Response(JSON.stringify({ error: 'URL parameter is required' }), {
      status: 400,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  
  try {
    // Decode the URL
    const decodedUrl = decodeURIComponent(streamUrl);
    
    // Prepare headers for the request
    const headers = new Headers({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Origin': new URL(decodedUrl).origin,
      'Referer': new URL(decodedUrl).origin + '/',
    });
    
    // Add cookie if provided
    if (cookie) {
      headers.set('Cookie', cookie);
    }
    
    // Add Bangladesh-specific headers
    headers.set('X-Forwarded-For', '103.4.144.0'); // Bangladesh IP range
    headers.set('CF-Connecting-IP', '103.4.144.0');
    headers.set('X-Real-IP', '103.4.144.0');
    
    // Fetch the stream with custom headers
    const response = await fetch(decodedUrl, {
      method: 'GET',
      headers: headers,
      redirect: 'follow',
      // Cloudflare-specific options
      cf: {
        cacheTtl: 0,
        cacheEverything: false,
        // Polish: "off",
        // Mirage: false,
        // Apps: false,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    
    // Handle M3U8 playlist files
    if (contentType.includes('mpegurl') || 
        contentType.includes('x-mpegURL') || 
        decodedUrl.toLowerCase().includes('.m3u8')) {
      
      const text = await response.text();
      
      // Parse base URL for relative paths
      const baseUrl = decodedUrl.substring(0, decodedUrl.lastIndexOf('/') + 1);
      
      // Rewrite URLs in the playlist to go through our proxy
      const lines = text.split('\n');
      const rewrittenLines = lines.map(line => {
        line = line.trim();
        
        // Skip empty lines and comments
        if (!line || line.startsWith('#')) {
          return line;
        }
        
        // Handle different URL formats
        let absoluteUrl;
        if (line.startsWith('http://') || line.startsWith('https://')) {
          // Already absolute
          absoluteUrl = line;
        } else if (line.startsWith('/')) {
          // Absolute path
          const urlObj = new URL(decodedUrl);
          absoluteUrl = urlObj.protocol + '//' + urlObj.host + line;
        } else {
          // Relative path
          absoluteUrl = baseUrl + line;
        }
        
        // Return proxied URL
        return `/proxy?url=${encodeURIComponent(absoluteUrl)}${cookie ? `&cookie=${encodeURIComponent(cookie)}` : ''}`;
      });
      
      const rewrittenPlaylist = rewrittenLines.join('\n');
      
      return new Response(rewrittenPlaylist, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }
    
    // For TS segments and other content, pass through directly
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', contentType || 'application/octet-stream');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');
    responseHeaders.set('Cache-Control', 'public, max-age=3600');
    
    // Copy some headers from the original response
    const headersToForward = ['content-length', 'content-encoding', 'last-modified', 'etag'];
    headersToForward.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    });
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch stream', 
      details: error.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// Handle OPTIONS requests for CORS
export async function handleOptions(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}

const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();

// ============================================
// CONFIGURE THESE WITH YOUR VALUES
// ============================================
const CONFIG = {
  CLIENT_KEY: process.env.TT_CLIENT_KEY || 'aw9duys7k7r75a84',
  CLIENT_SECRET: process.env.TT_CLIENT_SECRET || 'PASTE_YOUR_SECRET_HERE',
  REDIRECT_URI: 'https://localhost:3000/callback',
  PORT: 3000
};
// ============================================

const upload = multer({ dest: 'uploads/' });
let tokenStore = { access_token: null, refresh_token: null, open_id: null };

// ---- LANDING PAGE ----
app.get('/', (req, res) => {
  const loggedIn = !!tokenStore.access_token;
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Viral Content Manager</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e0e0e0; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .container { max-width: 500px; width: 90%; text-align: center; }
    h1 { font-size: 28px; margin-bottom: 8px; color: #fff; }
    .subtitle { color: #888; font-size: 14px; margin-bottom: 40px; }
    .btn { display: inline-block; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; text-decoration: none; border: none; transition: all 0.2s; }
    .btn-tiktok { background: #fe2c55; color: #fff; }
    .btn-tiktok:hover { background: #e91e45; transform: scale(1.02); }
    .btn-upload { background: #25f4ee; color: #000; }
    .btn-upload:hover { background: #1ad4cf; }
    .status { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: left; }
    .status .label { color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .status .value { color: #25f4ee; font-size: 14px; margin-top: 4px; font-family: monospace; word-break: break-all; }
    .upload-form { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 24px; margin: 20px 0; text-align: left; }
    .upload-form label { display: block; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .upload-form input[type="file"] { width: 100%; padding: 10px; background: #0a0a0a; border: 1px solid #333; border-radius: 6px; color: #fff; margin-bottom: 16px; }
    .upload-form input[type="text"], .upload-form select { width: 100%; padding: 10px; background: #0a0a0a; border: 1px solid #333; border-radius: 6px; color: #fff; margin-bottom: 16px; font-size: 14px; }
    .result { background: #0d2818; border: 1px solid #1a5c2e; border-radius: 8px; padding: 16px; margin-top: 16px; color: #4ade80; font-family: monospace; font-size: 13px; white-space: pre-wrap; word-break: break-all; }
    .error { background: #2d0a0a; border: 1px solid #5c1a1a; color: #f87171; }
    .badge { display: inline-block; background: #1a3a1a; color: #4ade80; padding: 4px 10px; border-radius: 20px; font-size: 11px; margin-bottom: 20px; }
    .badge.disconnected { background: #3a1a1a; color: #f87171; }
    .step-indicator { display: flex; justify-content: center; gap: 8px; margin-bottom: 30px; }
    .step-dot { width: 8px; height: 8px; border-radius: 50%; background: #333; }
    .step-dot.active { background: #25f4ee; }
    .step-dot.done { background: #4ade80; }
  </style>
</head>
<body>
  <div class="container">
    <div class="step-indicator">
      <div class="step-dot ${loggedIn ? 'done' : 'active'}"></div>
      <div class="step-dot ${loggedIn ? 'active' : ''}"></div>
      <div class="step-dot"></div>
    </div>
    
    <h1>Viral Content Manager</h1>
    <p class="subtitle">Schedule and publish video content to TikTok</p>
    
    ${loggedIn ? `
      <span class="badge">Connected to TikTok</span>
      <div class="status">
        <div class="label">Open ID</div>
        <div class="value">${tokenStore.open_id || 'N/A'}</div>
      </div>
      
      <div class="upload-form">
        <form action="/upload" method="POST" enctype="multipart/form-data" id="uploadForm">
          <label>Video file (MP4, max 50MB)</label>
          <input type="file" name="video" accept="video/mp4" required>
          
          <label>Caption</label>
          <input type="text" name="caption" placeholder="Your caption with #hashtags" value="Testing my content manager #fyp #viral">
          
          <label>Privacy level</label>
          <select name="privacy">
            <option value="SELF_ONLY">Private (self only)</option>
            <option value="MUTUAL_FOLLOW_FRIENDS">Friends</option>
            <option value="PUBLIC_TO_EVERYONE">Public</option>
          </select>
          
          <button type="submit" class="btn btn-upload" style="width:100%">Upload to TikTok</button>
        </form>
        <div id="result"></div>
      </div>
      
      <a href="/logout" style="color:#888; font-size:13px;">Disconnect</a>
    ` : `
      <span class="badge disconnected">Not connected</span>
      <a href="/auth" class="btn btn-tiktok">Login with TikTok</a>
    `}
  </div>
  
  <script>
    const form = document.getElementById('uploadForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = '<div class="result">Uploading to TikTok...</div>';
        
        const formData = new FormData(form);
        try {
          const res = await fetch('/upload', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.success) {
            resultDiv.innerHTML = '<div class="result">SUCCESS!\\n\\nPublish ID: ' + data.publish_id + '\\nStatus: ' + data.status + '</div>';
          } else {
            resultDiv.innerHTML = '<div class="result error">ERROR:\\n' + JSON.stringify(data.error, null, 2) + '</div>';
          }
        } catch (err) {
          resultDiv.innerHTML = '<div class="result error">Network error: ' + err.message + '</div>';
        }
      });
    }
  </script>
</body>
</html>`);
});

// ---- OAUTH: START ----
app.get('/auth', (req, res) => {
  const csrfState = Math.random().toString(36).substring(2);
  const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${CONFIG.CLIENT_KEY}&scope=user.info.basic,video.upload,video.publish&response_type=code&redirect_uri=${encodeURIComponent(CONFIG.REDIRECT_URI)}&state=${csrfState}`;
  res.redirect(url);
});

// ---- OAUTH: CALLBACK ----
app.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    return res.send(`<h1>Auth Error</h1><p>${error}</p><a href="/">Back</a>`);
  }
  
  try {
    const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', 
      new URLSearchParams({
        client_key: CONFIG.CLIENT_KEY,
        client_secret: CONFIG.CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: CONFIG.REDIRECT_URI
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    
    tokenStore = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      open_id: response.data.open_id
    };
    
    console.log('Token obtained! Expires in:', response.data.expires_in, 'seconds');
    console.log('Open ID:', response.data.open_id);
    
    res.redirect('/');
  } catch (err) {
    console.error('Token exchange error:', err.response?.data || err.message);
    res.send(`<h1>Token Error</h1><pre>${JSON.stringify(err.response?.data || err.message, null, 2)}</pre><a href="/">Back</a>`);
  }
});

// ---- UPLOAD VIDEO ----
app.post('/upload', upload.single('video'), async (req, res) => {
  if (!tokenStore.access_token) {
    return res.json({ success: false, error: 'Not authenticated' });
  }
  
  if (!req.file) {
    return res.json({ success: false, error: 'No video file provided' });
  }
  
  const videoPath = req.file.path;
  const videoSize = req.file.size;
  const caption = req.body.caption || '';
  const privacy = req.body.privacy || 'SELF_ONLY';
  
  try {
    // Step 1: Initialize the upload
    console.log('Step 1: Initializing upload...');
    const initResponse = await axios.post(
      'https://open.tiktokapis.com/v2/post/publish/video/init/',
      {
        post_info: {
          title: caption,
          privacy_level: privacy,
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoSize,
          chunk_size: videoSize,
          total_chunk_count: 1
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${tokenStore.access_token}`,
          'Content-Type': 'application/json; charset=UTF-8'
        }
      }
    );
    
    console.log('Init response:', JSON.stringify(initResponse.data, null, 2));
    
    if (initResponse.data.error?.code !== 'ok') {
      return res.json({ success: false, error: initResponse.data.error });
    }
    
    const { publish_id, upload_url } = initResponse.data.data;
    
    // Step 2: Upload the video file
    console.log('Step 2: Uploading video to:', upload_url);
    const videoBuffer = fs.readFileSync(videoPath);
    
    await axios.put(upload_url, videoBuffer, {
      headers: {
        'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}`,
        'Content-Length': videoSize,
        'Content-Type': 'video/mp4'
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    console.log('Upload complete!');
    
    // Step 3: Check status
    console.log('Step 3: Checking publish status...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const statusResponse = await axios.post(
      'https://open.tiktokapis.com/v2/post/publish/status/fetch/',
      { publish_id: publish_id },
      {
        headers: {
          'Authorization': `Bearer ${tokenStore.access_token}`,
          'Content-Type': 'application/json; charset=UTF-8'
        }
      }
    );
    
    console.log('Status:', JSON.stringify(statusResponse.data, null, 2));
    
    // Cleanup uploaded file
    fs.unlinkSync(videoPath);
    
    res.json({
      success: true,
      publish_id: publish_id,
      status: statusResponse.data.data?.status || 'PROCESSING'
    });
    
  } catch (err) {
    console.error('Upload error:', err.response?.data || err.message);
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    res.json({ success: false, error: err.response?.data || err.message });
  }
});

// ---- LOGOUT ----
app.get('/logout', (req, res) => {
  tokenStore = { access_token: null, refresh_token: null, open_id: null };
  res.redirect('/');
});

// ---- START SERVER WITH HTTPS (required by TikTok) ----
const https = require('https');

// Generate self-signed cert if not exists
const certDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir);
  console.log('\n=============================================');
  console.log('FIRST RUN: You need to generate SSL certs.');
  console.log('Run this command first:');
  console.log('');
  console.log('  cd certs && openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"');
  console.log('');
  console.log('Then restart: node server.js');
  console.log('=============================================\n');
  process.exit(1);
}

try {
  const httpsOptions = {
    key: fs.readFileSync(path.join(certDir, 'key.pem')),
    cert: fs.readFileSync(path.join(certDir, 'cert.pem'))
  };
  
  https.createServer(httpsOptions, app).listen(CONFIG.PORT, () => {
    console.log('');
    console.log('=============================================');
    console.log('  Viral Content Manager is running!');
    console.log(`  https://localhost:${CONFIG.PORT}`);
    console.log('=============================================');
    console.log('');
    console.log('Next steps:');
    console.log('1. Open https://localhost:3000 in Chrome');
    console.log('2. Chrome will warn about SSL - click "Advanced" > "Proceed"');
    console.log('3. Click "Login with TikTok"');
    console.log('4. Authorize your account');
    console.log('5. Upload a test video');
    console.log('');
  });
} catch (err) {
  console.error('SSL cert error. Run:');
  console.error('  cd certs && openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"');
}

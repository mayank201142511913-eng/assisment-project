const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => res.status(200).send('OK'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));

// Serve React App in Production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
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

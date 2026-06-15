const app = require('./api/index.js');
const express = require('express');
const path = require('path');

// Serve static files from root
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Local dev server running at http://localhost:${PORT}`);
});

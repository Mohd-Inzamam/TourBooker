require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/db');

// Ensure unhandled exceptions and rejections are caught
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

let server;

// Connect to Database, then Start Server
connectDB().then(() => {
  server = app.listen(PORT, () => {
    console.log(`App running on port ${PORT}...`);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

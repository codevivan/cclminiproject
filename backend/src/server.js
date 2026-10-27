const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Test DB connection at startup (non-blocking for development if MySQL is pending setup)
  await testConnection();

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🔗 Health Check: http://localhost:${PORT}/api/health\n`);
  });

  let retries = 0;
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && retries < 3) {
      retries++;
      console.log(`Port ${PORT} busy during reload, retrying in 1.2s... (attempt ${retries}/3)`);
      setTimeout(() => {
        try { server.close(); } catch (_) {}
        server.listen(PORT);
      }, 1200);
      return;
    }
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
      console.error(`👉 Run in PowerShell: Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }\n`);
    } else {
      console.error('Server startup error:', err);
    }
    process.exit(1);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\nStopping server gracefully...');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.once('SIGUSR2', () => {
    server.close(() => {
      process.kill(process.pid, 'SIGUSR2');
    });
  });

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

startServer();

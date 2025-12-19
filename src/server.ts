import app from './app';
import config from './config';
import vectorService from './services/vector.service';

const PORT = config.port;

// Verify Pinecone connection on startup
const startServer = async () => {
  try {
    console.log('Verifying Pinecone connection...');
    await vectorService.verifyConnection();
    console.log('✓ Pinecone connection verified');

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📄 Upload endpoint: http://localhost:${PORT}/api/upload`);
      console.log(`💓 Health check: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();

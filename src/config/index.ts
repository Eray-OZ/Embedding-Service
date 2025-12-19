import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  huggingface: {
    apiKey: string;
    model: string;
  };
  pinecone: {
    apiKey: string;
    indexName: string;
  };
  upload: {
    maxFileSize: number;
    allowedMimeTypes: string[];
  };
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY || '',
    model: 'intfloat/multilingual-e5-large',
  },
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || '',
    indexName: process.env.PINECONE_INDEX_NAME || '',
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['application/pdf'],
  },
};

// Validate required environment variables
const validateConfig = () => {
  const requiredVars = [
    'HUGGINGFACE_API_KEY',
    'PINECONE_API_KEY',
    'PINECONE_INDEX_NAME',
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
};

validateConfig();

export default config;

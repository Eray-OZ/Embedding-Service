# PDF Processing Backend Service - RAG Pipeline

A production-ready REST API service that processes PDF documents for RAG (Retrieval-Augmented Generation) applications. The service extracts text from PDFs, splits it into semantic chunks, generates embeddings using HuggingFace's E5 model, and stores vectors in Pinecone.

## Features

- PDF text extraction and processing
- Intelligent text chunking with semantic splitting
- Automatic embedding generation with E5 model (multilingual-e5-large)
- Batch processing for efficient API usage
- Vector storage in Pinecone with metadata
- Comprehensive error handling and validation
- TypeScript for type safety

## Tech Stack

- **Runtime**: Node.js (LTS)
- **Framework**: Express.js with TypeScript
- **Vector Database**: Pinecone
- **Embedding Model**: intfloat/multilingual-e5-large (1024 dimensions)
- **Model Serving**: HuggingFace Inference API
- **File Processing**: Multer, pdf-parse

## Prerequisites

1. **Node.js** (v18 or higher)
2. **HuggingFace Account** with API key
3. **Pinecone Account** with:
   - API key
   - Pre-created index with 1024 dimensions

## Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build
```

## Configuration

Create a `.env` file in the root directory:

```bash
# Server Configuration
PORT=3000

# Embedding Model
EMBEDDING_MODEL_NAME=intfloat/multilingual-e5-large

# HuggingFace API
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=your_index_name_here
```

### Pinecone Index Setup

Your Pinecone index must be configured with:

- **Dimensions**: 1024 (for E5 model)
- **Metric**: cosine (recommended for text similarity)

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## API Endpoints

### POST /api/upload

Upload and process a PDF file.

**Request:**

- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form field `file` with PDF file

**Example using curl:**

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/document.pdf"
```

**Example using JavaScript:**

```javascript
const formData = new FormData();
formData.append("file", pdfFile);

const response = await fetch("http://localhost:3000/api/upload", {
  method: "POST",
  body: formData,
});

const result = await response.json();
```

**Success Response:**

```json
{
  "success": true,
  "message": "PDF processed successfully",
  "data": {
    "filename": "document.pdf",
    "chunksProcessed": 42,
    "vectorsUpserted": 42,
    "processingTimeMs": 15234
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Only PDF files are allowed"
}
```

### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-12-19T10:55:51.000Z"
}
```

## Project Structure

```
web.embedding.server/
├── src/
│   ├── config/
│   │   └── index.ts              # Environment configuration
│   ├── controllers/
│   │   └── upload.controller.ts  # Upload orchestration logic
│   ├── middleware/
│   │   ├── upload.middleware.ts  # Multer configuration
│   │   └── error.middleware.ts   # Global error handler
│   ├── routes/
│   │   └── upload.routes.ts      # Route definitions
│   ├── services/
│   │   ├── pdf.service.ts        # PDF text extraction
│   │   ├── chunking.service.ts   # Text chunking logic
│   │   ├── embedding.service.ts  # HuggingFace integration
│   │   └── vector.service.ts     # Pinecone operations
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   ├── utils/
│   │   ├── errors.ts             # Custom error classes
│   │   └── validators.ts         # Input validation
│   ├── app.ts                    # Express app setup
│   └── server.ts                 # Server entry point
├── uploads/                       # Temporary file storage
├── .env                          # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Architecture

### Processing Pipeline

1. **File Upload**: Multer validates and stores PDF temporarily
2. **Text Extraction**: pdf-parse extracts text content
3. **Chunking**: Recursive character splitter creates semantic chunks (~750 tokens each)
4. **Embedding**: HuggingFace API generates 1024-dim vectors (with "passage: " prefix)
5. **Storage**: Pinecone stores vectors in batches of 50
6. **Cleanup**: Temporary files are deleted

### Key Implementation Details

- **E5 Model Prefix**: All text chunks are automatically prefixed with "passage: " before embedding (required for E5 model)
- **Batch Processing**:
  - Embeddings: 10 chunks per batch
  - Pinecone upserts: 50 vectors per batch
- **Chunking Strategy**: Splits on sentence boundaries, then paragraphs, then characters
- **Overlap**: 10% overlap between chunks for context preservation
- **Retry Logic**: Exponential backoff for API failures

## Error Handling

The service includes comprehensive error handling:

- **ValidationError** (400): Invalid file type or missing file
- **PDFProcessingError** (422): Corrupted PDF or extraction failure
- **EmbeddingError** (500): HuggingFace API failure
- **VectorStorageError** (500): Pinecone operation failure

## Limitations

- Maximum file size: 10MB
- Supported format: PDF only
- No authentication/authorization (add as needed)
- Single file upload per request

## License

MIT

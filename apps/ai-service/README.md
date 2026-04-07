# Ethereal AI Service

FastAPI-based microservice for ML operations including text embeddings and RAG functionality.

## Features

- **Text Embeddings**: Generate semantic embeddings using sentence-transformers
- **Batch Processing**: Efficient batch embedding generation
- **REST API**: FastAPI with automatic documentation
- **CORS Support**: Configured for cross-origin requests

## Setup

### Prerequisites

- Python 3.9+
- pip

### Installation

1. Create virtual environment:
```bash
cd apps/ai-service
python -m venv venv
```

2. Activate virtual environment:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Service

### Development Mode

```bash
# From apps/ai-service directory
uvicorn src.main:app --reload --port 8000
```

Or using Python directly:
```bash
python src/main.py
```

### Production Mode

```bash
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### Health Check
```
GET /health
```

### Generate Single Embedding
```
POST /embeddings/single
Content-Type: application/json

{
  "text": "Your text here"
}
```

### Generate Batch Embeddings
```
POST /embeddings/batch
Content-Type: application/json

{
  "texts": ["Text 1", "Text 2", "Text 3"]
}
```

### Service Info
```
GET /embeddings/info
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Model Information

- **Default Model**: `all-MiniLM-L6-v2`
- **Dimensions**: 384
- **Max Batch Size**: 100 texts

## Docker Support (Optional)

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t ethereal-ai-service .
docker run -p 8000:8000 ethereal-ai-service
```

## Integration with NestJS API

The NestJS API can call this service using HTTP requests:

```typescript
const response = await axios.post('http://localhost:8000/embeddings/single', {
  text: 'Generate embedding for this text'
});
const embedding = response.data.embedding;
```

## Performance

- Single embedding: ~10-50ms
- Batch (10 texts): ~50-100ms
- Model loading: ~2-5 seconds (on first request)

## Troubleshooting

### Model Download Issues
Models are automatically downloaded on first use to `~/.cache/torch/sentence_transformers/`

### Memory Issues
For large batches, consider reducing batch size or using a smaller model.

### Port Already in Use
Change the port in the uvicorn command:
```bash
uvicorn src.main:app --reload --port 8001
```

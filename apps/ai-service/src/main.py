from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import embeddings

app = FastAPI(
    title="Ethereal AI Service",
    description="ML service for embeddings and RAG functionality",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(embeddings.router, prefix="/embeddings", tags=["embeddings"])

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ethereal-ai-service",
        "version": "1.0.0"
    }

@app.get("/")
def root():
    return {
        "message": "Ethereal AI Service API",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

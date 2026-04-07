from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List
from services.embedding_service import get_embedding_service

router = APIRouter()

class EmbedSingleRequest(BaseModel):
    text: str = Field(..., description="Text to embed", min_length=1)

class EmbedBatchRequest(BaseModel):
    texts: List[str] = Field(..., description="List of texts to embed", min_items=1, max_items=100)

class EmbeddingResponse(BaseModel):
    embedding: List[float] = Field(..., description="Embedding vector")
    dimensions: int = Field(..., description="Number of dimensions")

class BatchEmbeddingResponse(BaseModel):
    embeddings: List[List[float]] = Field(..., description="List of embedding vectors")
    dimensions: int = Field(..., description="Number of dimensions")
    count: int = Field(..., description="Number of embeddings generated")

@router.post("/single", response_model=EmbeddingResponse)
async def embed_single(request: EmbedSingleRequest):
    """
    Generate embedding for a single text
    
    - **text**: The text to embed
    
    Returns the embedding vector and its dimensionality
    """
    try:
        service = get_embedding_service()
        embedding = service.embed(request.text)
        
        return EmbeddingResponse(
            embedding=embedding,
            dimensions=service.get_dimensions()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating embedding: {str(e)}"
        )

@router.post("/batch", response_model=BatchEmbeddingResponse)
async def embed_batch(request: EmbedBatchRequest):
    """
    Generate embeddings for multiple texts
    
    - **texts**: List of texts to embed (max 100)
    
    Returns the embedding vectors and their dimensionality
    """
    try:
        service = get_embedding_service()
        embeddings = service.embed_batch(request.texts)
        
        return BatchEmbeddingResponse(
            embeddings=embeddings,
            dimensions=service.get_dimensions(),
            count=len(embeddings)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating embeddings: {str(e)}"
        )

@router.get("/info")
async def get_info():
    """
    Get information about the embedding service
    
    Returns model information and capabilities
    """
    try:
        service = get_embedding_service()
        
        return {
            "model": "all-MiniLM-L6-v2",
            "dimensions": service.get_dimensions(),
            "max_batch_size": 100,
            "description": "Sentence transformer model for semantic text embeddings"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving service info: {str(e)}"
        )

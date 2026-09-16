from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services import assistant_service

router = APIRouter(prefix="/api/assistant", tags=["Assistant"])

class AssistantQueryRequest(BaseModel):
    query: str
    department_id: Optional[str] = None
    threshold_days: Optional[int] = 7
    history: List[dict] = []
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)

class AssistantQueryResponse(BaseModel):
    query: str
    answer: str
    category: str
    suggestions: List[str] = []
    user_location: Optional[dict] = None
    nearby_places: List[dict] = []

@router.post("/query", response_model=AssistantQueryResponse)
def query_assistant(req: AssistantQueryRequest, db: Session = Depends(get_db)):
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Query string cannot be empty.")
    
    res = assistant_service.process_assistant_query(
        db=db,
        query=req.query,
        department_id=req.department_id,
        threshold_days=req.threshold_days or 7,
        history=req.history,
        latitude=req.latitude,
        longitude=req.longitude,
    )
    return {
        "query": req.query,
        "answer": res["answer"],
        "category": res.get("category", "analytics"),
        "suggestions": res.get("suggestions", [])
        , "user_location": res.get("user_location")
        , "nearby_places": res.get("nearby_places", [])
    }

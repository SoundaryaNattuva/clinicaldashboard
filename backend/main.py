from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, APIRouter, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import Column, Integer, String, Date, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import pandas as pd
import io
from io import BytesIO
from datetime import datetime, date
from pydantic import BaseModel
from typing import List, Optional
from mangum import Mangum


app = FastAPI()
router = APIRouter()

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SQLite setup
DATABASE_URL = "sqlite:///./studies.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
Base = declarative_base()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# SQLAlchemy model
class Study(Base):
    __tablename__ = "studies"
    id = Column(Integer, primary_key=True, index=True)
    studyId = Column(String, unique=True, nullable=False, primary_key=False)
    title = Column(String)
    phase = Column(String)
    status = Column(String)
    enrollmentTarget = Column(Integer)
    currentEnrollment = Column(Integer)
    startDate = Column(Date)
    plannedEndDate = Column(Date)

Base.metadata.create_all(bind=engine)

# Pydantic Model for upate
class StudyUpdate(BaseModel):
    studyId: str
    title: str
    phase: str
    status: str
    enrollmentTarget: int
    currentEnrollment: int
    startDate: date
    plannedEndDate: date

#Schema for new study form
class StudySchema(BaseModel):
    studyId: str
    title: str
    phase: str
    status: str
    enrollmentTarget: int
    currentEnrollment: int
    startDate: date 
    plannedEndDate: date

    class Config:
        orm_mode = True

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#if no date present, handle the case
def safe_iso(date_value):
    return date_value.isoformat() if date_value else None

# When using a Pydantic model (StudyUpdate) for updates
def parse_to_date(value):
    if isinstance(value, date):
        return value
    try:
        return datetime.fromisoformat(value).date()
    except Exception:
        return None

@app.get("/export-excel/")
def export_excel(
    db: Session = Depends(get_db),
    phases: Optional[List[str]] = Query(None),
    statuses: Optional[List[str]] = Query(None),
    start_from: Optional[date] = Query(None),
    start_to: Optional[date] = Query(None),
    end_from: Optional[date] = Query(None),
    end_to: Optional[date] = Query(None),
    columns: Optional[str] = Query(None)
):
    query = db.query(Study)

    if phases:
        query = query.filter(Study.phase.in_(phases))
    if statuses:
        query = query.filter(Study.status.in_(statuses))
    if start_from:
        query = query.filter(Study.startDate >= start_from)
    if start_to:
        query = query.filter(Study.startDate <= start_to)
    if end_from:
        query = query.filter(Study.plannedEndDate >= end_from)
    if end_to:
        query = query.filter(Study.plannedEndDate <= end_to)

    studies = query.all()
    data = [s.__dict__ for s in studies]
    for d in data:
        d.pop("_sa_instance_state", None)

    df = pd.DataFrame(data)
    if columns:
        df = df[columns.split(",")]

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False)
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=custom_export.xlsx"}
    )

#PUT - Edit Study info
@app.put("/studies/{study_id}")
def update_study(study_id: str, payload: StudyUpdate, db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.studyId == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    for key, value in payload.dict().items():
        if key in ["startDate", "plannedEndDate"]:
            value = parse_to_date(value)
        if hasattr(study, key):
            setattr(study, key, value)

    db.commit()
    db.refresh(study)
    return {
        "studyId": study.studyId,
        "title": study.title,
        "phase": study.phase,
        "status": study.status,
        "enrollmentTarget": study.enrollmentTarget,
        "currentEnrollment": study.currentEnrollment,
        "startDate": study.startDate,
        "plannedEndDate": study.plannedEndDate,
    }

#DELETE - Delete Study
@app.delete("/studies/{study_id}")
def delete_study(study_id: str, db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.studyId == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    db.delete(study)
    db.commit()
    return {"message": f"Study {study_id} deleted successfully"}

#POST - Take xl data and POST to DB
@app.post("/upload-excel/")
async def upload_excel(file: UploadFile = File(...),db: Session = Depends(get_db)):

    # 1. Check for incorrect file type - works!
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload an Excel file (.xlsx or .xls)."
        )

    contents = await file.read()
    df = pd.read_excel(io.BytesIO(contents))

    required_columns = [
        "studyId", "title", "phase", "status",
        "enrollmentTarget", "currentEnrollment",
        "startDate", "plannedEndDate"
    ]

    # 2. Check for missing columns
    missing = [col for col in required_columns if col not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"The following required columns are missing: {', '.join(missing)}"
        )
    
    # Convert and validate numeric fields
    try:
        df["enrollmentTarget"] = pd.to_numeric(df["enrollmentTarget"], errors="raise")
        df["currentEnrollment"] = pd.to_numeric(df["currentEnrollment"], errors="raise")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Enrollment fields must be numeric.")

    # Convert and validate date fields
    date_columns = ["startDate", "plannedEndDate"]
    for col in date_columns:
        try:
            df[col] = pd.to_datetime(df[col], errors="raise").dt.date
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid date format in '{col}'")

    # Logical check: startDate must be before plannedEndDate
    if not df[df["startDate"] > df["plannedEndDate"]].empty:
        raise HTTPException(
            status_code=400,
            detail="Some rows have startDate later than plannedEndDate."
        )

    # standardize studyIDs - numbers->strs, remove spaces, uppercase
    df["studyId"] = df["studyId"].astype(str).str.strip().str.upper()

    # In-file duplicates
    in_file_duplicates = df[df.duplicated("studyId", keep=False)]["studyId"].unique()
    if len(in_file_duplicates) > 0:
        raise HTTPException(
            status_code=400,
            detail=f"The uploaded file contains duplicate Study IDs: {', '.join(in_file_duplicates)}"
        )
    
    # In-DB duplicates
    uploaded_ids = df["studyId"].astype(str).str.strip().unique().tolist()
    db_existing = db.query(Study.studyId).filter(Study.studyId.in_(uploaded_ids)).all()
    existing_ids = {row.studyId for row in db_existing}

    uploaded_studies = []
    duplicates = []

    try:
        for _, row in df.iterrows():
            study = Study(
                studyId=row["studyId"],
                title=row["title"],
                phase=row["phase"],
                status=row["status"],
                enrollmentTarget=int(row["enrollmentTarget"]),
                currentEnrollment=int(row["currentEnrollment"]),
                startDate=parse_to_date(row["startDate"]),
                plannedEndDate=parse_to_date(row["plannedEndDate"])
            );

            if study.studyId in existing_ids:
                duplicates.append({
                    "studyId": study.studyId,
                    "title": study.title,
                    "phase": study.phase,
                    "status": study.status,
                    "enrollmentTarget": study.enrollmentTarget,
                    "currentEnrollment": study.currentEnrollment,
                    "startDate": study.startDate.isoformat() if study.startDate else None,
                    "plannedEndDate": study.plannedEndDate.isoformat() if study.plannedEndDate else None,
                })
            else:
                db.add(study)
                uploaded_studies.append({
                    "studyId": study.studyId,
                    "title": study.title,
                    "phase": study.phase,
                    "status": study.status,
                    "enrollmentTarget": study.enrollmentTarget,
                    "currentEnrollment": study.currentEnrollment,
                    "startDate": study.startDate.isoformat() if study.startDate else None,
                    "plannedEndDate": study.plannedEndDate.isoformat() if study.plannedEndDate else None,
                })

        db.commit()

        return {
            "message": "Upload complete",
            "added": uploaded_studies,
            "duplicates": duplicates
        }

    #server side errors
    except Exception as e:
        db.rollback()
        print("Upload error:", e)
        raise HTTPException(status_code=500, detail=f"Failed to save study data: {str(e)}")

    finally:
        db.close()

#POST - form to DB
@app.post("/studies", response_model=StudySchema)
def create_study(study: StudySchema, db: Session = Depends(get_db)):
    # Check for duplicate studyId
    existing = db.query(Study).filter(Study.studyId == study.studyId).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Study ID '{study.studyId}' already exists."
        )

    db_study = Study(**study.dict())
    db.add(db_study)
    db.commit()
    db.refresh(db_study)
    return db_study

# GET all studies from DB
@app.get("/studies")
def get_all_studies(db: Session = Depends(get_db)):
    studies = db.query(Study).all()
    return [
        {
            "studyId": s.studyId,
            "title": s.title,
            "phase": s.phase,
            "status": s.status,
            "enrollmentTarget": s.enrollmentTarget,
            "currentEnrollment": s.currentEnrollment,
            "startDate": safe_iso(s.startDate),
            "plannedEndDate": safe_iso(s.plannedEndDate),
        }
        for s in studies
    ]

@router.put("/override-duplicates/")
def override_duplicates(studies: List[StudyUpdate], db=Depends(get_db)):
    updated = []

    for incoming in studies:
        db_study = db.query(Study).filter(Study.studyId == incoming.studyId).first()

        if not db_study:
            continue  # Optionally skip or collect errors

        db_study.title = incoming.title
        db_study.phase = incoming.phase
        db_study.status = incoming.status
        db_study.currentEnrollment = incoming.currentEnrollment
        db_study.enrollmentTarget = incoming.enrollmentTarget
        db_study.startDate = incoming.startDate
        db_study.plannedEndDate = incoming.plannedEndDate

        updated.append(incoming)

    db.commit()
    return {"updated": [study.dict() for study in updated]}

app.include_router(router)

handler = Mangum(app)
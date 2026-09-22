"""
Kisan Setu - Database Connection & Session Management
=====================================================
Supports PostgreSQL via DATABASE_URL environment variable with automatic
fallback to SQLite for local development and SIH prototype demonstration.
"""

import os
import sys
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure root workspace is on python sys.path so schema.py can be imported cleanly
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from schema import Base

# Read database URL or default to local SQLite database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./kisan_setu.db")

# SQLite requires specific connect_args for multithreading
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initializes tables in database according to SQLAlchemy schema."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency for yielding database session with auto-closure."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

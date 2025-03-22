# Changelog

All notable changes to the Battery Testing Application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-02-28

### Added
- Initial project setup with FastAPI backend
- Database models for test management:
  - Tests table for storing test information
  - Banks table for battery bank details
  - Cycles table for test cycles
  - Readings table for OCV/CCV readings
  - Cell Values table for individual cell measurements
- API endpoints for:
  - Creating and managing battery tests
  - Recording OCV and CCV readings
  - Tracking test cycles and completion
  - Retrieving test results
- Database migrations using Alembic
- CORS middleware for frontend integration
- Basic error handling and input validation
- Environment configuration setup
- Project documentation in README.md

### Technical Details
- FastAPI framework for API development
- PostgreSQL database with SQLAlchemy ORM
- Pydantic models for data validation
- Alembic for database migrations
- UUID-based primary keys for all tables
- Enum types for test status and cell types
- Relationship management between tables
- Automatic calculation of discharge current 
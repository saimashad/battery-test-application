# Battery Testing Application Backend

This is the backend service for the Battery Testing Application, built with FastAPI and PostgreSQL.

## Prerequisites

1. Python 3.8 or higher
2. PostgreSQL installed and running
3. Virtual environment (recommended)

## Setup Instructions

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a PostgreSQL database:
```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE battery_test_db;
```

4. Create a `.env` file in the root directory with the following content:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/battery_test_db
SECRET_KEY=your-secret-key-here
```
Replace `postgres:postgres` with your PostgreSQL username and password.

5. Initialize the database:
```bash
# Make sure you're in the project root directory
cd "path/to/battery test application"

# Run database migrations
alembic upgrade head
```

6. Run the development server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- Interactive API docs: `http://localhost:8000/docs`
- Alternative API docs: `http://localhost:8000/redoc`

## Project Structure

```
.
├── alembic/              # Database migrations
├── app/
│   ├── api/             # API endpoints
│   ├── core/            # Core configurations
│   ├── crud/            # Database CRUD operations
│   ├── db/              # Database session and models
│   ├── schemas/         # Pydantic models
│   └── main.py         # FastAPI application
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Troubleshooting

If you encounter any issues:

1. Make sure PostgreSQL is running:
```bash
# On Windows
net start postgresql

# On Linux
sudo service postgresql status
```

2. Verify database connection:
```bash
psql -U postgres -d battery_test_db
```

3. Check if all required files exist:
- `alembic.ini`
- `alembic/env.py`
- `.env` with correct database URL 
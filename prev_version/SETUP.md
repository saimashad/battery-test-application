# Detailed Setup Guide for Battery Testing Application Backend

## Prerequisites

1. **Python Installation**
   - Download Python 3.8 or higher from [python.org](https://www.python.org/downloads/)
   - During installation, check ✅ "Add Python to PATH"
   - Verify installation:
     ```bash
     python --version
     ```

2. **PostgreSQL Installation**
   - Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/)
   - During installation:
     - Remember the password you set for the postgres user
     - Keep the default port (5432)
     - Install all offered components
   - Verify installation:
     ```bash
     psql --version
     ```

3. **Git (Optional but recommended)**
   - Download from [git-scm.com](https://git-scm.com/downloads)

## Step-by-Step Setup

### 1. Project Setup

1. **Create Project Directory**
   ```bash
   # Create and navigate to project directory
   mkdir "battery test application"
   cd "battery test application"
   ```

2. **Create Virtual Environment**
   ```bash
   # Create virtual environment
   python -m venv venv

   # Activate virtual environment
   # On Windows:
   venv\Scripts\activate
   # On Unix or MacOS:
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

### 2. Database Setup

1. **Start PostgreSQL Service**
   ```bash
   # On Windows:
   net start postgresql
   # On Linux:
   sudo service postgresql start
   ```

2. **Create Database**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   # Enter your PostgreSQL password when prompted

   # Create database
   CREATE DATABASE battery_test_db;
   # Exit psql
   \q
   ```

3. **Configure Environment Variables**
   - Create `.env` file in project root:
     ```env
     DATABASE_URL=postgresql://postgres:your_password@localhost:5432/battery_test_db
     SECRET_KEY=your-secret-key-here
     ```
   - Replace `your_password` with your PostgreSQL password
   - Replace `your-secret-key-here` with a random string

### 3. Database Migration Setup

1. **Initialize Alembic**
   ```bash
   alembic init alembic
   ```

2. **Configure Alembic**
   - Edit `alembic.ini`:
     ```ini
     # Find and update this line
     sqlalchemy.url = postgresql://postgres:your_password@localhost:5432/battery_test_db
     ```
   - Replace `your_password` with your PostgreSQL password

3. **Update Alembic Environment**
   - Edit `alembic/env.py` to include:
     ```python
     from app.core.config import settings
     from app.db.models import Base
     
     # Update the config
     config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
     target_metadata = Base.metadata
     ```

4. **Run Migrations**
   ```bash
   # If you get "type test_status already exists" error:
   # First, drop the existing database
   psql -U postgres
   DROP DATABASE battery_test_db;
   CREATE DATABASE battery_test_db;
   \q

   # Then run migrations
   alembic upgrade head
   ```

### 4. Start the Application

1. **Run the Server**
   ```bash
   uvicorn app.main:app --reload
   ```

2. **Verify Installation**
   - Open browser and visit: `http://localhost:8000`
   - You should see: `{"message": "Welcome to the Battery Testing Application API"}`
   - Visit `http://localhost:8000/docs` for interactive API documentation

## Common Issues and Solutions

### 1. "Python not found" Error
- **Cause**: Python not added to PATH
- **Solution**: 
  1. Uninstall Python
  2. Reinstall Python with "Add Python to PATH" checked
  3. Restart terminal/command prompt

### 2. "psycopg2 installation failed" Error
- **Cause**: Missing PostgreSQL development files
- **Solution**: 
  1. Install PostgreSQL with all components
  2. Add PostgreSQL bin directory to PATH
  3. Restart terminal/command prompt

### 3. "type test_status already exists" Error
- **Cause**: Previous migration attempt left enum types in database
- **Solution**:
  ```bash
  # Connect to PostgreSQL
  psql -U postgres

  # Drop and recreate database
  DROP DATABASE battery_test_db;
  CREATE DATABASE battery_test_db;
  \q

  # Run migrations again
  alembic upgrade head
  ```

### 4. "Module not found" Errors
- **Cause**: Virtual environment not activated
- **Solution**:
  ```bash
  # Activate virtual environment
  # On Windows:
  venv\Scripts\activate
  # On Unix or MacOS:
  source venv/bin/activate
  ```

## Project Structure Explanation

```
battery test application/
├── alembic/              # Database migration files
│   ├── versions/        # Migration scripts
│   └── env.py          # Alembic configuration
├── app/                 # Main application code
│   ├── api/            # API endpoints
│   ├── core/           # Core configurations
│   ├── crud/           # Database operations
│   ├── db/             # Database models
│   ├── schemas/        # Data validation schemas
│   └── main.py         # FastAPI application
├── venv/               # Python virtual environment
├── .env                # Environment variables
├── alembic.ini         # Alembic configuration
├── requirements.txt    # Python dependencies
└── README.md          # Project documentation
```

## Testing the Setup

1. **Create a Test Record**
   - Visit `http://localhost:8000/docs`
   - Find the POST `/api/v1/tests` endpoint
   - Click "Try it out"
   - Enter test data:
     ```json
     {
       "job_number": "TEST001",
       "customer_name": "Test Customer",
       "number_of_cycles": 1,
       "time_interval": 1,
       "start_date": "2024-02-28T00:00:00",
       "banks": [
         {
           "bank_number": 1,
           "cell_type": "KPL",
           "cell_rate": 100,
           "percentage_capacity": 80,
           "number_of_cells": 10
         }
       ]
     }
     ```
   - Click "Execute"

2. **Verify Database**
   ```bash
   psql -U postgres -d battery_test_db
   SELECT * FROM tests;
   SELECT * FROM banks;
   \q
   ```

## Next Steps

1. Review the API documentation at `http://localhost:8000/docs`
2. Test all endpoints
3. Start developing the frontend application
4. Add authentication and security features
5. Implement data validation and error handling 
# Battery Testing Application API Specifications

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication
Currently, the API is open without authentication. Future versions will implement JWT-based authentication.

## Endpoints

### 1. Test Management

#### Create New Test
```http
POST /tests
```

**Request Body:**
```json
{
  "job_number": "string",
  "customer_name": "string",
  "number_of_cycles": "integer (1-5)",
  "time_interval": "integer (1-2)",
  "start_date": "datetime (ISO 8601)",
  "banks": [
    {
      "bank_number": "integer (1-2)",
      "cell_type": "enum (KPL|KPM|KPH)",
      "cell_rate": "float",
      "percentage_capacity": "float (0-100)",
      "number_of_cells": "integer (10-200)"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "job_number": "string",
  "customer_name": "string",
  "number_of_cycles": "integer",
  "time_interval": "integer",
  "start_date": "datetime",
  "status": "enum (scheduled|in_progress|completed)",
  "created_at": "datetime",
  "banks": [
    {
      "id": "uuid",
      "bank_number": "integer",
      "cell_type": "enum",
      "cell_rate": "float",
      "percentage_capacity": "float",
      "discharge_current": "float",
      "number_of_cells": "integer"
    }
  ]
}
```

#### List All Tests
```http
GET /tests
```

**Query Parameters:**
- `skip`: integer (default: 0)
- `limit`: integer (default: 100)

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "job_number": "string",
    "customer_name": "string",
    "number_of_cycles": "integer",
    "time_interval": "integer",
    "start_date": "datetime",
    "status": "enum",
    "created_at": "datetime",
    "banks": [...]
  }
]
```

#### Get Test Details
```http
GET /tests/{test_id}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "job_number": "string",
  "customer_name": "string",
  "number_of_cycles": "integer",
  "time_interval": "integer",
  "start_date": "datetime",
  "status": "enum",
  "created_at": "datetime",
  "banks": [...]
}
```

#### Update Test Status
```http
PUT /tests/{test_id}/status
```

**Request Body:**
```json
{
  "status": "enum (scheduled|in_progress|completed)"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "enum",
  ...
}
```

### 2. Reading Management

#### Create Reading
```http
POST /cycles/{cycle_id}/readings
```

**Request Body:**
```json
{
  "cell_values": ["float"],
  "timestamp": "datetime (ISO 8601)",
  "is_ocv": "boolean",
  "reading_number": "integer"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "cycle_id": "uuid",
  "reading_number": "integer",
  "timestamp": "datetime",
  "is_ocv": "boolean",
  "cell_values": ["float"]
}
```

#### Get Cycle Readings
```http
GET /cycles/{cycle_id}/readings
```

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "cycle_id": "uuid",
    "reading_number": "integer",
    "timestamp": "datetime",
    "is_ocv": "boolean",
    "cell_values": ["float"]
  }
]
```

### 3. Cycle Management

#### Complete Cycle
```http
PUT /cycles/{cycle_id}/complete
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "bank_id": "uuid",
  "cycle_number": "integer",
  "reading_type": "string",
  "start_time": "datetime",
  "end_time": "datetime",
  "duration": "integer"
}
```

## Data Models

### Test
```typescript
interface Test {
  id: string;              // UUID
  job_number: string;      // Unique identifier
  customer_name: string;
  start_date: string;      // ISO 8601 datetime
  start_time: string;      // ISO 8601 datetime
  number_of_cycles: number; // 1-5
  time_interval: number;   // 1-2 (hours)
  status: 'scheduled' | 'in_progress' | 'completed';
  created_at: string;      // ISO 8601 datetime
  banks: Bank[];
}
```

### Bank
```typescript
interface Bank {
  id: string;              // UUID
  test_id: string;         // UUID
  bank_number: number;     // 1-2
  cell_type: 'KPL' | 'KPM' | 'KPH';
  cell_rate: number;
  percentage_capacity: number; // 0-100
  discharge_current: number;
  number_of_cells: number; // 10-200
}
```

### Cycle
```typescript
interface Cycle {
  id: string;              // UUID
  bank_id: string;         // UUID
  cycle_number: number;
  reading_type: string;
  start_time: string;      // ISO 8601 datetime
  end_time?: string;       // ISO 8601 datetime
  duration?: number;       // minutes
}
```

### Reading
```typescript
interface Reading {
  id: string;              // UUID
  cycle_id: string;        // UUID
  reading_number: number;
  timestamp: string;       // ISO 8601 datetime
  is_ocv: boolean;
  cell_values: number[];
}
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "string"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## Frontend Implementation Guidelines

### 1. Test Setup Form
- Implement form validation for all fields
- Calculate discharge current automatically
- Show preview of test configuration
- Handle bank selection (1 or 2)

### 2. Reading Input Interface
- Dynamic grid based on number of cells
- Separate OCV and CCV input forms
- Real-time validation of input values
- Progress tracking for each cycle

### 3. Test Status Dashboard
- List all tests with status indicators
- Filter tests by status
- Show test progress
- Quick actions for each test

### 4. Data Visualization
- Graph OCV/CCV readings over time
- Show test completion percentage
- Display cycle durations
- Compare readings between banks

### 5. Error Handling
- Show validation errors inline
- Display API errors in user-friendly format
- Implement retry mechanisms for failed requests
- Handle network errors gracefully

## API Usage Examples

### Creating a New Test
```javascript
const testData = {
  job_number: "TEST001",
  customer_name: "Example Corp",
  number_of_cycles: 1,
  time_interval: 1,
  start_date: "2024-02-28T00:00:00",
  banks: [
    {
      bank_number: 1,
      cell_type: "KPL",
      cell_rate: 100,
      percentage_capacity: 80,
      number_of_cells: 10
    }
  ]
};

const response = await fetch('http://localhost:8000/api/v1/tests', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
});
```

### Submitting Readings
```javascript
const readingData = {
  cell_values: [3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.0, 4.1],
  timestamp: new Date().toISOString(),
  is_ocv: true,
  reading_number: 1
};

const response = await fetch(`http://localhost:8000/api/v1/cycles/${cycleId}/readings`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(readingData)
});
``` 
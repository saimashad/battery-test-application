# Battery Testing Application MVP - Detailed Masterplan

## MVP Features & Implementation Details

### 1. Test Setup

#### User Interface Components
- **Setup Form**
  - Form with the following fields:
    - Job number (text input)
    - Customer name (text input)
    - Cell type dropdown (KPL/KPM/KPH)
    - Cell rate (numeric input)
    - Percentage Capacity (numeric input)
    - Discharge current (calculated field, displayed automatically)
    - Number of cells (numeric input, range: 10-200)
    - Number of test cycles (numeric input, range: 1-5)
    - Bank number selector (Radio buttons: Bank 1, Bank 2)
    - Time interval selector (Radio buttons: 1 hour, 2 hours)
    - Starting date (date picker)
  - Submit button to initialize test

#### Backend Functionality
- Validation of all input fields
- Calculation of discharge current using formula: `(percentage_capacity * cell_rate) / 100`
- Creation of test record in database
- Initialization of test structure for the specified number of cycles

#### Data Flow
1. User completes form and submits
2. Frontend validates inputs
3. Backend creates test record and initializes structure
4. Redirect to OCV input page

### 2. Data Collection

#### OCV Reading Interface
- **OCV Input Form**
  - Dynamic grid based on number of cells specified
  - Clear labeling of cell numbers
  - Input fields for each cell's OCV reading
  - Visual indicator of completion status
  - Submit button to save OCV readings
  - Automatic timestamp recording when form is opened

#### CCV Reading Interface
- **CCV Input Form**
  - Dynamic grid matching OCV layout
  - Clear indication of current reading number
  - Input fields for each cell's CCV reading
  - Visual indicator of completion status
  - Submit button to save CCV readings
  - Automatic timestamp recording when form is submitted
  - Progress bar or indicator showing test completion percentage

#### Backend Functionality
- Storage of readings with associated timestamps
- Tracking of reading sequence
- Calculation of test duration when final reading is submitted
- Update of test status based on completion criteria

#### Data Flow
1. User navigates to reading input page
2. System presents appropriate form (OCV or CCV)
3. User enters readings for all cells
4. System validates and stores readings with timestamp
5. System updates test progress
6. If final reading, system calculates test duration and updates status

### 3. Data Management

#### Database Schema

**Tests Table**
```
id: UUID (primary key)
job_number: String
customer_name: String
start_date: Date
start_time: Timestamp
number_of_cycles: Integer
time_interval: Integer (hours)
status: String (scheduled/in_progress/completed)
created_at: Timestamp
```

**Banks Table**
```
id: UUID (primary key)
test_id: UUID (foreign key)
bank_number: Integer
cell_type: String
cell_rate: Decimal
percentage_capacity: Decimal
discharge_current: Decimal
number_of_cells: Integer
```

**Cycles Table**
```
id: UUID (primary key)
bank_id: UUID (foreign key)
cycle_number: Integer
reading_type: String (charge/discharge)
start_time: Timestamp
end_time: Timestamp
duration: Integer (minutes)
```

**Readings Table**
```
id: UUID (primary key)
cycle_id: UUID (foreign key)
reading_number: Integer
timestamp: Timestamp
is_ocv: Boolean
```

**Cell Values Table**
```
id: UUID (primary key)
reading_id: UUID (foreign key)
cell_number: Integer
value: Decimal
```

#### Data Retention
- Implement automatic data cleanup process
- Schedule to run monthly
- Remove test data older than 30 days

### 4. Reporting

#### CSV Export Functionality
- **Export Interface**
  - Button to generate CSV for each bank
  - Progress indicator during export generation

#### CSV Structure
- First 5 rows: Test metadata
  ```
  Job Number: [value]
  Customer Name: [value]
  Bank Number: [value]
  Cycle Number: [value]
  Reading Type: [charge/discharge]
  Start Date: [value]
  Start Time: [value]
  End Time: [value]
  Duration: [value]
  ```
- Row 7: Headers for cell data
  ```
  Cell Number, OCV, CCV (Timestamp 1), CCV (Timestamp 2), ...
  ```
- Rows 8+: Cell readings
  ```
  1, [OCV value], [CCV value 1], [CCV value 2], ...
  2, [OCV value], [CCV value 1], [CCV value 2], ...
  ```

#### Backend Processing
- Query database for all readings related to specific bank and cycle
- Format data according to specified structure
- Generate CSV file
- Serve file for download

### 5. Test Status Dashboard

#### Dashboard Interface
- **Overview Grid**
  - Card for each test showing:
    - Job number
    - Customer name
    - Start date
    - Status indicator (color-coded)
    - Progress percentage for in-progress tests
    - Quick actions (view details, export data)

- **Filtering Options**
  - Simple status filter (All/Scheduled/In Progress/Completed)

#### Navigation Elements
- Navbar with links to:
  - Dashboard
  - Create New Test
  - Bank selector (when viewing test details)
  - Cycle selector (when viewing bank details)

#### Backend Functionality
- Query for active tests
- Calculate test progress percentages
- Update test statuses based on completion criteria

## Technical Implementation

### Frontend Structure

**Pages**
1. **Dashboard** (`/`)
   - List of all tests
   - Status filters
   - Create new test button

2. **Test Setup** (`/setup`)
   - Test configuration form

3. **Bank View** (`/test/:testId/bank/:bankId`)
   - Bank details
   - Links to cycles
   - Export options

4. **Cycle View** (`/test/:testId/bank/:bankId/cycle/:cycleId`)
   - Cycle details
   - Reading input interface
   - Progress indicator

**Components**
1. **TestCard**
   - Reusable card for test display on dashboard

2. **ReadingGrid**
   - Dynamic grid for OCV/CCV inputs
   - Handles different numbers of cells

3. **StatusBadge**
   - Visual indicator for test status

4. **ProgressBar**
   - Shows completion percentage

### Backend API Endpoints

**Test Management**
- `POST /api/tests` - Create new test
- `GET /api/tests` - List all tests
- `GET /api/tests/:id` - Get test details
- `PATCH /api/tests/:id` - Update test status

**Bank Management**
- `POST /api/banks` - Create new bank
- `GET /api/banks/:id` - Get bank details

**Cycle Management**
- `POST /api/cycles` - Create new cycle
- `GET /api/cycles/:id` - Get cycle details
- `PATCH /api/cycles/:id` - Update cycle details (end time, duration)

**Reading Management**
- `POST /api/readings` - Create new reading set
- `GET /api/readings/cycle/:cycleId` - Get all readings for cycle

**Export**
- `GET /api/export/bank/:bankId` - Generate and download CSV for bank

### Database Queries

**Create Test**
```sql
INSERT INTO tests (
  job_number, customer_name, start_date, start_time, 
  number_of_cycles, time_interval, status
) VALUES (
  :job_number, :customer_name, :start_date, :start_time, 
  :number_of_cycles, :time_interval, 'scheduled'
) RETURNING id;
```

**Create Bank**
```sql
INSERT INTO banks (
  test_id, bank_number, cell_type, cell_rate, 
  percentage_capacity, discharge_current, number_of_cells
) VALUES (
  :test_id, :bank_number, :cell_type, :cell_rate, 
  :percentage_capacity, :discharge_current, :number_of_cells
) RETURNING id;
```

**Store Reading**
```sql
-- Create reading record
INSERT INTO readings (
  cycle_id, reading_number, timestamp, is_ocv
) VALUES (
  :cycle_id, :reading_number, :timestamp, :is_ocv
) RETURNING id;

-- Store cell values (executed in a loop or batch)
INSERT INTO cell_values (
  reading_id, cell_number, value
) VALUES (
  :reading_id, :cell_number, :value
);
```

**Calculate Duration**
```sql
UPDATE cycles 
SET 
  end_time = :end_time,
  duration = EXTRACT(EPOCH FROM (:end_time - start_time))/60
WHERE id = :cycle_id;
```

## Data Visualization

### Dashboard Visualizations
- Status distribution pie chart (optional enhancement)
- Test completion progress bars

### Test Details Visualizations
- Timeline showing reading intervals
- Completion percentage indicators




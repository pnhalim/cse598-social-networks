# Study Buddy Backend

A FastAPI-based backend API for the Study Buddy application that helps match students with study partners. Features user profile management, A/B testing for frontend designs, and email validation for University of Michigan students.

## Features

- **User Registration & Authentication**: Secure account creation with @umich.edu email validation
- **Profile Management**: Complete user profiles with academic and personal information
- **A/B Testing**: Automatic assignment to different frontend designs (list view vs mutual matching)
- **Email Verification**: Built-in email verification system
- **SQLite Database**: Lightweight, file-based database for easy setup and development
- **Automatic API Documentation**: Interactive API docs at `/docs` and `/redoc`
- **Type Safety**: Full type hints and Pydantic models for data validation
- **High Performance**: Built on FastAPI for excellent performance

## Setup Instructions

### Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

### Quick Setup (Recommended)

**Option 1: Automated Setup Script**
```bash
cd backend

# For Unix/Linux/macOS:
./setup.sh

# For Windows:
setup.bat

# Or using Python (cross-platform):
python setup.py
```

**Option 2: Manual Setup**

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure email settings:**
   ```bash
   # Copy the example environment file
   cp env_example.txt .env
   
   # Edit .env with your email credentials
   # For Gmail, you'll need an App Password (not your regular password)
   # Go to: Google Account > Security > 2-Step Verification > App passwords
   ```

5. **Start the FastAPI server:**
   ```bash
   python app.py
   ```
   Or using uvicorn directly:
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 5000 --reload
   ```
   
   The API will be available at `http://localhost:5000`
   - **Interactive API docs**: `http://localhost:5000/docs`
   - **Alternative docs**: `http://localhost:5000/redoc`

### Database Setup

The application uses SQLite, which requires no additional setup. The database file (`study_buddy.db`) will be automatically created when you first run the application.

**Database Schema:**
- **Users table**: Stores user profiles, academic information, and A/B testing assignments
- **Automatic A/B assignment**: Users are randomly assigned to 'design1' (list view) or 'design2' (mutual matching)

## API Endpoints

### Multi-Step User Registration
The registration process is now split into three steps:

#### Step 1: Email Submission
- **POST** `/api/request-verification` - Submit email and send verification email
- **Required fields**: school_email
- **Email validation**: Must end with @umich.edu

#### Step 2: Password Setup (after email verification)
- **POST** `/api/setup-password/{token}` - Set password after email verification
- **Required fields**: password, confirm_password
- **Password requirements**: Minimum 8 characters

#### Step 3: Profile Completion
- **POST** `/api/complete-profile/{user_id}` - Complete profile setup
- **Required fields**: name, gender, major, academic_year
- **Optional fields**: profile_picture, classes_taking, classes_taken, learn_best_when, study_snack, favorite_study_spot, mbti, yap_to_study_ratio

### Legacy Registration (Backward Compatibility)
- **POST** `/api/register` - Register a new user (legacy endpoint)
- **Required fields**: name, gender, major, school_email, academic_year
- **Email validation**: Must end with @umich.edu

### User Profile Management
- **GET** `/api/user/{user_id}` - Get user profile by ID
- **GET** `/api/user/email/{email}` - Get user profile by email
- **PUT** `/api/user/{user_id}` - Update user profile
- **POST** `/api/user/{user_id}/verify-email` - Manually mark email as verified (admin)

### Email Verification
- **GET** `/api/verify-email/{token}` - Verify email using token from email
- **GET** `/api/reject-email/{token}` - Reject email verification using token from email

### Additional Endpoints
- **GET** `/api/users` - Get all users (for testing)
- **GET** `/api/health` - Health check endpoint

## Testing

Run the test suite to verify all endpoints work correctly:

```bash
python test_api.py
```

Make sure the Flask server is running before executing the tests.

## User Profile Fields

### Multi-Step Registration Fields

#### Step 1: Email Submission
- `school_email`: University email (must be @umich.edu) - **Required**

#### Step 2: Password Setup
- `password`: User's password (minimum 8 characters) - **Required**
- `confirm_password`: Password confirmation - **Required**

#### Step 3: Profile Completion
- `name`: User's full name - **Required**
- `gender`: User's gender - **Required**
- `major`: Academic major - **Required**
- `academic_year`: Current academic year - **Required**

### Optional Profile Fields
- `profile_picture`: URL or path to profile image
- `classes_taking`: JSON string of current classes
- `classes_taken`: JSON string of completed classes
- `learn_best_when`: Response to "I learn best when I ___"
- `study_snack`: Response to "My go-to study snack is ___ because ___"
- `favorite_study_spot`: Response to "Favorite study spot: ___ because ___"
- `mbti`: Myers-Briggs Type Indicator
- `yap_to_study_ratio`: Study vs socializing ratio

### System Fields
- `password_hash`: Hashed password (stored securely)
- `email_verified`: Email verification status (null=pending, true=verified, false=rejected)
- `profile_completed`: Whether profile setup is complete (boolean)
- `frontend_design`: A/B testing assignment ('design1' or 'design2')

## A/B Testing

Users are automatically assigned to one of two frontend designs upon registration:
- **design1**: List view interface
- **design2**: Mutual matching interface

The assignment is random and stored in the user's profile for consistent experience across sessions.

## Email Verification System

The application includes a comprehensive email verification system:

### Verification Status
- **`null`** (Pending): User registered but hasn't verified email yet
- **`true`** (Verified): User clicked verification link in email
- **`false`** (Rejected): User clicked "This is not me" in email (account deleted)

### New Multi-Step Registration Flow
1. **Email Submission**: User submits email → Verification email sent automatically
2. **Email Verification**: User clicks "Verify My Email" → Account marked as verified
3. **Password Setup**: User sets password and confirms password
4. **Profile Completion**: User fills out profile data (name, gender, major, etc.)
5. **Account Ready**: User account is fully set up and ready to use

### Legacy Email Flow (Backward Compatibility)
1. **Registration**: User creates account → Verification email sent automatically
2. **Verification**: User clicks "Verify My Email" → Account marked as verified
3. **Rejection**: User clicks "This is Not Me" → Account deleted from database

### Email Configuration
The system supports multiple email providers:

**Gmail (Recommended for development):**
```env
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password  # Not your regular password!
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
```

**Outlook/Hotmail:**
```env
MAIL_SERVER=smtp-mail.outlook.com
MAIL_PORT=587
```

**Yahoo:**
```env
MAIL_SERVER=smtp.mail.yahoo.com
MAIL_PORT=587
```

### Gmail Setup
1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account > Security > 2-Step Verification > App passwords
3. Generate an app password for "Mail"
4. Use this app password (not your regular password) in the `.env` file

## Development

### Project Structure
```
backend/
├── app.py              # Main FastAPI application
├── database.py         # Database configuration and session management
├── models.py           # SQLAlchemy database models
├── schemas.py          # Pydantic models for request/response validation
├── user_routes.py      # User-related API endpoints
├── general_routes.py   # General API endpoints (health check, etc.)
├── utils.py            # Utility functions
├── email_config.py     # Email configuration
├── email_service.py    # Email sending service
├── email_templates/    # HTML email templates
├── requirements.txt    # Python dependencies
├── test_api.py        # API test suite
├── db_manager.py      # Database management script
├── setup.py           # Python setup script (cross-platform)
├── setup.sh           # Unix/Linux/macOS setup script
├── setup.bat          # Windows setup script
├── env_example.txt    # Environment variables template
├── .gitignore         # Git ignore file
├── study_buddy.db     # SQLite database (created automatically)
└── README.md          # This file
```

### Adding New Features

1. **Database Models**: Update the `User` model in `models.py` for new database fields
2. **Pydantic Schemas**: Add request/response models in `schemas.py`
3. **User Routes**: Add new user-related endpoints in `user_routes.py`
4. **General Routes**: Add new general endpoints in `general_routes.py`
5. **Utility Functions**: Add helper functions in `utils.py`
6. **Testing**: Update the test suite in `test_api.py`
7. **Database**: Run database migrations by restarting the application

### FastAPI Architecture

The application uses FastAPI with modern Python patterns:
- **`app.py`**: Main FastAPI application with CORS and router registration
- **`database.py`**: Database configuration and session management
- **`models.py`**: SQLAlchemy database models
- **`schemas.py`**: Pydantic models for request/response validation and serialization
- **`user_routes.py`**: All user-related API endpoints (registration, profile management)
- **`general_routes.py`**: General endpoints (health check, etc.)
- **`utils.py`**: Helper functions and utilities

### API Documentation

FastAPI automatically generates interactive API documentation:
- **Swagger UI**: Visit `http://localhost:5000/docs` for interactive API testing
- **ReDoc**: Visit `http://localhost:5000/redoc` for alternative documentation
- **OpenAPI Schema**: Available at `http://localhost:5000/openapi.json`

## Troubleshooting

### Common Issues

1. **Database not found**: Run `python app.py` to initialize the database
2. **Port already in use**: Change the port in `app.py` or kill the existing process
3. **Email validation failing**: Ensure emails end with @umich.edu
4. **Import errors**: Make sure all dependencies are installed with `pip install -r requirements.txt`
5. **CORS issues**: The API includes CORS middleware, but you can modify origins in `app.py` for production
6. **API docs not loading**: Make sure the server is running and visit `http://localhost:5000/docs`

### Database Management

#### Using SQLite Command Line
```bash
# Open the database
sqlite3 study_buddy.db

# View all users
SELECT * FROM users;

# View specific columns
SELECT id, name, school_email, frontend_design FROM users;

# Add a user manually
INSERT INTO users (name, gender, major, school_email, academic_year, frontend_design) 
VALUES ('Test User', 'Other', 'Computer Science', 'test@umich.edu', 'Senior', 'design1');

# Update a user
UPDATE users SET name = 'Updated Name' WHERE id = 1;

# Delete a user
DELETE FROM users WHERE id = 1;

# Exit SQLite
.quit
```

#### Using the Database Manager Script
```bash
# List all users
python db_manager.py list

# Get user by ID
python db_manager.py get 1

# Get user by email
python db_manager.py email john@umich.edu

# Delete a user
python db_manager.py delete 1

# Mark email as verified
python db_manager.py verify 1

# Run custom SQL
python db_manager.py sql "SELECT COUNT(*) FROM users"
```

### Database Reset

To reset the database:
```bash
rm study_buddy.db
python app.py
```

This will create a fresh database with the current schema.

# Querying Survey Results

## SQLite (Local Development)

### View all survey responses
```sql
SELECT * FROM survey_responses;
```

### View survey responses with user information
```sql
SELECT 
    sr.id,
    u.id as user_id,
    u.name,
    u.school_email,
    sr.q1_study_alone,
    sr.q2_enjoy_studying_with_others,
    sr.q3_easily_find_study_buddy,
    sr.q4_wish_more_people,
    sr.q5_coordinating_barrier,
    sr.q6_worry_awkward,
    sr.q7_comfortable_approaching,
    sr.q8_comfortable_online_platforms,
    sr.q9_avoid_asking_afraid_no,
    sr.q10_feel_at_ease,
    sr.q11_pressure_keep_studying,
    sr.q12_feel_belong,
    sr.q13_core_group_peers,
    sr.q14_students_open_collaborating,
    sr.q15_hardest_part,
    sr.q16_bad_experience,
    sr.created_at
FROM survey_responses sr
JOIN users u ON sr.user_id = u.id
ORDER BY sr.created_at DESC;
```

### Count survey responses
```sql
SELECT COUNT(*) as total_responses FROM survey_responses;
```

### View average Likert scale responses
```sql
SELECT 
    AVG(q1_study_alone) as avg_study_alone,
    AVG(q2_enjoy_studying_with_others) as avg_enjoy_studying,
    AVG(q3_easily_find_study_buddy) as avg_easily_find,
    AVG(q4_wish_more_people) as avg_wish_more_people,
    AVG(q5_coordinating_barrier) as avg_coordinating_barrier,
    AVG(q6_worry_awkward) as avg_worry_awkward,
    AVG(q7_comfortable_approaching) as avg_comfortable_approaching,
    AVG(q8_comfortable_online_platforms) as avg_comfortable_online,
    AVG(q9_avoid_asking_afraid_no) as avg_avoid_asking,
    AVG(q10_feel_at_ease) as avg_feel_at_ease,
    AVG(q11_pressure_keep_studying) as avg_pressure_keep_studying,
    AVG(q12_feel_belong) as avg_feel_belong,
    AVG(q13_core_group_peers) as avg_core_group_peers,
    AVG(q14_students_open_collaborating) as avg_students_open
FROM survey_responses;
```

### View short answer responses only
```sql
SELECT 
    u.name,
    u.school_email,
    sr.q15_hardest_part,
    sr.q16_bad_experience
FROM survey_responses sr
JOIN users u ON sr.user_id = u.id;
```

## PostgreSQL (Production - Neon)

The same queries work for PostgreSQL. You can also use:

### Connect to database
```bash
# If using Neon CLI
neon connect

# Or use psql with connection string
psql "your-database-connection-string"
```

### View survey responses (PostgreSQL)
```sql
SELECT * FROM survey_responses;
```

### Export to CSV (PostgreSQL)
```sql
\copy (SELECT * FROM survey_responses) TO 'survey_results.csv' CSV HEADER;
```

## Using Python/SQLAlchemy

You can also query programmatically:

```python
from core.database import SessionLocal
from models.models import SurveyResponse, User

db = SessionLocal()
try:
    # Get all survey responses with user info
    results = db.query(SurveyResponse, User).join(User).all()
    
    for survey, user in results:
        print(f"User: {user.name} ({user.school_email})")
        print(f"Q1: {survey.q1_study_alone}")
        print(f"Q15: {survey.q15_hardest_part}")
        print("---")
finally:
    db.close()
```

## Quick Commands

### SQLite (if database is in backend/core/)
```bash
cd backend/core
sqlite3 study_buddy.db "SELECT * FROM survey_responses;"
```

### View specific user's survey
```sql
SELECT * FROM survey_responses WHERE user_id = 1;
```

### Check which users have completed surveys
```sql
SELECT u.id, u.name, u.school_email, u.survey_completed 
FROM users u 
WHERE u.survey_completed = 1;
```


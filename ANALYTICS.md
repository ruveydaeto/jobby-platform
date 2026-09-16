# Growth Analytics Setup

Sistem growth metrics'i almak için tamamen hazırlanmıştır. Tüm user actions otomatik olarak kaydediliyor.

## 📊 Analytics Endpoints

```bash
# Overall metrics (can optionally filter by date range)
GET /api/analytics/metrics
GET /api/analytics/metrics?startDate=2025-01-01&endDate=2025-01-31

# Funnel analysis: signup -> profile completion -> first swipe -> match
GET /api/analytics/funnel

# Daily stats (last 30 days by default)
GET /api/analytics/daily?days=30

# User retention
GET /api/analytics/retention

# Role-based metrics
GET /api/analytics/roles

# Raw events (for external analytics tools)
GET /api/analytics/events?limit=100
```

## 🎯 What's Being Tracked

### Event Types (auto-logged)
- `signup` — User registration
- `login` — User login
- `profile_completed` — First profile completion
- `first_swipe` — Candidate's first job swipe
- `swipe_like` — Candidate liked a job
- `swipe_pass` — Candidate passed a job
- `match_created` — Match between candidate and company
- `job_posted` — Company posted a job

### Data Fields Tracked
Each event has:
- `userId` — User ID
- `eventType` — Type of action
- `timestamp` — ISO format timestamp
- `data` — Additional metadata (jobId, title, category, etc.)

## 📈 Metrics Available

### 1. Overall Growth Metrics
```javascript
{
  totalUsers: 25,
  totalCandidates: 15,
  totalCompanies: 5,
  newUsers: 5,                    // In date range
  conversionRate: "60%",           // Candidates / Users
  signups: 5,
  profilesCompleted: 4,
  firstSwipes: 3,
  totalSwipes: 42,
  totalMatches: 8,
  matchRate: "19.05%"              // Matches / Swipes
}
```

### 2. Funnel Metrics
```javascript
{
  step1_signups: 100,
  step2_profileCompletes: 80,
  step2_completion_rate: "80%",
  step3_firstSwipes: 60,
  step3_swipe_rate: "75%",
  total_funnel_completion: "60%"
}
```

### 3. Daily Stats
```javascript
{
  "2025-01-01": {
    signups: 5,
    swipes: 23,
    matches: 2
  },
  "2025-01-02": {
    signups: 3,
    swipes: 18,
    matches: 1
  },
  ...
}
```

### 4. Retention Metrics
```javascript
{
  total_registered_users: 50,
  active_users_7d: 35,
  active_users_14d: 42,
  active_users_30d: 48,
  retention_7d: "70%",
  retention_14d: "84%",
  retention_30d: "96%"
}
```

### 5. Role Metrics
```javascript
{
  candidates: {
    total: 30,
    active_events: 150,
    swipes: 120,
    matches: 8
  },
  companies: {
    total: 5,
    active_events: 45,
    jobs_posted: 10,
    matches: 8
  }
}
```

## 🔌 Integration Examples

### Using with External Dashboard (e.g., Metabase, Tableau)

1. **Fetch data periodically:**
```javascript
const metrics = fetch('http://localhost:3000/api/analytics/metrics').then(r => r.json());
const daily = fetch('http://localhost:3000/api/analytics/daily?days=90').then(r => r.json());
```

2. **Parse and send to your BI tool:**
```javascript
// Example: Send to your analytics platform
analyticsService.track('daily_metrics', metrics);
```

### Custom Analytics Module

```javascript
// In your growth analytics dashboard
import { getMetrics, getFunnelMetrics, getDailyStats, getRetentionMetrics } from '../analytics.js';

// Get all metrics
const allMetrics = getMetrics();
const funnel = getFunnelMetrics();
const daily = getDailyStats(30);  // Last 30 days
const retention = getRetentionMetrics();

// Use in dashboards
console.log(`Conversion rate: ${allMetrics.conversionRate}`);
console.log(`Signup to match: ${allMetrics.total_funnel_completion}`);
```

## 📝 Database Schema

### Events Table
```javascript
events: [
  {
    id: 1,
    userId: 5,
    eventType: 'signup',
    data: { role: 'candidate', email: 'ela@example.com' },
    timestamp: '2025-01-15T10:30:00Z'
  },
  {
    id: 2,
    userId: 5,
    eventType: 'profile_completed',
    data: { fullName: 'Ela Yıldız' },
    timestamp: '2025-01-15T10:45:00Z'
  },
  // ... more events
]
```

## 🚀 Production Setup

When moving to production database (PostgreSQL/MongoDB):

1. **Add analytics table:**
```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  data JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  INDEX (user_id, timestamp)
);
```

2. **Keep the same analytics.js functions** — they'll work with any database backend

3. **Export data regularly:**
```bash
# Extract data for BI tools
curl http://localhost:3000/api/analytics/events?limit=10000 > events.json
```

## 📌 Notes

- All timestamps are in ISO format (UTC)
- Events are immutable (never deleted, only added)
- First swipe/profile completion tracked to detect new/inactive users
- Date filters use ISO format: `2025-01-31T23:59:59Z`
- Date range filters are inclusive

---

**Ready to plug into your growth dashboard!** 🎯

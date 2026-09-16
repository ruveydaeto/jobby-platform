const db = require('./db');

/**
 * Analytics helper functions for growth metrics
 * Import these in your growth analytics dashboards
 */

function getMetrics(startDate = null, endDate = null) {
  const data = db.load();

  const filterByDate = (items) => {
    return items.filter(item => {
      const itemDate = new Date(item.timestamp || item.createdAt);
      if (startDate && itemDate < new Date(startDate)) return false;
      if (endDate && itemDate > new Date(endDate)) return false;
      return true;
    });
  };

  const allEvents = filterByDate(data.events);
  const allUsers = filterByDate(data.users);

  return {
    // User metrics
    totalUsers: data.users.length,
    totalCandidates: data.candidates.length,
    totalCompanies: data.companies.length,
    newUsers: allUsers.length,

    // Activation funnel
    signups: allEvents.filter(e => e.eventType === 'signup').length,
    profilesCompleted: allEvents.filter(e => e.eventType === 'profile_completed').length,
    firstSwipes: allEvents.filter(e => e.eventType === 'first_swipe').length,

    // Engagement metrics
    totalSwipes: allEvents.filter(e => e.eventType === 'swipe_like' || e.eventType === 'swipe_pass').length,
    totalLikes: allEvents.filter(e => e.eventType === 'swipe_like').length,
    totalPasses: allEvents.filter(e => e.eventType === 'swipe_pass').length,
    totalMatches: data.matches.length,

    // Job metrics
    totalJobsPosted: allEvents.filter(e => e.eventType === 'job_posted').length,
    activeJobs: data.jobs.filter(j => j.status === 'open').length,

    // Derived metrics
    conversionRate: data.users.length > 0 ? (data.candidates.length / data.users.length * 100).toFixed(2) + '%' : '0%',
    matchRate: data.swipes.length > 0 ? (data.matches.length / data.swipes.length * 100).toFixed(2) + '%' : '0%',
    avgLikesPerCandidate: data.candidates.length > 0 ? (allEvents.filter(e => e.eventType === 'swipe_like').length / data.candidates.length).toFixed(2) : '0',

    dateRange: { startDate, endDate }
  };
}

/**
 * Funnel analysis: signup -> profile completion -> first swipe -> match
 */
function getFunnelMetrics() {
  const data = db.load();

  const signups = data.events.filter(e => e.eventType === 'signup');
  const profileCompletes = data.events.filter(e => e.eventType === 'profile_completed');
  const firstSwipes = data.events.filter(e => e.eventType === 'first_swipe');

  const signupUserIds = new Set(signups.map(e => e.userId));
  const completeUserIds = new Set(profileCompletes.map(e => e.userId));
  const swipeUserIds = new Set(firstSwipes.map(e => e.userId));

  return {
    step1_signups: signups.length,
    step2_profileCompletes: profileCompletes.length,
    step2_completion_rate: signups.length > 0 ? (profileCompletes.length / signups.length * 100).toFixed(2) + '%' : '0%',
    step3_firstSwipes: firstSwipes.length,
    step3_swipe_rate: profileCompletes.length > 0 ? (firstSwipes.length / profileCompletes.length * 100).toFixed(2) + '%' : '0%',
    total_funnel_completion: signups.length > 0 ? (firstSwipes.length / signups.length * 100).toFixed(2) + '%' : '0%'
  };
}

/**
 * Daily active users and signups
 */
function getDailyStats(days = 30) {
  const data = db.load();
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const dailyData = {};

  // Initialize dates
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    dailyData[dateStr] = { signups: 0, swipes: 0, matches: 0 };
  }

  // Count events by day
  data.events.forEach(event => {
    const dateStr = new Date(event.timestamp).toISOString().split('T')[0];
    if (dailyData[dateStr]) {
      if (event.eventType === 'signup') dailyData[dateStr].signups++;
      if (event.eventType === 'swipe_like' || event.eventType === 'swipe_pass') dailyData[dateStr].swipes++;
    }
  });

  data.matches.forEach(match => {
    const dateStr = new Date(match.createdAt).toISOString().split('T')[0];
    if (dailyData[dateStr]) dailyData[dateStr].matches++;
  });

  return dailyData;
}

/**
 * User retention: users who logged in in last 7, 14, 30 days
 */
function getRetentionMetrics() {
  const data = db.load();
  const now = new Date();

  const logins = data.events.filter(e => e.eventType === 'login');
  const uniqueUsers = new Set(logins.map(e => e.userId));

  const last7 = logins.filter(e =>
    new Date(e.timestamp) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  );
  const last14 = logins.filter(e =>
    new Date(e.timestamp) > new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  );
  const last30 = logins.filter(e =>
    new Date(e.timestamp) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  );

  return {
    total_registered_users: data.users.length,
    active_users_7d: new Set(last7.map(e => e.userId)).size,
    active_users_14d: new Set(last14.map(e => e.userId)).size,
    active_users_30d: new Set(last30.map(e => e.userId)).size,
    retention_7d: data.users.length > 0 ? (new Set(last7.map(e => e.userId)).size / data.users.length * 100).toFixed(2) + '%' : '0%',
    retention_14d: data.users.length > 0 ? (new Set(last14.map(e => e.userId)).size / data.users.length * 100).toFixed(2) + '%' : '0%',
    retention_30d: data.users.length > 0 ? (new Set(last30.map(e => e.userId)).size / data.users.length * 100).toFixed(2) + '%' : '0%'
  };
}

/**
 * Candidate vs Company metrics
 */
function getRoleMetrics() {
  const data = db.load();

  const candidateUsers = new Set(data.candidates.map(c => c.userId));
  const companyUsers = new Set(data.companies.map(c => c.userId));

  const candidateEvents = data.events.filter(e => candidateUsers.has(e.userId));
  const companyEvents = data.events.filter(e => companyUsers.has(e.userId));

  return {
    candidates: {
      total: data.candidates.length,
      active_events: candidateEvents.length,
      swipes: candidateEvents.filter(e => e.eventType === 'swipe_like' || e.eventType === 'swipe_pass').length,
      matches: data.matches.length
    },
    companies: {
      total: data.companies.length,
      active_events: companyEvents.length,
      jobs_posted: companyEvents.filter(e => e.eventType === 'job_posted').length,
      matches: data.matches.length
    }
  };
}

module.exports = {
  getMetrics,
  getFunnelMetrics,
  getDailyStats,
  getRetentionMetrics,
  getRoleMetrics
};

# Testing Checklist

## Unit Tests

Run all unit tests before deployment:

```bash
pnpm test
```

### Test Coverage

- **Authentication**: Login/logout flow, session management
- **RBAC**: Role-based access control enforcement at tRPC layer
- **Metrics Queries**: Team filtering, time-range filtering, aggregation
- **CSV Export**: Data formatting, file generation, download
- **Database**: Query helpers, user-team relationships

## Integration Tests

### Authentication Flow
- [ ] User can log in with Manus OAuth
- [ ] Session cookie set correctly
- [ ] User role assigned correctly
- [ ] Logout clears session
- [ ] Unauthorized users redirected to login

### Role-Based Access Control
- [ ] Admin user sees all teams
- [ ] Admin user sees all metrics
- [ ] TeamLeader sees only their team
- [ ] TeamLeader cannot access other team metrics
- [ ] Member sees only their team (read-only)
- [ ] Member cannot modify data
- [ ] Unauthorized access returns 403 Forbidden

### Dashboard Pages

#### Overview Page
- [ ] KPI cards load and display data
- [ ] Trend indicators show correctly (up/down)
- [ ] Charts render without errors
- [ ] Time-range selector filters data
- [ ] Team filter works correctly
- [ ] CSV export downloads file
- [ ] Manual refresh button works
- [ ] Last-updated timestamp displays

#### My Team Page
- [ ] Shows only user's team
- [ ] Displays team-specific metrics
- [ ] Charts show team data
- [ ] Time-range selector works
- [ ] CSV export includes team name

#### Reports Page
- [ ] Table displays all metrics
- [ ] Team filter works
- [ ] Summary statistics calculate correctly
- [ ] CSV export includes all data
- [ ] Pagination works (if applicable)

#### Settings Page
- [ ] User profile information displays
- [ ] Role displays correctly
- [ ] Logout button works
- [ ] Preferences load/save

### Real-Time Updates
- [ ] Dashboard auto-refreshes every 30 seconds
- [ ] Manual refresh updates data immediately
- [ ] Last-updated timestamp updates
- [ ] No duplicate requests
- [ ] Handles network errors gracefully

### Charts
- [ ] Line chart renders trend data
- [ ] Bar chart renders team comparisons
- [ ] Pie chart renders metric breakdown
- [ ] Charts are responsive
- [ ] Tooltips display on hover
- [ ] Legend displays correctly
- [ ] Charts handle empty data gracefully

### Filters
- [ ] Time-range selector changes data
- [ ] Team filter changes data
- [ ] Filters work together correctly
- [ ] Filter state persists on page reload (optional)
- [ ] Clear filters button works (if applicable)

## User Acceptance Testing (UAT)

### Functional Requirements

| Feature | Test Case | Expected Result | Status |
|---------|-----------|-----------------|--------|
| Login | User logs in with Manus OAuth | User authenticated and dashboard loads | [ ] |
| Dashboard | Admin views Overview page | All teams visible in team filter | [ ] |
| Dashboard | TeamLeader views Overview page | Only their team visible | [ ] |
| KPI Cards | View KPI cards | All 4 metrics display with trends | [ ] |
| Charts | View trend chart | Line chart shows hourly/daily trends | [ ] |
| Charts | View team comparison | Bar chart shows multiple teams | [ ] |
| Charts | View breakdown | Pie chart shows metric distribution | [ ] |
| Time Range | Select "Today" | Data filtered to today only | [ ] |
| Time Range | Select "Last 7 Days" | Data filtered to 7 days | [ ] |
| Time Range | Select "Last 30 Days" | Data filtered to 30 days | [ ] |
| Team Filter | Select specific team | All data filtered to team | [ ] |
| Export | Click export CSV | CSV file downloads with data | [ ] |
| Refresh | Click manual refresh | Data updates immediately | [ ] |
| My Team | TeamLeader views My Team | Shows team-specific metrics | [ ] |
| Reports | View reports table | All metrics displayed in table | [ ] |
| Reports | Export report | CSV includes all data | [ ] |
| Settings | View settings | User info displays correctly | [ ] |
| Settings | Click logout | User logged out and redirected | [ ] |

### Non-Functional Requirements

| Requirement | Test Case | Expected Result | Status |
|-------------|-----------|-----------------|--------|
| Performance | Load dashboard | Page loads in < 3 seconds | [ ] |
| Performance | Render charts | Charts render in < 1 second | [ ] |
| Performance | Export CSV | Export completes in < 5 seconds | [ ] |
| Accessibility | Keyboard navigation | All features accessible via keyboard | [ ] |
| Accessibility | Screen reader | Page readable with screen reader | [ ] |
| Accessibility | ARIA labels | All interactive elements labeled | [ ] |
| Responsive | Mobile view | Layout works on 375px width | [ ] |
| Responsive | Tablet view | Layout works on 768px width | [ ] |
| Responsive | Desktop view | Layout works on 1920px width | [ ] |
| Security | RBAC | Unauthorized access denied | [ ] |
| Security | HTTPS | All traffic encrypted | [ ] |
| Security | XSS | No script injection possible | [ ] |

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab key navigates through all interactive elements
- [ ] Shift+Tab navigates backwards
- [ ] Enter key activates buttons
- [ ] Space key activates checkboxes
- [ ] Arrow keys navigate dropdowns
- [ ] Escape key closes modals/dropdowns
- [ ] Focus visible on all interactive elements

### Screen Reader Testing (NVDA/JAWS)
- [ ] Page title announced
- [ ] Headings announced with level
- [ ] Form labels associated with inputs
- [ ] Button purposes clear
- [ ] Chart data accessible
- [ ] Error messages announced
- [ ] Status updates announced

### Color Contrast
- [ ] Text contrast ratio >= 4.5:1 for normal text
- [ ] Text contrast ratio >= 3:1 for large text
- [ ] No information conveyed by color alone
- [ ] Charts use distinct colors/patterns

### ARIA Labels
- [ ] All buttons have aria-label or text
- [ ] All form inputs have labels
- [ ] Charts have aria-label
- [ ] Live regions marked with aria-live
- [ ] Regions have aria-label

## Performance Testing

### Load Time
- [ ] First Contentful Paint (FCP) < 1.5s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] Time to Interactive (TTI) < 3.5s

### Database Performance
- [ ] Metrics query completes in < 500ms
- [ ] Team list query completes in < 100ms
- [ ] Summary query completes in < 200ms
- [ ] No N+1 queries

### Memory Usage
- [ ] Initial load < 50MB
- [ ] No memory leaks on page navigation
- [ ] Charts don't cause memory spikes
- [ ] Long sessions stable

## Security Testing

### Authentication
- [ ] Session token cannot be forged
- [ ] Session expires after inactivity
- [ ] CSRF protection enabled
- [ ] Password reset flow secure

### Authorization
- [ ] Users cannot access other team data
- [ ] Users cannot modify data they don't own
- [ ] Admin-only endpoints require admin role
- [ ] API returns 403 for unauthorized access

### Data Protection
- [ ] Sensitive data not logged
- [ ] Database credentials not exposed
- [ ] API keys not in frontend code
- [ ] Audit log records all access

### Input Validation
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] CSRF tokens validated
- [ ] Rate limiting enforced

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | [ ] |
| Firefox | Latest | [ ] |
| Safari | Latest | [ ] |
| Edge | Latest | [ ] |

## Device Testing

| Device | Screen Size | Status |
|--------|------------|--------|
| iPhone 12 | 390x844 | [ ] |
| iPad | 768x1024 | [ ] |
| Desktop | 1920x1080 | [ ] |

## Sign-Off

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] UAT complete and approved
- [ ] Accessibility testing complete
- [ ] Performance testing complete
- [ ] Security testing complete
- [ ] Browser compatibility verified
- [ ] Device compatibility verified

**QA Lead**: _________________ **Date**: _______

**Product Owner**: _________________ **Date**: _______

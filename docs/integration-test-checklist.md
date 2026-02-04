# Integration Test Checklist

This document outlines manual integration test scenarios for the Research Mind UI when testing against the backend service.

## Prerequisites

- Backend service running on `http://localhost:15010`
- Frontend dev server running on `http://localhost:15000`
- Verify service health: `curl http://localhost:15010/health`

---

## 1. Session CRUD Flow

### 1.1 Create Session
- [ ] Navigate to `/sessions`
- [ ] Click "New Session" button in sidebar
- [ ] Verify form displays with name (required) and description (optional)
- [ ] Test validation:
  - [ ] Empty name shows error
  - [ ] Name > 255 characters shows error
  - [ ] Description > 1024 characters shows error
- [ ] Fill valid data and submit
- [ ] Verify toast notification appears
- [ ] Verify redirect to session detail page
- [ ] Verify session appears in sidebar list

### 1.2 View Session
- [ ] Click on a session in sidebar
- [ ] Verify Overview tab shows:
  - [ ] Session name and description
  - [ ] Status badge
  - [ ] Created date
  - [ ] Last accessed (relative time)
  - [ ] Workspace path
  - [ ] Indexing status
- [ ] Verify all tabs are accessible (Overview, Indexing, Audit, Settings)

### 1.3 Update Session
- [ ] Navigate to session Settings tab
- [ ] Click "Edit" button
- [ ] Modify name and description
- [ ] Verify "Save Changes" disabled when no changes
- [ ] Verify validation errors display correctly
- [ ] Save changes
- [ ] Verify toast notification appears
- [ ] Verify changes reflected in UI

### 1.4 Archive/Restore Session
- [ ] In Settings, click "Archive Session"
- [ ] Confirm in dialog
- [ ] Verify session moves to "Archived" section in sidebar
- [ ] Verify status badge shows "Archived"
- [ ] Click "Restore Session"
- [ ] Verify session moves back to "Active" section

### 1.5 Delete Session
- [ ] In Settings, click "Delete Session" in Danger Zone
- [ ] Verify confirmation dialog shows session name
- [ ] Confirm deletion
- [ ] Verify redirect to sessions list
- [ ] Verify session no longer appears in sidebar

---

## 2. Content Management Flow

### 2.1 Add Content
- [ ] Navigate to session Overview
- [ ] Click "Add Content" button
- [ ] Test adding text content:
  - [ ] Fill title and content
  - [ ] Submit and verify success toast
  - [ ] Verify content appears in list
- [ ] Test adding URL content:
  - [ ] Enter valid URL
  - [ ] Submit and verify success toast
- [ ] Test validation:
  - [ ] Empty required fields show error
  - [ ] Invalid URL format shows error

### 2.2 View Content List
- [ ] Verify content items display:
  - [ ] Title
  - [ ] Content type badge
  - [ ] Source (if URL)
  - [ ] Created date
- [ ] Verify empty state shows when no content

### 2.3 Delete Content
- [ ] Click delete button on content item
- [ ] Confirm in dialog
- [ ] Verify content removed from list
- [ ] Verify success toast appears

---

## 3. Indexing Flow

### 3.1 View Index Status
- [ ] Navigate to session Indexing tab
- [ ] Verify current status displays:
  - [ ] Indexed/Not Indexed badge
  - [ ] Status message
  - [ ] Last indexed time (if applicable)
  - [ ] File count (if indexed)

### 3.2 Trigger Indexing
- [ ] Click "Index Workspace" button
- [ ] Verify loading state during indexing
- [ ] Verify success/error toast after completion
- [ ] Verify status updates to reflect new index state
- [ ] Test "Force reindex" checkbox option
- [ ] View stdout/stderr output in expandable details

### 3.3 Index Error Handling
- [ ] Test with invalid workspace path
- [ ] Verify error message displays
- [ ] Verify retry button works

---

## 4. Audit Log Flow

### 4.1 View Audit Logs
- [ ] Navigate to session Audit tab
- [ ] Verify table displays:
  - [ ] Log ID
  - [ ] Timestamp
  - [ ] Action type
  - [ ] Status (success/error)
  - [ ] Duration
  - [ ] Details (expandable)
- [ ] Verify empty state when no logs

### 4.2 Pagination
- [ ] Create enough audit entries (>20)
- [ ] Verify pagination controls appear
- [ ] Test Previous/Next buttons
- [ ] Verify page info displays correctly
- [ ] Verify "Showing X-Y of Z" count

### 4.3 Responsive View
- [ ] Test on mobile viewport (< 768px)
- [ ] Verify table transforms to card view
- [ ] Verify all information accessible

---

## 5. Navigation and Layout

### 5.1 Sidebar Navigation
- [ ] Verify sidebar shows on desktop (>= 1024px)
- [ ] Verify sidebar collapses on mobile/tablet
- [ ] Test hamburger menu toggle
- [ ] Test keyboard shortcut (Ctrl+K or /) for search
- [ ] Verify search filters sessions correctly
- [ ] Verify current session highlighted in sidebar

### 5.2 Session Tabs
- [ ] Verify active tab indicator
- [ ] Verify tab navigation works
- [ ] Verify URL updates with tab changes
- [ ] Verify direct URL access to tabs works

### 5.3 Theme Toggle
- [ ] Click theme toggle button in header
- [ ] Verify theme switches between light/dark
- [ ] Verify preference persists on refresh

### 5.4 Breadcrumb Navigation
- [ ] Verify breadcrumb shows on desktop
- [ ] Verify links are clickable
- [ ] Verify current page is not a link

---

## 6. Error Handling

### 6.1 API Errors
- [ ] Stop backend service
- [ ] Verify error states display appropriately
- [ ] Verify retry buttons work
- [ ] Verify toast notifications for errors

### 6.2 404 Handling
- [ ] Navigate to non-existent session ID
- [ ] Verify redirect to sessions list
- [ ] Navigate to invalid route
- [ ] Verify error page displays

### 6.3 Network Errors
- [ ] Simulate slow connection
- [ ] Verify loading states display
- [ ] Verify timeout handling

---

## 7. Accessibility

### 7.1 Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators visible
- [ ] Test Enter to activate buttons/links
- [ ] Test Escape to close modals
- [ ] Test arrow keys in dropdowns

### 7.2 Screen Reader
- [ ] Verify ARIA labels on icons
- [ ] Verify form labels associated
- [ ] Verify error messages announced
- [ ] Verify status updates announced (live regions)

### 7.3 Skip Link
- [ ] Tab on page load
- [ ] Verify "Skip to main content" link appears
- [ ] Verify it focuses main content area

---

## 8. Responsive Design

### 8.1 Mobile (320px)
- [ ] Verify all content accessible
- [ ] Verify touch targets >= 44px
- [ ] Verify sidebar is full-width overlay
- [ ] Verify forms are usable
- [ ] Verify tables transform appropriately

### 8.2 Tablet (768px)
- [ ] Verify sidebar behavior
- [ ] Verify content layout adapts

### 8.3 Desktop (1024px+)
- [ ] Verify sidebar always visible
- [ ] Verify optimal content width
- [ ] Verify all features accessible

### 8.4 Large Desktop (1440px+)
- [ ] Verify content doesn't stretch too wide
- [ ] Verify layout remains usable

---

## 9. Performance

### 9.1 Initial Load
- [ ] Verify page loads within 3 seconds
- [ ] Verify no layout shift during load
- [ ] Verify loading states show immediately

### 9.2 Navigation
- [ ] Verify client-side navigation is instant
- [ ] Verify data fetching shows loading states
- [ ] Verify cache works (revisiting pages)

### 9.3 Large Data Sets
- [ ] Test with 100+ sessions
- [ ] Test with 1000+ audit logs
- [ ] Verify pagination handles large counts

---

## Test Environment Setup

```bash
# Start backend
cd research-mind-service
make dev

# Start frontend
cd research-mind-ui
npm run dev

# Verify connectivity
curl http://localhost:15010/api/v1/version
```

## Reporting Issues

When reporting issues found during integration testing:

1. Note the test scenario (e.g., "2.1 Add Content")
2. Describe expected vs actual behavior
3. Include browser and viewport size
4. Include console errors if any
5. Include network tab details for API issues

# Notice Approval Workflow Feature

## 🎯 Feature Overview

Implemented a comprehensive approval workflow system that allows admins to review and approve notices submitted by staff members before they are published to all users.

## ✨ Implementation Details

### Components Added

1. **Pending Approvals Page** (`/admin/pending-approvals`)

   - Dedicated page for admins to review pending notices
   - Shows count of notices awaiting approval
   - List view with all pending notice details
   - Quick actions: Approve, Review Details, Reject
2. **Notice Detail Approval** (`/notices/:id`)

   - Approve button on notice detail pages
   - Visible only to admins for unapproved notices
   - Visual alert showing pending status
3. **Dashboard Integration**

   - "Review Pending Notices" button in Quick Actions
   - Badge showing count of pending approvals
   - Orange/alert color scheme for visibility
4. **Sidebar Navigation**

   - "Pending Approvals" link added to admin navigation
   - Clock icon for visual consistency

## 🔄 Workflow Process

### Staff Creates Notice

1. Staff member creates a notice via "Create Notice" page
2. Notice is saved with `isApproved: false`
3. Notice is visible only to:

   - The author (staff who created it)
   - Admins (for approval)
4. Students cannot see unapproved notices

### Admin Reviews Notice

1. Admin sees notification in dashboard
2. Admin navigates to "Pending Approvals" page
3. Admin reviews notice details:

   - Title, content, category
   - Author information
   - Submission timestamp
   - Department (if specified)

### Admin Approves/Rejects

**Option 1: Approve**

- Click "Approve" button
- Notice `isApproved` set to `true`
- Notice becomes visible to all users
- Removed from pending approvals list

**Option 2: Reject**

- Click "Reject" button
- Confirmation dialog appears
- Notice is deleted from system
- Author may need to resubmit

**Option 3: Review Details**

- Click "Review Details" to see full notice
- Can approve from detail page
- Can view comments and interactions
- Can delete if necessary

## 🎨 UI Features

### Pending Approvals Page

**Stats Card:**

- Orange clock icon
- Large count number
- Descriptive text: "X Notice(s) awaiting your approval"

**Notice Cards:**

- Left border: Orange (4px) to indicate pending status
- Badges:

  - Category badge (color-coded)
  - "Pending Review" badge (orange)
  - "Pinned" badge (if applicable)
- Content:

  - Notice title (large, bold)
  - Summary/preview (3 lines max)
  - Author info with role
  - Submission timestamp
- Actions:

  - Green "Approve" button (primary action)
  - Outlined "Review Details" button
  - Red "Reject" button (destructive)

### Notice Detail Page

**Pending Alert:**

- Orange background alert at top
- Clock icon
- Different messages for admin vs staff:

  - Admin: "Review and approve to publish"
  - Staff: "Pending admin approval"

**Approve Button:**

- Green background (`bg-green-600`)
- Check icon
- Text: "Approve Notice"
- Positioned next to Delete button

### Dashboard Integration

**Quick Actions Card:**

- "Review Pending Notices" button
- Orange color scheme (bg-orange-50)
- Alert icon
- Badge with count (orange circle)
- Only visible to admins
- Only shown when there are pending notices

## 🔧 Technical Implementation

### API Endpoints Used

**Approve Notice:**

```typescript

POST/api/notices/:id/approve

```

- Admin only
- Sets `isApproved: true`
- Returns success response

**Fetch Notices:**

```typescript

GET/api/notices?limit=100

```

- Filters based on user role
- Staff see own + approved
- Students see only approved
- Admins see all

### Frontend Logic

**Permission Checks:**

```typescript

const canApprove = user?.role ==='admin'&&!notice.isApproved

```

**State Management:**

```typescript

const[pendingNotices, setPendingNotices]= useState<NoticeWithAuthor[]>([])

const[pendingCount, setPendingCount]= useState(0)

```

**Approval Handler:**

```typescript

const handleApprove =async(noticeId:string)=>{

  const response =await fetch(`/api/notices/${noticeId}/approve`,{

    method:'POST',

    credentials:'include',

  })

  

  if(response.ok){

    // Remove from pending list (optimistic update)

    setPendingNotices(pendingNotices.filter(item => item.notice.id !== noticeId))

  }

}

```

## ✅ Features Implemented

- ✅ Dedicated Pending Approvals page for admins
- ✅ Approve button on notice detail pages
- ✅ Reject functionality with confirmation
- ✅ Review Details link to full notice
- ✅ Real-time count of pending notices
- ✅ Dashboard notification badge
- ✅ Sidebar navigation link
- ✅ Visual alerts for pending status
- ✅ Optimistic UI updates (no page reload needed)
- ✅ Role-based visibility
- ✅ Color-coded UI for urgent actions

## 📊 User Roles & Permissions

### Admin

- ✅ See all notices (approved and pending)
- ✅ Approve staff notices
- ✅ Reject staff notices
- ✅ Access Pending Approvals page
- ✅ See pending count in dashboard

### Staff

- ✅ Create notices (pending approval)
- ✅ See own notices (even if pending)
- ✅ See approved notices from others
- ✅ Cannot approve own notices
- ✅ See "Pending approval" message on own notices

### Students

- ✅ See only approved notices
- ❌ Cannot see pending notices
- ❌ No approval functionality
- ✅ Full interaction with approved notices

## 🎯 Workflow Benefits

1. **Quality Control**: Admins review content before publication
2. **Spam Prevention**: Prevents unauthorized or inappropriate notices
3. **Content Moderation**: Ensures institutional standards
4. **Accountability**: Activity logs track who approved what
5. **User Experience**: Students only see verified information
6. **Efficiency**: Quick approve/reject actions
7. **Transparency**: Staff know approval status

## 🧪 Testing

### Manual Testing Completed

1. ✅ Created notice as staff - shows as pending
2. ✅ Verified student cannot see pending notice
3. ✅ Admin sees pending count in dashboard
4. ✅ Navigated to Pending Approvals page
5. ✅ Approved notice - immediately updated
6. ✅ Verified approved notice visible to students
7. ✅ Tested reject functionality with confirmation
8. ✅ Verified "Review Details" navigation
9. ✅ Tested approve button on notice detail page
10. ✅ Verified optimistic UI updates

### Test Scenarios

**Scenario 1: Staff Creates Notice**

```

Given: User is logged in as staff

When: They create a new notice

Then: Notice is saved with isApproved=false

And: Notice visible only to staff and admin

```

**Scenario 2: Admin Approves Notice**

```

Given: Admin is on Pending Approvals page

When: Admin clicks "Approve" on a notice

Then: Notice isApproved set to true

And: Notice removed from pending list

And: Notice visible to all users

```

**Scenario 3: Admin Rejects Notice**

```

Given: Admin is reviewing pending notice

When: Admin clicks "Reject" and confirms

Then: Notice is deleted from system

And: Removed from pending list

```

## 📱 UI Screenshots

### Pending Approvals Page

- Header with page title
- Stats card showing pending count
- List of pending notice cards
- Each card with approve/reject buttons

### Dashboard Integration

- Quick Actions section
- "Review Pending Notices" button with badge
- Orange alert styling

### Notice Detail Page

- Orange pending alert at top
- Green "Approve Notice" button
- Visible only for admins on pending notices

## 🚀 Future Enhancements

Potential improvements:

- [ ] Bulk approve/reject functionality
- [ ] Approval comments/feedback to staff
- [ ] Email notifications to staff on approval/rejection
- [ ] Approval history/audit trail
- [ ] Scheduled approvals
- [ ] Multi-level approval workflow
- [ ] Approval templates/reasons for rejection
- [ ] Auto-approval based on rules
- [ ] Approval reminders for admins

## 📊 Statistics & Metrics

- **Pages Created**: 1 (PendingApprovals.tsx)
- **Pages Modified**: 3 (Dashboard, NoticeDetail, DashboardLayout)
- **Routes Added**: 1 (/admin/pending-approvals)
- **API Endpoints Used**: 2 (approve, notices list)
- **Components Updated**: Dashboard card, Sidebar nav
- **Lines of Code**: ~300+ lines
- **Testing Time**: Fully tested with real workflow

## ✅ Status

**Implementation Status**: ✅ Complete and Tested

- Pending Approvals page: ✅ Working
- Approve functionality: ✅ Working
- Reject functionality: ✅ Working
- Dashboard integration: ✅ Working
- Sidebar navigation: ✅ Working
- Notice detail approval: ✅ Working
- Role-based visibility: ✅ Working
- UI/UX: ✅ Polished

---

**Feature completed on**: October 24, 2025

**Implemented by**: devlo AI Assistant

**Related files**:

- `src/pages/PendingApprovals.tsx` (new)
- `src/pages/Dashboard.tsx` (modified)
- `src/pages/NoticeDetail.tsx` (modified)
- `src/components/DashboardLayout.tsx` (modified)
- `src/App.tsx` (modified)
- `scripts/create-pending-notice.ts` (new)

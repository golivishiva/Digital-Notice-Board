# Digital Notice Board - Educational Institution Platform

A comprehensive, cloud-integrated, AI-powered digital notice board platform for educational institutions built with modern web technologies.

## 🌟 Features

### Core Features

- **Role-Based Access Control**

  - Admin: Full system access, user management, notice approval
  - Staff: Create and manage notices, view analytics
  - Student: View notices, comment, like, bookmark

### Notice Management

- ✅ Create, edit, delete, and archive notices
- ✅ Auto-categorization using AI (keyword-based)
- ✅ Auto-summary generation
- ✅ Pin important notices
- ✅ Schedule publish/expiry dates
- ✅ Department-specific notices
- ✅ Search and filter functionality

### User Features

- ✅ Secure authentication with bcrypt-level password hashing (PBKDF2)
- ✅ Email and username uniqueness
- ✅ Activity logging for audit trails
- ✅ Soft delete with 30-day recovery option

### Student Features

- ✅ View and search notices in real-time
- ✅ Like, comment, and bookmark notices
- ✅ Acknowledge important notices
- ✅ Track engagement metrics

### Admin Features

- ✅ Manage users (create, update, soft delete, restore)
- ✅ Approve/reject staff notices
- ✅ View analytics dashboard
- ✅ Activity logs monitoring
- ✅ User role management

### Analytics & Insights

- ✅ Total views, likes, comments tracking
- ✅ Category-wise distribution
- ✅ Recent notices performance
- ✅ User engagement statistics

### Accessibility Features

- ✅ Responsive design for mobile and desktop
- ✅ Dark mode toggle
- ✅ High contrast elements
- ✅ Semantic HTML structure
- ✅ Keyboard navigation support
- ✅ Screen reader friendly

## 🛠️ Technology Stack

### Frontend

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **React Router** for navigation
- **Lucide React** for icons

### Backend

- **Cloudflare Workers** (edge computing)
- **Hono.js** web framework
- **D1 Database** (SQLite-based)
- **Drizzle ORM** for database operations
- **R2 Storage** for file attachments

### Security

- PBKDF2 password hashing with 100,000 iterations
- HTTP-only cookies for session management
- SQL injection protection via ORM
- Input validation and sanitization
- Activity logging for audit trails

## 📦 Database Schema

### Tables

- **users** - User accounts with role-based access
- **sessions** - Secure session management
- **notices** - Notice posts with metadata
- **attachments** - File storage references (R2)
- **interactions** - User engagement (views, likes, bookmarks, acknowledgments)
- **comments** - Notice comments
- **activity_logs** - Audit trail
- **verification_tokens** - Email verification and password reset
- **notifications** - Push/email notifications

## 🚀 Getting Started

### Demo Credentials

**Admin Access:**

- Email: admin@institution.edu
- Password: admin123

**Staff Access:**

- Email: staff@institution.edu
- Password: staff123

**Student Access:**

- Email: student@institution.edu
- Password: student123

### Local Development

1. The app is already running at http://localhost:3002
2. Demo data has been seeded
3. Access the application through your browser

### Database Migrations

```bash

# Generate new migration

bun run db:generate


# Apply migrations locally

wrangler d1 migrations apply devlo-demo-app --local

```

### Seed Demo Data

```bash

bun run scripts/seed-demo-data.ts

```

## 📱 Key Pages

### Public Pages

- `/login` - User authentication
- `/register` - New user registration

### Protected Pages

- `/dashboard` - Main dashboard with stats and quick actions
- `/notices` - Browse all notices with filters
- `/notices/:id` - View notice details, comment, interact
- `/notices/create` - Create new notice (Staff/Admin only)
- `/admin/users` - User management (Admin only)
- `/analytics` - Analytics dashboard (Admin/Staff)
- `/admin/logs` - Activity logs (Admin only)

## 🎨 Design Features

- Clean, modern UI with professional color scheme
- Gradient accents (blue to purple)
- Card-based layout for content
- Responsive grid system
- Smooth transitions and hover effects
- Category-coded badges
- Avatar circles with user initials
- Dark mode support

## 🔐 Security Features

- Password hashing with PBKDF2 (100k iterations, SHA-256)
- Per-user salt storage
- HTTP-only secure cookies
- Session expiry (7 days default)
- Input validation and sanitization
- SQL injection prevention via ORM
- Activity logging for audit trails
- Soft delete for data recovery

## 📊 AI Features

### Auto-Categorization

- Keyword-based categorization
- Categories: Exams, Events, Holidays, Sports, General, Emergency
- Automatic assignment based on content analysis

### Auto-Summary

- Generates concise summaries (150 characters)
- Preserves key information
- Improves browsing experience

## 🌐 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Notices

- `GET /api/notices` - List notices with filters
- `GET /api/notices/:id` - Get notice details
- `POST /api/notices` - Create notice
- `PUT /api/notices/:id` - Update notice
- `DELETE /api/notices/:id` - Delete notice
- `POST /api/notices/:id/approve` - Approve notice (Admin)
- `POST /api/notices/:id/interact` - Like/bookmark/acknowledge
- `GET /api/notices/:id/comments` - Get comments
- `POST /api/notices/:id/comments` - Add comment
- `GET /api/notices/analytics/stats` - Get analytics

### Admin

- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Soft delete user
- `POST /api/admin/users/:id/restore` - Restore user
- `GET /api/admin/logs` - Get activity logs
- `GET /api/admin/dashboard` - Admin dashboard stats

## 🎯 Future Enhancements

- [ ] Email notifications via PHPMailer/SendGrid
- [ ] Push notifications via Firebase Cloud Messaging
- [ ] File attachments (PDFs, images, videos) with R2 storage
- [ ] Email verification flow
- [ ] Password reset via OTP
- [ ] Multi-college platform support
- [ ] Integration with ERP systems
- [ ] Voice-based navigation
- [ ] Mobile app (Flutter/React Native)
- [ ] Advanced AI chatbot (NoticeBot)
- [ ] Real-time notifications via WebSockets
- [ ] Advanced analytics with Chart.js
- [ ] Export reports (PDF/Excel)

## 🏗️ Architecture

```

┌─────────────────────────────────────────────┐

│           Frontend (React + Vite)            │

│  ┌──────────────────────────────────────┐  │

│  │  Pages: Login, Dashboard, Notices    │  │

│  │  Components: Layout, Cards, Forms    │  │

│  │  Context: AuthContext                │  │

│  └──────────────────────────────────────┘  │

└─────────────────────────────────────────────┘

                    ↓ HTTP/HTTPS

┌─────────────────────────────────────────────┐

│      Backend (Cloudflare Workers)           │

│  ┌──────────────────────────────────────┐  │

│  │  API Routes: auth, notices, admin    │  │

│  │  Middleware: CORS, Auth, Logging     │  │

│  │  Business Logic                      │  │

│  └──────────────────────────────────────┘  │

└─────────────────────────────────────────────┘

        ↓                        ↓

┌──────────────┐        ┌───────────────┐

│ D1 Database  │        │   R2 Storage  │

│  (SQLite)    │        │ (File Store)  │

└──────────────┘        └───────────────┘

```

## 📄 License

Built by [devlo](https://devlo.ai)

## 🙏 Acknowledgments

This platform demonstrates a complete full-stack application with:

- Modern frontend framework (React)
- Edge computing backend (Cloudflare Workers)
- Serverless database (D1)
- Role-based access control
- Real-time interactions
- Analytics and insights
- Accessibility features
- Security best practices

Perfect for educational institutions looking to digitize their notice board systems!

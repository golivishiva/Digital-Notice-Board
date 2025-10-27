# 📢 Digital Notice Board

> A cloud-integrated, AI-powered digital notice board platform for educational institutions. Post, manage, and view institutional notices in real-time with role-based access control.

[![Built with React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)

[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange.svg)](https://workers.cloudflare.com/)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Features

### Core Functionality

- ✅ **Role-Based Access Control** - Admin, Staff, and Student roles with specific permissions
- ✅ **Notice Management** - Create, edit, delete, archive, pin, and schedule notices
- ✅ **Approval Workflow** - Admin approval required for staff-created notices
- ✅ **AI-Powered Features** - Auto-categorization and summary generation
- ✅ **Real-Time Interactions** - Like, comment, bookmark, and acknowledge notices
- ✅ **Advanced Search & Filters** - Find notices by category, department, or keywords
- ✅ **Analytics Dashboard** - Track views, engagement, and performance metrics

### User Features

- 🔐 **Secure Authentication** - PBKDF2 password hashing with HTTP-only cookies
- 👁️ **Password Visibility Toggle** - Show/hide password on login and registration
- 📊 **Activity Logging** - Complete audit trail for all user actions
- 🌓 **Dark Mode Support** - Toggle between light and dark themes
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- ♿ **Accessibility** - WCAG-compliant with keyboard navigation and screen reader support

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Git

### Installation

```bash

# Clone the repository

git clone <your-repo-url>

cd digital-notice-board


# Install dependencies

bun install

# or

npm install


# Setup database

bun run db:generate

wrangler d1 migrations apply devlo-demo-app --local


# Start development server

bun run dev

# or

npm run dev

```

The application will be available at `http://localhost:3002`

### Seed Demo Data

```bash

# Create demo users and notices

bun run scripts/seed-demo-data.ts

```

---

## 👥 Demo Credentials

| Role | Email | Password |

|------|-------|----------|

|**Admin**| admin@institution.edu | admin123 |

|**Staff**| staff@institution.edu | staff123 |

|**Student**| student@institution.edu | student123 |

---

## 📖 Usage Guide

### For Students

1. **Login** with student credentials
2. **Browse Notices** - View all approved notices on the dashboard
3. **Search & Filter** - Find specific notices by category or keywords
4. **Interact** - Like, comment, bookmark, or acknowledge notices
5. **View Details** - Click any notice to see full content and comments

### For Staff

1. **Login** with staff credentials
2. **Create Notices** - Use "Create Notice" page to post new announcements
3. **Manage Content** - Edit or delete your own notices
4. **View Analytics** - Check engagement metrics on your notices
5. **Wait for Approval** - Admin must approve before students see your notice

### For Admins

1. **Login** with admin credentials
2. **Approve Notices** - Review and approve staff-submitted notices
3. **Manage Users** - Create, edit, or soft-delete user accounts
4. **View Analytics** - Access system-wide statistics and insights
5. **Monitor Activity** - Check activity logs for audit purposes

---

## 🛠️ Tech Stack

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Beautiful UI component library
- **React Router** - Client-side routing
- **Lucide React** - Icon library

### Backend

- **Cloudflare Workers** - Edge computing platform
- **Hono.js** - Fast web framework
- **D1 Database** - Serverless SQLite database
- **Drizzle ORM** - Type-safe database ORM
- **R2 Storage** - Object storage for file attachments

### Security

- **PBKDF2** - Password hashing (100,000 iterations)
- **HTTP-only Cookies** - Secure session management
- **CORS Protection** - Cross-origin request security
- **Input Validation** - SQL injection prevention
- **Activity Logging** - Complete audit trail

---

## 📁 Project Structure

```

digital-notice-board/

├── src/

│   ├── components/        # Reusable UI components

│   │   ├── ui/           # Shadcn/ui components

│   │   └── DashboardLayout.tsx

│   ├── contexts/         # React contexts

│   │   └── AuthContext.tsx

│   ├── pages/           # Route pages

│   │   ├── Login.tsx

│   │   ├── Register.tsx

│   │   ├── Dashboard.tsx

│   │   ├── Notices.tsx

│   │   ├── NoticeDetail.tsx

│   │   ├── CreateNotice.tsx

│   │   ├── PendingApprovals.tsx

│   │   ├── AdminUsers.tsx

│   │   └── Analytics.tsx

│   ├── types/           # TypeScript types

│   └── App.tsx          # Main app component

├── backend/

│   ├── api/             # API endpoints

│   │   ├── auth.ts      # Authentication

│   │   ├── notices.ts   # Notice management

│   │   └── admin.ts     # Admin functions

│   ├── db/              # Database

│   │   ├── schema.ts    # Database schema

│   │   ├── db.ts        # DB connection

│   │   └── drizzle/     # Migrations

│   └── utils/           # Utility functions

│       └── crypto.ts    # Password hashing

├── scripts/             # Utility scripts

│   ├── seed-demo-data.ts

│   └── create-pending-notice.ts

├── public/              # Static assets

├── worker.ts            # Cloudflare Worker entry

├── wrangler.jsonc       # Cloudflare config

├── drizzle.config.ts    # Drizzle ORM config

└── package.json         # Dependencies

```

---

## 🔌 API Endpoints

### Authentication

```

POST   /api/auth/register    # Register new user

POST   /api/auth/login       # User login

POST   /api/auth/logout      # User logout

GET    /api/auth/me          # Get current user

```

### Notices

```

GET    /api/notices                    # List notices

GET    /api/notices/:id                # Get notice details

POST   /api/notices                    # Create notice

PUT    /api/notices/:id                # Update notice

DELETE /api/notices/:id                # Delete notice

POST   /api/notices/:id/approve        # Approve notice (admin)

POST   /api/notices/:id/interact       # Like/bookmark/acknowledge

GET    /api/notices/:id/comments       # Get comments

POST   /api/notices/:id/comments       # Add comment

GET    /api/notices/analytics/stats    # Get analytics

```

### Admin

```

GET    /api/admin/users              # List users

POST   /api/admin/users              # Create user

PUT    /api/admin/users/:id          # Update user

DELETE /api/admin/users/:id          # Soft delete user

POST   /api/admin/users/:id/restore  # Restore user

GET    /api/admin/logs               # Activity logs

GET    /api/admin/dashboard          # Dashboard stats

```

---

## 🗄️ Database Schema

### Main Tables

- **users** - User accounts with role-based access
- **sessions** - Secure session management
- **notices** - Notice posts with metadata
- **attachments** - File storage references (R2)
- **interactions** - User engagement tracking
- **comments** - Notice comments
- **activity_logs** - Audit trail
- **verification_tokens** - Email verification
- **notifications** - Push/email notifications

---

## 🎨 Key Features Explained

### Notice Approval Workflow

1. Staff creates a notice → Saved as **pending**
2. Admin receives notification in dashboard
3. Admin reviews notice in "Pending Approvals" page
4. Admin can **Approve** (publish to all) or **Reject** (delete)
5. Approved notices become visible to students

### Password Visibility Toggle

- Eye icon button in password fields
- Click to show/hide password text
- Available on login and registration pages
- Helps users verify their password before submitting

### AI Features

- **Auto-Categorization** - Keyword-based category assignment
- **Auto-Summary** - Generates 150-character preview
- Future: NoticeBot chatbot for queries

### Analytics

- View count, like count, comment count per notice
- Category-wise distribution charts
- Top performing notices
- User engagement metrics

---

## 🔒 Security Features

- ✅ **PBKDF2 Password Hashing** - 100,000 iterations with SHA-256
- ✅ **Per-User Salt Storage** - Unique salt for each password
- ✅ **HTTP-Only Cookies** - Prevents XSS attacks
- ✅ **Session Expiry** - 7-day default with refresh
- ✅ **SQL Injection Prevention** - Drizzle ORM parameterized queries
- ✅ **Input Validation** - Server-side validation for all inputs
- ✅ **Activity Logging** - Complete audit trail
- ✅ **Role-Based Access Control** - Enforced at API level
- ✅ **Soft Delete** - 30-day recovery window for users

---

## 🚀 Deployment

### Cloudflare Pages & Workers

```bash

# Build the project

bun run build


# Deploy to Cloudflare

wrangler deploy


# Apply database migrations (production)

wrangler d1 migrations apply devlo-demo-app --remote

```

### Environment Variables

Set these secrets in Cloudflare dashboard:

```

# Add any API keys or secrets here

# Example: EMAIL_API_KEY, STORAGE_ACCESS_KEY

```

---

## 📱 Pages & Routes

| Route | Page | Access |

|-------|------|--------|

|`/`| Redirect to Dashboard | All authenticated users |

|`/login`| Login Page | Public |

|`/register`| Registration Page | Public |

|`/dashboard`| Main Dashboard | All authenticated users |

|`/notices`| Notice List | All authenticated users |

|`/notices/:id`| Notice Detail | All authenticated users |

|`/notices/create`| Create Notice | Staff, Admin |

|`/admin/pending-approvals`| Pending Approvals | Admin only |

|`/admin/users`| User Management | Admin only |

|`/analytics`| Analytics Dashboard | Staff, Admin |

---

## 🎯 Future Enhancements

### Planned Features

- [ ] Email notifications via SendGrid/PHPMailer
- [ ] Push notifications via Firebase Cloud Messaging
- [ ] File attachments (PDFs, images, videos) with R2 storage
- [ ] Email verification flow
- [ ] Password reset via OTP
- [ ] Bulk approval for admins
- [ ] Approval comments/feedback
- [ ] Multi-college platform support
- [ ] Mobile app (Flutter/React Native)
- [ ] Advanced AI chatbot (NoticeBot)
- [ ] Export reports (PDF/Excel)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ by [devlo](https://devlo.ai)
- UI Components from [Shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Powered by [Cloudflare Workers](https://workers.cloudflare.com/)

---

## 📞 Support

For issues or questions:

- 📧 Email: support@yourinstitution.edu
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 📖 Documentation: See `/docs` folder

---

## ⭐ Show Your Support

If you find this project useful, please consider giving it a ⭐ on GitHub!

---

**Built by [devlo.ai](https://devlo.ai)** - The AI-powered development platform

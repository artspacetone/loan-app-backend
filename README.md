# 🏢 Inventory Management System

Modern full-stack inventory management system built with Next.js, Supabase, and TypeScript.

## ✨ Features

- 🔐 **Multi-role Authentication** (Admin, Supervisor, User)
- 📊 **Real-time Dashboard** with statistics
- 📦 **Inventory Management** (CRUD operations)
- 👥 **User Management** with role-based access
- 📱 **Responsive Design** with modern UI
- 🎨 **Beautiful Purple/Yellow Theme**
- 🚀 **Ready for Vercel Deployment**

## 🚀 Quick Start

### 1. Clone Repository
\`\`\`bash
git clone https://github.com/artspacetone/loan-app-backend.git
cd loan-app-backend
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Setup Environment Variables
Create `.env.local` file in the root directory:
\`\`\`env
# Copy these names to .env.local and fill in *your* real secrets
SUPABASE_NEXT_PUBLIC_SUPABASE_URL=<YOUR_SUPABSUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SUPABASE_SERVICE_ROLE_KEY>   # server only
JWT_SECRET=<YOUR_RANDOM_JWT_SECRET>
\`\`\`

### 4. Setup Database
\`\`\`bash
npm run db:setup
npm run db:seed
\`\`\`

### 5. Run Development Server
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Default Login Credentials

- **Admin**: `admin` / `admin123`
- **Supervisor**: `supervisor` / `super123`
- **User**: `user` / `user123`

## 🌐 Deploy to Vercel

### Option 1: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/artspacetone/loan-app-backend)

### Option 2: Manual Deploy
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Vercel
Add these in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `JWT_SECRET` - A secure random string for JWT signing

## 📁 Project Structure

\`\`\`
├── app/
│   ├── api/              # API Routes
│   ├── dashboard/        # Dashboard pages
│   ├── login/           # Authentication
│   └── globals.css      # Global styles
├── components/
│   ├── ui/              # UI components
│   └── layout/          # Layout components
├── lib/
│   ├── supabase.ts      # Database client
│   ├── auth.ts          # Authentication
│   └── utils.ts         # Utilities
└── scripts/             # Database scripts
\`\`\`

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT + Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Deployment**: Vercel

## 📊 API Endpoints

- `GET /api/health` - System health check
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/inventory` - Get inventory items
- `POST /api/inventory` - Create inventory item
- `GET /api/users/profile` - User profile

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |

## 🔒 Security Notes

- Never commit `.env.local` to version control
- Use strong, unique values for JWT_SECRET
- Keep service role keys secure
- Rotate keys regularly in production

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you need help, please open an issue or contact the maintainers.

---

Made with ❤️ by [artspacetone](https://github.com/artspacetone)
\`\`\`

\`\`\`plaintext file=".env.example"
# Supabase Configuration
# Get these values from your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Secret - Generate a secure random string
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# App Configuration
NEXT_PUBLIC_APP_NAME=Inventory Management System
NEXT_PUBLIC_APP_VERSION=1.0.0

# Development
NODE_ENV=development

</existing_code>

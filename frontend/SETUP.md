# BunnySteps App Template - Setup Guide

This is a complete template for building an ADHD-friendly productivity app with gamification, mood tracking, and an AI bunny companion.

## Features Included

- Dashboard with real-time stats
- Task management with priorities and categories
- Pomodoro focus sessions with progress tracking
- Mood tracking with trend analysis
- Avatar customization system
- Gamification (levels, achievements, rewards)
- AI bunny companion chat
- Responsive mobile-first design

## Installation

### Using shadcn CLI

\`\`\`bash
npx shadcn-cli@latest init
\`\`\`

### Manual Setup

1. Clone or download this template
2. Install dependencies: `npm install`
3. Set up environment variables (see below)
4. Run the development server: `npm run dev`

## Environment Setup

### Required Environment Variables

\`\`\`bash
# For Supabase (recommended)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# For AI (optional, for enhanced companion features)
OPENAI_API_KEY=your_openai_key
# OR
GROQ_API_KEY=your_groq_key
\`\`\`

### Create .env.local file

\`\`\`bash
touch .env.local
\`\`\`

Then add your environment variables.

## Database Setup

### Using Supabase (Recommended)

1. Create a Supabase project at https://supabase.com
2. Copy your project URL and API keys to your .env.local
3. In the Supabase dashboard, run the SQL from `scripts/schema.sql` in the SQL editor

### Using Neon

1. Create a Neon project at https://neon.tech
2. Copy your database URL to .env.local as DATABASE_URL
3. Run the schema setup:
   \`\`\`bash
   npm run db:setup
   \`\`\`

## Authentication Integration

Choose your preferred authentication method:

### Option 1: Supabase Auth (Recommended)
- Already set up in auth pages
- Handles email/password and OAuth

### Option 2: NextAuth.js
- Uncomment NextAuth setup in `app/api/auth/[...nextauth]/route.ts`
- Configure providers in nextauth.config.ts

## Running the App

\`\`\`bash
npm run dev
\`\`\`

Visit http://localhost:3000

### Login credentials (for testing)
- Email: test@example.com
- Password: password123

## Deployment

### Deploy to Vercel

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

The app will be deployed and connected to your GitHub repository.

## Customization

### Theme Colors
Edit `app/globals.css` to customize the color scheme. The app uses warm peachy-coral, mint green, and lavender.

### Bunny Avatar
Modify `components/bunny-avatar.tsx` to add more mood states and animations.

### AI Responses
Update the `bunnyResponses` array in `components/chat/chat-view.tsx` to customize companion messages.

## Next Steps

1. Connect your database (Supabase or Neon)
2. Set up authentication
3. Configure AI features (optional)
4. Customize branding and colors
5. Deploy to production

## Support & Documentation

- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Tailwind CSS: https://tailwindcss.com/docs

## License

This template is open source and available under the MIT License.

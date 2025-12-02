# Aifinza

A comprehensive financial management platform for South African SMBs. Provides business accounting, invoicing, expense tracking, SARS tax compliance, and AI-powered financial insights.

## Tech Stack

- **Framework**: Next.js 16+ (App Router, Turbopack, React 19.2)
- **Language**: TypeScript 5.1+
- **Database**: PostgreSQL + Prisma v7
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: NextAuth.js (Auth.js)
- **AI**: Vercel AI SDK (Claude, Gemini, DeepSeek, OpenAI)
- **Payments**: Stripe Checkout
- **Email**: react-email + Forwardemail.net
- **Jobs**: Upstash QStash
- **Linting**: Biome

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (signin, signup, profile)
│   ├── (dashboard)/       # Main app (accounts, transactions, invoices, tax, etc.)
│   ├── (marketing)/       # Public pages (landing, pricing, features)
│   ├── admin/             # Admin panel
│   └── api/               # API routes (auth, ai, webhooks, trpc)
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── forms/             # Form components
│   ├── charts/            # Chart/graph components
│   ├── tables/            # Data table components
│   └── shared/            # Shared utility components
├── lib/
│   ├── prisma.ts          # Prisma client singleton
│   ├── auth.ts            # NextAuth.js config
│   ├── stripe.ts          # Stripe integration
│   ├── ai/                # AI providers and prompts
│   ├── utils/             # Helper functions
│   └── validations/       # Zod schemas
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
├── emails/                # react-email templates
├── jobs/                  # QStash job handlers
└── proxy.ts               # Request handler (replaces middleware.ts)
prisma/
├── schema.prisma          # Database schema
├── migrations/            # Database migrations
└── seed.ts                # Seed data
```

## Organization Rules

- **API routes** → `src/app/api/`, one file per route/resource
- **Components** → `src/components/`, one component per file
- **Utilities** → `src/lib/utils/`, grouped by functionality
- **Types** → `src/types/` or co-located with usage
- **Tests** → Next to the code they test
- **Single responsibility** per file, clear descriptive names

## Next.js 16 Notes

- Uses `proxy.ts` instead of `middleware.ts` (Node.js runtime)
- Caching is opt-in via `"use cache"` directive
- React Compiler enabled (auto-memoization, less useMemo/useCallback)
- Turbopack is default bundler
- Do NOT use: AMP, `next lint`, `legacyBehavior` on Link

## Code Quality

After editing ANY file, run:

```bash
npx biome check --write .
npx tsc --noEmit
```

Fix ALL errors/warnings before continuing.

If server changes require restart:
```bash
npm run dev
```
Read server output and fix ALL warnings/errors.

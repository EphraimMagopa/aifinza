# Aifinza - Complete Project Plan

## Project Overview

**Aifinza** is a comprehensive financial management platform for small-to-medium businesses (SMBs) in South Africa. It helps businesses manage their finances, prepare for tax filing (SARS), generate invoices, track expenses, and gain AI-powered financial insights.

**Target Market:** South African SMBs (Sole Proprietors, Partnerships, (Pty) Ltd companies)

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16+ (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL |
| **ORM** | Prisma v7 |
| **UI Components** | shadcn/ui |
| **Styling** | Tailwind CSS |
| **Authentication** | NextAuth.js (Auth.js) |
| **AI Chat** | Vercel AI SDK (streaming) |
| **AI Providers** | Claude, Gemini, DeepSeek, OpenAI |
| **Email** | react-email + Forwardemail.net |
| **Error Tracking** | GlitchTip |
| **Background Jobs** | Upstash QStash |
| **Payments** | Stripe Checkout |
| **File Storage** | Uploadthing or S3-compatible |
| **Analytics** | Vercel Analytics |
| **Rate Limiting** | Upstash Redis |
| **Deployment** | Vercel / Docker (self-hosted option) |

---

## Next.js 16 Key Features & Requirements

Next.js 16 introduces significant changes. Ensure the project uses these properly:

### Requirements
- **Node.js 20.9+** (required)
- **TypeScript 5.1+** (required)
- **React 19.2** (included with Next.js 16)

### Key Changes from Previous Versions

| Feature | Description |
|---------|-------------|
| **Turbopack (default)** | Now the default bundler. 2-5x faster builds, up to 10x faster Fast Refresh. No config needed. |
| **Cache Components** | New `"use cache"` directive for explicit caching. Caching is now opt-in, not automatic. |
| **proxy.ts** | Replaces `middleware.ts`. Runs on Node.js runtime. Rename and update accordingly. |
| **React Compiler** | Stable support for automatic memoization. Reduces need for `useMemo`/`useCallback`. |
| **View Transitions** | React 19.2 feature for animating navigation transitions. |
| **DevTools MCP** | Model Context Protocol for AI-assisted debugging. |

### Removed Features (do not use)
- AMP support (removed)
- `next lint` command (deprecated, use ESLint directly)
- `legacyBehavior` prop on `next/link` (removed)
- `experimental.ppr` flag (replaced by Cache Components)

### Configuration Example

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack is now default, no config needed
  
  // Enable React Compiler for automatic memoization
  reactCompiler: true,
  
  // Enable Cache Components
  experimental: {
    cacheComponents: true,
    // Turbopack filesystem caching (beta) - faster dev startup
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
```

### Cache Components Usage

```typescript
// Opt-in caching for components
"use cache";

export async function CachedComponent() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// Or for specific functions
async function getData() {
  "use cache";
  return await db.query(...);
}
```

### proxy.ts (replaces middleware.ts)

```typescript
// src/proxy.ts (NOT middleware.ts)
import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  // Runs on Node.js runtime
  // Handle authentication, redirects, rewrites, etc.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Project Structure

```
aifinza/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── signin/
│   │   │   ├── signup/
│   │   │   └── profile/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── accounts/
│   │   │   ├── transactions/
│   │   │   ├── invoices/
│   │   │   ├── customers/
│   │   │   ├── suppliers/
│   │   │   ├── reports/
│   │   │   ├── tax/
│   │   │   ├── payroll/
│   │   │   ├── documents/
│   │   │   ├── calendar/
│   │   │   ├── ai-assistant/
│   │   │   └── settings/
│   │   ├── (marketing)/
│   │   │   ├── page.tsx (landing)
│   │   │   ├── pricing/
│   │   │   ├── features/
│   │   │   └── contact/
│   │   ├── admin/
│   │   │   ├── users/
│   │   │   ├── businesses/
│   │   │   ├── subscriptions/
│   │   │   └── analytics/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── ai/
│   │   │   ├── webhooks/
│   │   │   ├── trpc/
│   │   │   └── [...routes]
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── forms/
│   │   ├── charts/
│   │   ├── tables/
│   │   ├── modals/
│   │   ├── landing/
│   │   └── shared/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── stripe.ts
│   │   ├── email.ts
│   │   ├── ai/
│   │   │   ├── providers/
│   │   │   ├── prompts/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   ├── validations/
│   │   └── constants/
│   ├── hooks/
│   ├── types/
│   ├── emails/ (react-email templates)
│   ├── jobs/ (QStash job handlers)
│   └── proxy.ts (replaces middleware.ts - Next.js 16)
├── public/
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── docker-compose.dev.yml
├── .env.example
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Database Schema (Prisma)

### Core Models

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== AUTHENTICATION ====================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  password      String?
  role          UserRole  @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  businesses    BusinessUser[]
  aiSettings    UserAISettings?
  subscription  Subscription?
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

enum UserRole {
  USER
  ADMIN
  SUPER_ADMIN
}

// ==================== SUBSCRIPTIONS ====================

model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @unique
  stripeCustomerId     String?            @unique
  stripeSubscriptionId String?            @unique
  stripePriceId        String?
  stripeCurrentPeriodEnd DateTime?
  plan                 SubscriptionPlan   @default(FREE)
  status               SubscriptionStatus @default(ACTIVE)
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum SubscriptionPlan {
  FREE
  STARTER
  PROFESSIONAL
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  PAST_DUE
  TRIALING
}

// ==================== BUSINESS ====================

model Business {
  id                  String       @id @default(cuid())
  name                String
  tradingName         String?
  registrationNumber  String?      // CIPC registration
  taxNumber           String?      // SARS tax number
  vatNumber           String?      // VAT registration number
  isVatRegistered     Boolean      @default(false)
  vatCycle            VatCycle?    // Monthly, bi-monthly
  businessType        BusinessType
  industry            String?
  financialYearEnd    Int          @default(2) // Month (1-12), Feb = 2
  
  // Contact Details
  email               String?
  phone               String?
  website             String?
  
  // Address
  addressLine1        String?
  addressLine2        String?
  city                String?
  province            Province?
  postalCode          String?
  country             String       @default("South Africa")
  
  // Settings
  defaultCurrency     String       @default("ZAR")
  logoUrl             String?
  invoicePrefix       String       @default("INV")
  quotePrefix         String       @default("QUO")
  nextInvoiceNumber   Int          @default(1)
  nextQuoteNumber     Int          @default(1)
  
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  users               BusinessUser[]
  bankAccounts        BankAccount[]
  customers           Customer[]
  suppliers           Supplier[]
  transactions        Transaction[]
  invoices            Invoice[]
  quotes              Quote[]
  employees           Employee[]
  chartOfAccounts     ChartOfAccount[]
  taxPeriods          TaxPeriod[]
  documents           Document[]
  categories          Category[]
  recurringTransactions RecurringTransaction[]
}

model BusinessUser {
  id         String         @id @default(cuid())
  userId     String
  businessId String
  role       BusinessRole   @default(MEMBER)
  createdAt  DateTime       @default(now())

  user       User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  business   Business       @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@unique([userId, businessId])
}

enum BusinessRole {
  OWNER
  ADMIN
  ACCOUNTANT
  MEMBER
  VIEWER
}

enum BusinessType {
  SOLE_PROPRIETOR
  PARTNERSHIP
  PRIVATE_COMPANY      // (Pty) Ltd
  PUBLIC_COMPANY
  CLOSE_CORPORATION    // CC
  NON_PROFIT
  TRUST
  OTHER
}

enum Province {
  EASTERN_CAPE
  FREE_STATE
  GAUTENG
  KWAZULU_NATAL
  LIMPOPO
  MPUMALANGA
  NORTHERN_CAPE
  NORTH_WEST
  WESTERN_CAPE
}

enum VatCycle {
  MONTHLY           // Category A: > R30m turnover
  BI_MONTHLY        // Category B: R1.5m - R30m
  SIX_MONTHLY       // Category C: < R1.5m (voluntary)
}

// ==================== BANKING ====================

model BankAccount {
  id              String      @id @default(cuid())
  businessId      String
  name            String
  bankName        String
  accountNumber   String
  branchCode      String?
  accountType     AccountType
  currency        String      @default("ZAR")
  currentBalance  Decimal     @default(0) @db.Decimal(15, 2)
  isActive        Boolean     @default(true)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  business        Business    @relation(fields: [businessId], references: [id], onDelete: Cascade)
  transactions    Transaction[]
}

enum AccountType {
  CURRENT
  SAVINGS
  CREDIT_CARD
  LOAN
  CASH
  OTHER
}

// ==================== CHART OF ACCOUNTS ====================

model ChartOfAccount {
  id              String          @id @default(cuid())
  businessId      String
  code            String          // e.g., "1000", "4100"
  name            String
  description     String?
  type            AccountCategory
  subType         String?
  isSystem        Boolean         @default(false)
  isActive        Boolean         @default(true)
  parentId        String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  business        Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  parent          ChartOfAccount? @relation("AccountHierarchy", fields: [parentId], references: [id])
  children        ChartOfAccount[] @relation("AccountHierarchy")
  transactions    Transaction[]
  
  @@unique([businessId, code])
}

enum AccountCategory {
  ASSET
  LIABILITY
  EQUITY
  REVENUE
  COST_OF_SALES
  EXPENSE
  OTHER_INCOME
  OTHER_EXPENSE
}

// ==================== TRANSACTIONS ====================

model Transaction {
  id              String            @id @default(cuid())
  businessId      String
  bankAccountId   String?
  accountId       String?           // Chart of account
  categoryId      String?
  customerId      String?
  supplierId      String?
  invoiceId       String?
  
  date            DateTime
  description     String
  reference       String?
  amount          Decimal           @db.Decimal(15, 2)
  type            TransactionType
  
  // VAT
  vatRate         Decimal?          @db.Decimal(5, 2)
  vatAmount       Decimal?          @db.Decimal(15, 2)
  vatType         VatType?
  
  // Reconciliation
  isReconciled    Boolean           @default(false)
  reconciledAt    DateTime?
  
  // AI categorization
  aiCategorized   Boolean           @default(false)
  aiConfidence    Float?
  
  notes           String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  business        Business          @relation(fields: [businessId], references: [id], onDelete: Cascade)
  bankAccount     BankAccount?      @relation(fields: [bankAccountId], references: [id])
  account         ChartOfAccount?   @relation(fields: [accountId], references: [id])
  category        Category?         @relation(fields: [categoryId], references: [id])
  customer        Customer?         @relation(fields: [customerId], references: [id])
  supplier        Supplier?         @relation(fields: [supplierId], references: [id])
  invoice         Invoice?          @relation(fields: [invoiceId], references: [id])
  documents       TransactionDocument[]
}

model RecurringTransaction {
  id              String            @id @default(cuid())
  businessId      String
  description     String
  amount          Decimal           @db.Decimal(15, 2)
  type            TransactionType
  frequency       Frequency
  startDate       DateTime
  endDate         DateTime?
  nextDueDate     DateTime
  isActive        Boolean           @default(true)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  business        Business          @relation(fields: [businessId], references: [id], onDelete: Cascade)
}

enum TransactionType {
  INCOME
  EXPENSE
  TRANSFER
  JOURNAL
}

enum VatType {
  STANDARD         // 15%
  ZERO_RATED       // 0%
  EXEMPT           // No VAT
  NO_VAT           // Not VAT registered
}

enum Frequency {
  DAILY
  WEEKLY
  FORTNIGHTLY
  MONTHLY
  QUARTERLY
  ANNUALLY
}

// ==================== CATEGORIES ====================

model Category {
  id              String          @id @default(cuid())
  businessId      String
  name            String
  type            TransactionType
  color           String?
  icon            String?
  isSystem        Boolean         @default(false)
  parentId        String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  business        Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  parent          Category?       @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children        Category[]      @relation("CategoryHierarchy")
  transactions    Transaction[]

  @@unique([businessId, name])
}

// ==================== CUSTOMERS & SUPPLIERS ====================

model Customer {
  id              String        @id @default(cuid())
  businessId      String
  name            String
  email           String?
  phone           String?
  vatNumber       String?
  
  // Billing Address
  addressLine1    String?
  addressLine2    String?
  city            String?
  province        Province?
  postalCode      String?
  country         String        @default("South Africa")
  
  // Settings
  paymentTerms    Int           @default(30) // Days
  creditLimit     Decimal?      @db.Decimal(15, 2)
  notes           String?
  isActive        Boolean       @default(true)
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  business        Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  invoices        Invoice[]
  quotes          Quote[]
  transactions    Transaction[]
}

model Supplier {
  id              String        @id @default(cuid())
  businessId      String
  name            String
  email           String?
  phone           String?
  vatNumber       String?
  
  // Address
  addressLine1    String?
  addressLine2    String?
  city            String?
  province        Province?
  postalCode      String?
  country         String        @default("South Africa")
  
  // Banking
  bankName        String?
  accountNumber   String?
  branchCode      String?
  
  // Settings
  paymentTerms    Int           @default(30)
  notes           String?
  isActive        Boolean       @default(true)
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  business        Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  transactions    Transaction[]
}

// ==================== INVOICING ====================

model Invoice {
  id              String          @id @default(cuid())
  businessId      String
  customerId      String
  quoteId         String?
  
  invoiceNumber   String
  reference       String?
  status          InvoiceStatus   @default(DRAFT)
  
  issueDate       DateTime        @default(now())
  dueDate         DateTime
  paidDate        DateTime?
  
  // Amounts
  subtotal        Decimal         @db.Decimal(15, 2)
  vatAmount       Decimal         @db.Decimal(15, 2)
  discount        Decimal         @default(0) @db.Decimal(15, 2)
  total           Decimal         @db.Decimal(15, 2)
  amountPaid      Decimal         @default(0) @db.Decimal(15, 2)
  
  // Content
  notes           String?
  terms           String?
  
  // Email tracking
  sentAt          DateTime?
  viewedAt        DateTime?
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  business        Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  customer        Customer        @relation(fields: [customerId], references: [id])
  quote           Quote?          @relation(fields: [quoteId], references: [id])
  lineItems       InvoiceLineItem[]
  transactions    Transaction[]
  documents       Document[]
  
  @@unique([businessId, invoiceNumber])
}

model InvoiceLineItem {
  id              String          @id @default(cuid())
  invoiceId       String
  description     String
  quantity        Decimal         @db.Decimal(10, 2)
  unitPrice       Decimal         @db.Decimal(15, 2)
  vatRate         Decimal         @default(15) @db.Decimal(5, 2)
  vatAmount       Decimal         @db.Decimal(15, 2)
  lineTotal       Decimal         @db.Decimal(15, 2)
  sortOrder       Int             @default(0)

  invoice         Invoice         @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
}

enum InvoiceStatus {
  DRAFT
  SENT
  VIEWED
  PARTIALLY_PAID
  PAID
  OVERDUE
  CANCELLED
  WRITTEN_OFF
}

// ==================== QUOTES ====================

model Quote {
  id              String        @id @default(cuid())
  businessId      String
  customerId      String
  
  quoteNumber     String
  reference       String?
  status          QuoteStatus   @default(DRAFT)
  
  issueDate       DateTime      @default(now())
  expiryDate      DateTime
  
  // Amounts
  subtotal        Decimal       @db.Decimal(15, 2)
  vatAmount       Decimal       @db.Decimal(15, 2)
  discount        Decimal       @default(0) @db.Decimal(15, 2)
  total           Decimal       @db.Decimal(15, 2)
  
  notes           String?
  terms           String?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  business        Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  customer        Customer      @relation(fields: [customerId], references: [id])
  lineItems       QuoteLineItem[]
  invoices        Invoice[]
  
  @@unique([businessId, quoteNumber])
}

model QuoteLineItem {
  id              String        @id @default(cuid())
  quoteId         String
  description     String
  quantity        Decimal       @db.Decimal(10, 2)
  unitPrice       Decimal       @db.Decimal(15, 2)
  vatRate         Decimal       @default(15) @db.Decimal(5, 2)
  vatAmount       Decimal       @db.Decimal(15, 2)
  lineTotal       Decimal       @db.Decimal(15, 2)
  sortOrder       Int           @default(0)

  quote           Quote         @relation(fields: [quoteId], references: [id], onDelete: Cascade)
}

enum QuoteStatus {
  DRAFT
  SENT
  ACCEPTED
  DECLINED
  EXPIRED
  INVOICED
}

// ==================== PAYROLL ====================

model Employee {
  id                String        @id @default(cuid())
  businessId        String
  
  // Personal
  firstName         String
  lastName          String
  idNumber          String?
  email             String?
  phone             String?
  
  // Employment
  employeeNumber    String?
  jobTitle          String?
  department        String?
  startDate         DateTime
  endDate           DateTime?
  employmentType    EmploymentType
  
  // Compensation
  salaryType        SalaryType
  salaryAmount      Decimal       @db.Decimal(15, 2)
  payFrequency      Frequency     @default(MONTHLY)
  
  // Tax
  taxNumber         String?       // SARS tax number
  
  // Banking
  bankName          String?
  accountNumber     String?
  branchCode        String?
  
  isActive          Boolean       @default(true)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  business          Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  payslips          Payslip[]
}

model Payslip {
  id                String        @id @default(cuid())
  employeeId        String
  
  payPeriodStart    DateTime
  payPeriodEnd      DateTime
  payDate           DateTime
  
  // Earnings
  basicSalary       Decimal       @db.Decimal(15, 2)
  overtime          Decimal       @default(0) @db.Decimal(15, 2)
  bonus             Decimal       @default(0) @db.Decimal(15, 2)
  commission        Decimal       @default(0) @db.Decimal(15, 2)
  allowances        Decimal       @default(0) @db.Decimal(15, 2)
  grossPay          Decimal       @db.Decimal(15, 2)
  
  // Deductions
  paye              Decimal       @db.Decimal(15, 2)  // Income tax
  uif               Decimal       @db.Decimal(15, 2)  // Unemployment Insurance
  pensionEmployee   Decimal       @default(0) @db.Decimal(15, 2)
  medicalAid        Decimal       @default(0) @db.Decimal(15, 2)
  otherDeductions   Decimal       @default(0) @db.Decimal(15, 2)
  totalDeductions   Decimal       @db.Decimal(15, 2)
  
  // Employer contributions
  uifEmployer       Decimal       @db.Decimal(15, 2)
  sdl               Decimal       @db.Decimal(15, 2)  // Skills Development Levy
  pensionEmployer   Decimal       @default(0) @db.Decimal(15, 2)
  
  netPay            Decimal       @db.Decimal(15, 2)
  status            PayslipStatus @default(DRAFT)
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  employee          Employee      @relation(fields: [employeeId], references: [id], onDelete: Cascade)
}

enum EmploymentType {
  FULL_TIME
  PART_TIME
  CONTRACT
  TEMPORARY
  INTERN
}

enum SalaryType {
  MONTHLY
  HOURLY
  ANNUAL
}

enum PayslipStatus {
  DRAFT
  APPROVED
  PAID
}

// ==================== TAX ====================

model TaxPeriod {
  id              String        @id @default(cuid())
  businessId      String
  type            TaxType
  startDate       DateTime
  endDate         DateTime
  dueDate         DateTime
  status          TaxStatus     @default(OPEN)
  
  // Amounts (for VAT)
  outputVat       Decimal?      @db.Decimal(15, 2)
  inputVat        Decimal?      @db.Decimal(15, 2)
  vatPayable      Decimal?      @db.Decimal(15, 2)
  
  // Submission
  submittedAt     DateTime?
  reference       String?       // SARS reference
  
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  business        Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
}

enum TaxType {
  VAT             // VAT201
  PAYE            // EMP201
  PROVISIONAL_TAX // IRP6
  ANNUAL_TAX      // IT12/ITR14
  EMP501          // Annual PAYE reconciliation
  SDL             // Skills Development Levy
  UIF             // Unemployment Insurance Fund
}

enum TaxStatus {
  OPEN
  IN_PROGRESS
  READY_TO_SUBMIT
  SUBMITTED
  PAID
  OVERDUE
}

// ==================== DOCUMENTS ====================

model Document {
  id              String        @id @default(cuid())
  businessId      String
  invoiceId       String?
  
  name            String
  type            DocumentType
  fileUrl         String
  fileSize        Int
  mimeType        String
  
  // AI processing
  aiProcessed     Boolean       @default(false)
  extractedData   Json?
  
  taxYear         Int?
  category        String?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  business        Business      @relation(fields: [businessId], references: [id], onDelete: Cascade)
  invoice         Invoice?      @relation(fields: [invoiceId], references: [id])
  transactions    TransactionDocument[]
}

model TransactionDocument {
  id              String        @id @default(cuid())
  transactionId   String
  documentId      String

  transaction     Transaction   @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  document        Document      @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@unique([transactionId, documentId])
}

enum DocumentType {
  INVOICE
  RECEIPT
  BANK_STATEMENT
  CONTRACT
  TAX_CERTIFICATE
  ID_DOCUMENT
  COMPANY_REGISTRATION
  VAT_REGISTRATION
  OTHER
}

// ==================== AI ====================

model UserAISettings {
  id                String      @id @default(cuid())
  userId            String      @unique
  defaultProvider   AIProvider  @default(CLAUDE)
  
  // API Keys (encrypted)
  openaiKey         String?
  anthropicKey      String?
  geminiKey         String?
  deepseekKey       String?
  
  // Preferences
  enableAutoCateg   Boolean     @default(true)
  enableInsights    Boolean     @default(true)
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  user              User        @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model AIConversation {
  id              String        @id @default(cuid())
  userId          String
  businessId      String?
  title           String?
  provider        AIProvider
  model           String
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  messages        AIMessage[]
}

model AIMessage {
  id              String          @id @default(cuid())
  conversationId  String
  role            MessageRole
  content         String          @db.Text
  tokenCount      Int?
  createdAt       DateTime        @default(now())

  conversation    AIConversation  @relation(fields: [conversationId], references: [id], onDelete: Cascade)
}

enum AIProvider {
  OPENAI
  CLAUDE
  GEMINI
  DEEPSEEK
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

// ==================== CALENDAR & SCHEDULING ====================

model CalendarEvent {
  id              String          @id @default(cuid())
  businessId      String
  userId          String
  
  title           String
  description     String?
  type            EventType
  
  startDate       DateTime
  endDate         DateTime?
  allDay          Boolean         @default(false)
  
  // Recurrence
  isRecurring     Boolean         @default(false)
  recurrenceRule  String?         // iCal RRULE format
  
  // Reminders
  reminderMinutes Int[]           @default([1440, 60]) // 1 day, 1 hour
  
  // Related entities
  relatedId       String?         // Invoice ID, Tax Period ID, etc.
  relatedType     String?
  
  completed       Boolean         @default(false)
  completedAt     DateTime?
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

enum EventType {
  TAX_DEADLINE
  INVOICE_DUE
  PAYMENT_DUE
  MEETING
  REMINDER
  PAYROLL
  CUSTOM
}

// ==================== AUDIT LOG ====================

model AuditLog {
  id              String        @id @default(cuid())
  userId          String
  businessId      String?
  action          String
  entityType      String
  entityId        String
  oldValues       Json?
  newValues       Json?
  ipAddress       String?
  userAgent       String?
  createdAt       DateTime      @default(now())
}
```

---

## Development Phases

### Phase 1: Foundation (Weeks 1-3)

#### 1.1 Project Setup
- [ ] Initialize Next.js 16+ project with TypeScript
- [ ] Verify Node.js 20.9+ and TypeScript 5.1+ are installed
- [ ] Configure Turbopack filesystem caching for faster dev
- [ ] Enable React Compiler for automatic memoization
- [ ] Configure Cache Components (experimental.cacheComponents)
- [ ] Configure Tailwind CSS
- [ ] Install and configure shadcn/ui
- [ ] Set up Prisma with PostgreSQL
- [ ] Configure ESLint (note: `next lint` is deprecated, use ESLint directly)
- [ ] Set up Prettier
- [ ] Set up Git repository structure
- [ ] Create Docker development environment

#### 1.2 Authentication
- [ ] Configure NextAuth.js (Auth.js v5)
- [ ] Implement email/password authentication
- [ ] Create sign-in page with shadcn/ui
- [ ] Create sign-up page with email verification
- [ ] Create profile page
- [ ] Implement password reset flow
- [ ] Add Google OAuth (optional)
- [ ] Set up protected routes using proxy.ts (NOT middleware.ts)

#### 1.3 Email System
- [ ] Set up react-email templates
- [ ] Configure Forwardemail.net
- [ ] Create email templates:
  - [ ] Welcome email
  - [ ] Email verification
  - [ ] Password reset
  - [ ] Invoice sent
  - [ ] Payment received
  - [ ] Payment reminder

#### 1.4 Database & API Foundation
- [ ] Create Prisma schema
- [ ] Set up database migrations
- [ ] Create seed data for development
- [ ] Set up tRPC or API routes
- [ ] Implement rate limiting with Upstash Redis

---

### Phase 2: Core Business Features (Weeks 4-7)

#### 2.1 Business Management
- [ ] Business creation flow
- [ ] Business settings page
- [ ] Multi-business support
- [ ] Team/user invitation system
- [ ] Role-based permissions

#### 2.2 Banking & Accounts
- [ ] Bank account CRUD
- [ ] Chart of accounts with SA defaults
- [ ] Account balance tracking
- [ ] Bank statement CSV import (FNB, ABSA, Nedbank, Standard Bank, Capitec)

#### 2.3 Transaction Management
- [ ] Transaction list with filtering and search
- [ ] Transaction creation/editing
- [ ] Bulk transaction import
- [ ] Transaction categorization
- [ ] Reconciliation workflow
- [ ] Recurring transactions

#### 2.4 Categories
- [ ] Default SA business categories
- [ ] Custom category creation
- [ ] Category rules for auto-categorization

---

### Phase 3: Invoicing & Customers (Weeks 8-10)

#### 3.1 Customer Management
- [ ] Customer CRUD
- [ ] Customer list with search
- [ ] Customer statement view
- [ ] Outstanding balance tracking

#### 3.2 Supplier Management
- [ ] Supplier CRUD
- [ ] Supplier list with search
- [ ] Supplier payment tracking

#### 3.3 Quotes
- [ ] Quote creation with line items
- [ ] Quote PDF generation
- [ ] Quote email sending
- [ ] Quote to invoice conversion
- [ ] Quote status tracking

#### 3.4 Invoicing
- [ ] Invoice creation with line items
- [ ] SA VAT-compliant invoice format
- [ ] Invoice PDF generation
- [ ] Invoice email sending with tracking
- [ ] Payment recording
- [ ] Invoice status management
- [ ] Overdue invoice reminders
- [ ] Credit notes

---

### Phase 4: South African Tax Compliance (Weeks 11-14)

#### 4.1 VAT Management
- [ ] VAT registration settings
- [ ] VAT on transactions
- [ ] VAT report (VAT201)
- [ ] Input vs Output VAT tracking
- [ ] VAT reconciliation

#### 4.2 Tax Calendar
- [ ] SARS tax calendar integration
- [ ] Provisional tax reminders (IRP6)
- [ ] VAT due date reminders
- [ ] PAYE deadlines (EMP201)
- [ ] Annual tax deadlines

#### 4.3 Tax Reports
- [ ] Trial Balance
- [ ] Profit & Loss Statement
- [ ] Balance Sheet
- [ ] Tax-ready income summary
- [ ] Expense analysis by category
- [ ] Annual financial statements

#### 4.4 Document Management
- [ ] Document upload and storage
- [ ] Document categorization by tax year
- [ ] Link documents to transactions
- [ ] Document search

---

### Phase 5: Payroll (Weeks 15-17)

#### 5.1 Employee Management
- [ ] Employee CRUD
- [ ] Employee details and banking
- [ ] Employment history

#### 5.2 Payroll Processing
- [ ] PAYE calculation (SA tax tables)
- [ ] UIF calculation (1% employee, 1% employer)
- [ ] SDL calculation (1% of payroll)
- [ ] Payslip generation
- [ ] Payslip PDF
- [ ] Payroll summary reports

#### 5.3 Payroll Reports
- [ ] EMP201 preparation
- [ ] EMP501 reconciliation data
- [ ] IRP5 certificate data

---

### Phase 6: AI Integration (Weeks 18-21)

#### 6.1 AI Provider System
- [ ] Create AI provider abstraction layer
- [ ] Implement OpenAI provider
- [ ] Implement Claude provider
- [ ] Implement Gemini provider
- [ ] Implement DeepSeek provider
- [ ] Provider selection UI
- [ ] API key management (encrypted storage)
- [ ] Fallback provider logic

#### 6.2 AI Chat Assistant
- [ ] Streaming chat UI with Vercel AI SDK
- [ ] Financial context injection
- [ ] Conversation history
- [ ] Pre-built prompts:
  - [ ] "What were my expenses last month?"
  - [ ] "How much VAT do I owe?"
  - [ ] "Summarize my cash flow"
  - [ ] "What tax deadlines are coming up?"

#### 6.3 AI-Powered Features
- [ ] Transaction auto-categorization
- [ ] Receipt/invoice OCR and data extraction
- [ ] Financial insights and anomaly detection
- [ ] Cash flow predictions
- [ ] Tax optimization suggestions

---

### Phase 7: Calendar & Scheduling (Weeks 22-23)

#### 7.1 Calendar
- [ ] Calendar view (month, week, day)
- [ ] Event creation and editing
- [ ] Recurring events
- [ ] Event reminders

#### 7.2 Tax Integration
- [ ] Auto-populate tax deadlines
- [ ] Invoice due date integration
- [ ] Payment reminders

---

### Phase 8: Payments & Subscriptions (Weeks 24-26)

#### 8.1 Stripe Integration
- [ ] Stripe Checkout setup
- [ ] Subscription plans (Free, Starter, Professional, Enterprise)
- [ ] Webhook handling
- [ ] Customer portal
- [ ] Usage-based billing (optional)

#### 8.2 Subscription Management
- [ ] Plan comparison page
- [ ] Upgrade/downgrade flow
- [ ] Billing history
- [ ] Invoice download

---

### Phase 9: Admin Panel (Weeks 27-28)

#### 9.1 Admin Dashboard
- [ ] Admin authentication/authorization
- [ ] Dashboard with key metrics
- [ ] User management
- [ ] Business management
- [ ] Subscription overview

#### 9.2 Admin Tools
- [ ] User impersonation (support)
- [ ] Subscription management
- [ ] System health monitoring
- [ ] Audit logs viewer

---

### Phase 10: Landing Page & Marketing (Weeks 29-30)

#### 10.1 Landing Page
- [ ] Hero section
- [ ] Feature highlights
- [ ] Pricing section
- [ ] Testimonials
- [ ] FAQ section
- [ ] Footer with links

#### 10.2 Marketing Pages
- [ ] Features page
- [ ] Pricing page
- [ ] About page
- [ ] Contact page
- [ ] Blog (optional)

---

### Phase 11: Production Readiness (Weeks 31-33)

#### 11.1 Error Tracking
- [ ] GlitchTip setup
- [ ] Error boundary components
- [ ] Error logging
- [ ] Alert configuration

#### 11.2 Analytics
- [ ] Vercel Analytics setup
- [ ] Custom event tracking
- [ ] Conversion tracking

#### 11.3 Background Jobs
- [ ] Upstash QStash setup
- [ ] Scheduled jobs:
  - [ ] Invoice reminders
  - [ ] Tax deadline notifications
  - [ ] Report generation
  - [ ] Data cleanup

#### 11.4 Performance & Security
- [ ] API rate limiting
- [ ] Input validation
- [ ] CSRF protection
- [ ] Security headers
- [ ] Performance optimization
- [ ] Image optimization
- [ ] Database indexing

#### 11.5 Deployment
- [ ] Vercel deployment configuration
- [ ] Docker production setup
- [ ] Environment variable management
- [ ] CI/CD pipeline
- [ ] Database backup strategy

---

## Environment Variables

```env
# .env.example

# App
NEXT_PUBLIC_APP_NAME="Aifinza"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/aifinza"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# AI Providers
AI_DEFAULT_PROVIDER="claude"

OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4-turbo-preview"

ANTHROPIC_API_KEY=""
ANTHROPIC_MODEL="claude-sonnet-4-20250514"

GOOGLE_AI_API_KEY=""
GOOGLE_AI_MODEL="gemini-pro"

DEEPSEEK_API_KEY=""
DEEPSEEK_MODEL="deepseek-chat"

# Email (Forwardemail.net)
EMAIL_SERVER_HOST="smtp.forwardemail.net"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_FROM="noreply@aifinza.co.za"

# Stripe
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_STARTER_PRICE_ID=""
STRIPE_PROFESSIONAL_PRICE_ID=""
STRIPE_ENTERPRISE_PRICE_ID=""

# File Storage
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""

# Error Tracking (GlitchTip)
GLITCHTIP_DSN=""

# Background Jobs (Upstash)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
QSTASH_URL=""
QSTASH_TOKEN=""

# Rate Limiting
RATE_LIMIT_REQUESTS="100"
RATE_LIMIT_WINDOW="60"
```

---

## South African Specific Constants

```typescript
// src/lib/constants/south-africa.ts

export const VAT_RATE = 0.15; // 15%

export const UIF_RATE_EMPLOYEE = 0.01; // 1%
export const UIF_RATE_EMPLOYER = 0.01; // 1%
export const SDL_RATE = 0.01; // 1% of payroll

export const PROVINCES = [
  { value: 'EASTERN_CAPE', label: 'Eastern Cape' },
  { value: 'FREE_STATE', label: 'Free State' },
  { value: 'GAUTENG', label: 'Gauteng' },
  { value: 'KWAZULU_NATAL', label: 'KwaZulu-Natal' },
  { value: 'LIMPOPO', label: 'Limpopo' },
  { value: 'MPUMALANGA', label: 'Mpumalanga' },
  { value: 'NORTHERN_CAPE', label: 'Northern Cape' },
  { value: 'NORTH_WEST', label: 'North West' },
  { value: 'WESTERN_CAPE', label: 'Western Cape' },
] as const;

export const SA_BANKS = [
  { value: 'ABSA', label: 'ABSA', branchCode: '632005' },
  { value: 'CAPITEC', label: 'Capitec Bank', branchCode: '470010' },
  { value: 'FNB', label: 'First National Bank', branchCode: '250655' },
  { value: 'NEDBANK', label: 'Nedbank', branchCode: '198765' },
  { value: 'STANDARD_BANK', label: 'Standard Bank', branchCode: '051001' },
  { value: 'INVESTEC', label: 'Investec', branchCode: '580105' },
  { value: 'AFRICAN_BANK', label: 'African Bank', branchCode: '430000' },
  { value: 'BIDVEST', label: 'Bidvest Bank', branchCode: '462005' },
  { value: 'DISCOVERY', label: 'Discovery Bank', branchCode: '679000' },
  { value: 'TYME', label: 'TymeBank', branchCode: '678910' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const BUSINESS_TYPES = [
  { value: 'SOLE_PROPRIETOR', label: 'Sole Proprietor' },
  { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'PRIVATE_COMPANY', label: 'Private Company (Pty) Ltd' },
  { value: 'PUBLIC_COMPANY', label: 'Public Company' },
  { value: 'CLOSE_CORPORATION', label: 'Close Corporation (CC)' },
  { value: 'NON_PROFIT', label: 'Non-Profit Organisation' },
  { value: 'TRUST', label: 'Trust' },
  { value: 'OTHER', label: 'Other' },
] as const;

// Tax year in SA runs from March 1 to February 28/29
export const TAX_YEAR_START_MONTH = 3; // March
export const TAX_YEAR_END_MONTH = 2; // February

// PAYE Tax Tables (2024/2025) - to be updated annually
export const PAYE_TAX_BRACKETS = [
  { min: 0, max: 237100, rate: 0.18, rebate: 0 },
  { min: 237101, max: 370500, rate: 0.26, rebate: 42678 },
  { min: 370501, max: 512800, rate: 0.31, rebate: 77362 },
  { min: 512801, max: 673000, rate: 0.36, rebate: 121475 },
  { min: 673001, max: 857900, rate: 0.39, rebate: 179147 },
  { min: 857901, max: 1817000, rate: 0.41, rebate: 251258 },
  { min: 1817001, max: Infinity, rate: 0.45, rebate: 644489 },
] as const;

// Tax Rebates (2024/2025)
export const TAX_REBATES = {
  primary: 17235,      // All taxpayers
  secondary: 9444,     // 65 and older
  tertiary: 3145,      // 75 and older
} as const;

// Tax Thresholds (2024/2025)
export const TAX_THRESHOLDS = {
  under65: 95750,
  aged65to74: 148217,
  aged75plus: 165689,
} as const;
```

---

## Getting Started Commands

```bash
# Verify Node.js version (must be 20.9+)
node -v

# Navigate to project directory
cd ~/projects/aifinza

# Clear the forked repository contents (start fresh)
rm -rf ./* ./.*  2>/dev/null; git init

# Initialize new Next.js 16+ project (clean slate)
# Turbopack is now the default bundler - no extra config needed
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install core dependencies
npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter
npm install @tanstack/react-query axios zod react-hook-form @hookform/resolvers
npm install date-fns decimal.js

# Install shadcn/ui
npx shadcn@latest init

# Install AI dependencies (Vercel AI SDK + providers)
npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google
# Note: DeepSeek uses OpenAI-compatible API

# Install email dependencies
npm install @react-email/components resend

# Install Stripe
npm install stripe @stripe/stripe-js

# Install utilities
npm install uploadthing @uploadthing/react
npm install @upstash/redis @upstash/ratelimit @upstash/qstash

# Install React Compiler (for automatic memoization)
npm install babel-plugin-react-compiler@latest

# Development dependencies
npm install -D prisma @types/node

# Initialize Prisma
npx prisma init
```

### Next.js 16 Configuration

After initialization, update `next.config.ts`:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React Compiler for automatic memoization
  reactCompiler: true,
  
  experimental: {
    // Enable Cache Components
    cacheComponents: true,
    // Faster dev startup with Turbopack filesystem caching
    turbopackFileSystemCacheForDev: true,
  },
  
  // TypeScript and ESLint
  typescript: {
    // Set to true only for production builds if needed
    ignoreBuildErrors: false,
  },
  eslint: {
    // Run ESLint directly, not via `next lint`
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
```

---

## Notes for Claude Code

### Next.js 16 Specific Guidance
1. **Use `proxy.ts`** instead of `middleware.ts` for request handling
2. **Use `"use cache"` directive** for explicit caching (caching is opt-in now)
3. **Turbopack is default** - no need to configure, it just works
4. **React Compiler** handles memoization - reduce manual `useMemo`/`useCallback`
5. **Use View Transitions** (React 19.2) for smooth navigation animations
6. **ESLint directly** - don't use `next lint` (deprecated)
7. **Node.js 20.9+** is required - verify before starting

### General Development Guidelines
1. **Start with Phase 1** - Get the foundation solid before adding features
2. **Test each phase** before moving to the next
3. **Commit frequently** with descriptive messages
4. **Ask questions** if requirements are unclear
5. **Document as you go** - update README and add JSDoc comments
6. **Keep accessibility in mind** - use semantic HTML and ARIA labels
7. **Mobile-first** - ensure responsive design throughout
8. **SA-specific** - always consider South African context (ZAR, VAT, SARS)

---

## Reference: Sure App

The original Sure app (forked to this repo) can be used as reference for:
- UI/UX patterns and layouts
- Feature implementation ideas
- Database relationship patterns

However, build fresh rather than converting the Ruby on Rails codebase.

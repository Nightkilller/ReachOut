# ReachOut 🚀

> **Smart AI-Powered Personal Outreach Platform** — Send personalized cold emails tailored per company domain with your resume attached, with intelligent anti-penalty throttling and Gmail SMTP delivery.

![ReachOut Banner](public/logo.svg)

---

## ✨ Features

- **🤖 Company-Tailored AI Generation**: Automatically detects target company from recipient email domains (e.g. `hr@tcs.com` → Tata Consultancy Services) and generates bespoke personalized pitches via Groq (LLaMA 3.3 70B) & Google Gemini.
- **🛡️ Anti-Penalty Send Engine**:
  - **Customizable Throttling**: Choose between ⚡ Fast (15s), 🛡️ Safe (30s), 🐢 Stealth (60s), or Custom delays between sends to protect your Gmail reputation.
  - **Email Humanization**: Invisible Unicode spacing & greeting variations to bypass duplicate-content spam filters.
  - **Daily Safety Quotas**: Real-time quota tracker to stay well within Gmail free tier limits (soft limit: 100/day, hard limit: 450/day).
- **📅 Outreach Activity Calendar**: Visual interactive calendar showing sent email volume per day, with complete recipient history and email inspector.
- **⚡ Live Email Preview**: Real-time split preview card showing how your message looks before sending.
- **🔒 AES-256 Encrypted Security**: Gmail App Passwords and credentials are encrypted at rest using AES-256-GCM.
- **👥 Address Book & CSV Import**: Bulk upload recipient lists with auto-detected companies and instant search.
- **📎 Resume PDF Attachment**: Seamless drag-and-drop resume attachment uploaded directly with each campaign.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (Turbopack, App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS + Shadcn UI + Lucide Icons
- **Database**: PostgreSQL (Neon Serverless) + Prisma ORM
- **Authentication**: Clerk Auth
- **AI Engines**: Groq (LLaMA 3.3 70B) & Google Gemini Flash
- **Email Delivery**: Nodemailer via Gmail SMTP & Google App Passwords

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Nightkilller/ReachOut.git
cd ReachOut
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the following variables:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY` from [Clerk](https://clerk.com)
- `DATABASE_URL` from [Neon Postgres](https://neon.tech)
- `ENCRYPTION_KEY` (32-byte hex string: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `GROQ_API_KEY` from [Groq Console](https://console.groq.com)
- `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com)

### 4. Initialize the Database
```bash
npx prisma db push
```

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security & Privacy

- Sensitive environment variables are never committed to version control.
- User uploaded resumes are stored locally and ignored in `.gitignore`.
- Passwords and SMTP tokens are encrypted via AES-256-GCM.

---

## 📄 License
MIT License. Built for personal cold email outreach.

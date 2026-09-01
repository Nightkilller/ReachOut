<div align="center">
  <img src="public/logo-icon.svg" width="85" height="85" alt="ReachOut Logo" />
  <h1>ReachOut</h1>
  <p><strong>Smart, AI-Powered Personal Outreach Platform</strong></p>
  <p>Send hyper-personalized cold outreach emails tailored per company domain — straight from your Gmail with your resume attached.</p>

  <p>
    <a href="https://reach-out-tgc5.vercel.app/" target="_blank">
      <img src="https://img.shields.io/badge/Live%20Demo-reach--out--tgc5.vercel.app-2563eb?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
    </a>
  </p>

  <p>🔗 <strong>Live App:</strong> <a href="https://reach-out-tgc5.vercel.app/">https://reach-out-tgc5.vercel.app/</a></p>
</div>

---

## 💡 What is ReachOut?

**ReachOut** is built for students, developers, and professionals doing internship and job outreach. 

Instead of copying and pasting generic email templates, ReachOut:
1. **Auto-detects target companies** from recipient email domains (e.g., `recruiter@google.com` ➔ Google).
2. **Generates tailored email pitches** using fast AI (Groq LLaMA 3.3 70B & Google Gemini) highlighting your relevant skills and projects.
3. **Attaches your resume PDF** automatically to every email.
4. **Delivers directly from your Gmail** using encrypted Google App Passwords with smart anti-penalty delays (2s–15s gap) so your emails land in the primary inbox, not the spam folder.

---

## ✨ Key Features

- 🤖 **Company-Specific AI Personalization**: Every email is uniquely written and tailored for the recipient's company.
- 📎 **One-Click Resume Attachment**: Attach your resume PDF once, and it gets automatically attached to all emails in the campaign.
- ⏱️ **Anti-Penalty Send Throttling**: Choose your send pace (**Fast: 2s**, **Safe: 5s**, **Stealth: 15s**, or Custom) to protect your sender reputation.
- 🔒 **AES-256-GCM Encryption**: Your Gmail credentials are encrypted at rest using military-grade encryption.
- 👥 **Address Book & CSV Upload**: Import contacts in bulk or add them individually with instant domain detection.
- 📊 **Outreach History & Activity Calendar**: Track sent emails, delivery status, and daily outreach volume.

---

## 🛠️ Tech Stack

- **Frontend & Backend**: [Next.js](https://nextjs.org/) (App Router, Turbopack) + React 19 + TypeScript
- **Styling**: Tailwind CSS + Shadcn UI + Lucide Icons
- **Database**: PostgreSQL via [Neon](https://neon.tech/) + [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Clerk](https://clerk.com/)
- **AI Intelligence**: [Groq](https://groq.com/) (LLaMA 3.3 70B) & [Google Gemini](https://ai.google.dev/)
- **Email Delivery**: Nodemailer via Gmail SMTP & Google App Passwords

---

## 🚀 Quick Setup & Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/Nightkilller/ReachOut.git
cd ReachOut/coldmail
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
DATABASE_URL="your_neon_postgres_url"
ENCRYPTION_KEY=your_64_character_hex_encryption_key
GROQ_API_KEY=your_groq_api_key
```

### 4. Push database schema
```bash
npx prisma db push
```

### 5. Start the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 How to Connect Gmail

1. Turn on **2-Step Verification** in your Google Account.
2. Visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. Create an App Password (name it `ReachOut`).
4. In ReachOut, go to **Settings**, enter your Gmail and the 16-character App Password, and click **Test Connection** & **Save**.

---

## 📄 License
MIT License. Built for personal outreach.

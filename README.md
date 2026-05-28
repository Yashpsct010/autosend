# AutoSend 🚀

AutoSend is a sleek, modern HR & Sales Outreach Dashboard built with Next.js. It allows you to manage contacts, create personalized email templates using merge tags, and dispatch bulk emails securely directly through the Gmail API.

## Features ✨

- **Contact Management:** Upload CSV files of your contacts or add them manually. Includes robust search and filtering.
- **Smart Email Templates:** Build templates using dynamic merge tags (e.g. `{{FirstName}}`, `{{Company}}`).
- **Live Preview:** See exactly what your email will look like for specific contacts before you hit send.
- **Direct Gmail Integration:** Uses OAuth 2.0 and the official Google APIs to send emails directly from your Gmail account—no complicated SMTP configuration required!
- **Dark Mode UI:** A beautiful, responsive glassmorphism UI built with Tailwind CSS.

## Tech Stack 🛠️

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Database:** PostgreSQL (via [Prisma ORM](https://www.prisma.io/))
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) (Auth.js) with Google Provider
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)

## Getting Started 💻

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/autosend.git
cd autosend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory and add the following variables:

```env
# Database
DATABASE_URL="your_postgresql_connection_string"

# NextAuth
NEXTAUTH_SECRET="your_nextauth_secret_key"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_oauth_client_id"
GOOGLE_CLIENT_SECRET="your_google_oauth_client_secret"
```

*Note: For the Google OAuth app, ensure you have enabled the Gmail API and added the `https://www.googleapis.com/auth/gmail.send` scope in your Google Cloud Console.*

### 4. Setup Database

Run the Prisma migrations to set up your PostgreSQL database schema:

```bash
npx prisma db push
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application!

## Google OAuth Setup Guide

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Navigate to **APIs & Services > Library** and enable the **Gmail API**.
4. Go to **OAuth consent screen**. Configure your app and make sure to add the `https://www.googleapis.com/auth/gmail.send` scope.
5. Go to **Credentials**, click **Create Credentials > OAuth client ID**.
6. Set the Application type to **Web application**.
7. Add `http://localhost:3000/api/auth/callback/google` to the **Authorized redirect URIs**.
8. Copy the generated Client ID and Client Secret into your `.env` file.

## License

MIT

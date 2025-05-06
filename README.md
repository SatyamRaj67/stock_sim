# StockSmart - Your Smart Trading Partner

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![tRPC](https://img.shields.io/badge/tRPC-2596BE?style=for-the-badge&logo=trpc&logoColor=white)](https://trpc.io/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://next-auth.js.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Shadcn/ui](https://img.shields.io/badge/Shadcn/ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=for-the-badge&logo=radix-ui&logoColor=white)](https://www.radix-ui.com/)
[![Recharts](https://img.shields.io/badge/Recharts-8884d8?style=for-the-badge)](https://recharts.org/)

This is a web application designed to help users track their stock investments, analyze portfolio performance, and simulate trading activities.

## Description

StockSmart provides a platform for users to manage their stock portfolios, view market data, analyze performance trends, and track transaction history. It includes features for both regular users and administrators.

## Features

- **Authentication:** Secure user login and registration using NextAuth.js (Email/Password, Google, GitHub).
- **Dashboard:** Overview of portfolio value, total profit/loss, recent transactions, and performance charts.
- **Market View:** Browse available stocks, view current prices, and simulate buy/sell trades.
- **Portfolio Analytics:** In-depth analysis including historical performance, sector allocation, top/worst performers, and P&L by stock over different time ranges.
- **Transaction History:** Detailed log of all buy and sell transactions.
- **Admin Panel:** Manage stocks (add, edit, delete) and potentially user roles/data (role-based access control).
- **User Settings:** Update profile information, manage security settings (like 2FA).
- **Responsive Design:** Adapts to different screen sizes.
- **Theme Toggle:** Switch between light and dark modes.

## Tech Stack

- **Framework:** Next.js
- **Language:** TypeScript
- **API:** tRPC
- **Database ORM:** Prisma
- **Database:** PostgreSQL (or compatible based on `DATABASE_URL`)
- **Authentication:** NextAuth.js
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/ui, Radix UI
- **Charting:** Recharts
- **Schema Validation:** Zod
- **Number Handling:** Decimal.js
- **Email:** Resend (for password resets, verification)

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm, yarn, or pnpm
- A PostgreSQL database instance

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd learn_stock_backend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up environment variables:**

    - Create a `.env` file in the root directory.
    - Copy the contents of `env.js` or an example file (`.env.example` if available) into `.env`.
    - Fill in the required environment variables, including:
      - `DATABASE_URL`: Your PostgreSQL connection string.
      - `AUTH_SECRET`: A secret key for NextAuth.js (generate one using `openssl rand -base64 32`).
      - `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`: For Google OAuth.
      - `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`: For GitHub OAuth.
      - `RESEND_API_KEY`: For sending emails via Resend.
      - `NEXT_PUBLIC_API_URL`: The base URL of your application (e.g., `http://localhost:3000`).

4.  **Set up the database:**

    - Run Prisma migrations to create the database schema:
      ```bash
      npx prisma migrate dev
      ```
    - (Optional) Seed the database if a seed script is available:
      ```bash
      npx prisma db seed
      ```

5.  **Run the development server:**

    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

6.  Open [http://localhost:3000](http://localhost:3000) (or your configured port) in your browser.

## Usage

- Navigate through the application using the sidebar.
- Register or log in to access protected routes like the Dashboard, Market, Analytics, and Transactions.
- Use the Market page to view stocks and simulate trades.
- Analyze your portfolio performance on the Analytics page.
- Review your trade history on the Transactions page.
- Access admin features (if your user has the ADMIN role) via the `/admin` routes.

## Contributing

Contributions are welcome! Please follow standard Git workflow (fork, branch, commit, pull request). Ensure code follows existing style and conventions.

## License

Currently None

## TODO

[ ] Develop Notifications
[ ] Develop Watchlist for Users

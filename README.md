# Marotto Solutions Web Platform

A unified web platform for **Marotto Solutions**, combining a public business homepage with a private internal dashboard for business management. The application handles service showcases, quote requests, and document management (Invoices, Estimates, Receipts).

## Features

### 🌍 Public Homepage
- **Service Case**: Showcases General Contracting, IT/Networking, PC Building, and Programming services.
- **Quote Request System**: Clients can submit project details and schedule preferences directly from the site.
- **Responsive Design**: Built with Radix UI for a clean, modern, and accessible interface.

### 🔐 Internal Dashboard (`/dashboard`)
- **Document Management**: Create, view, and manage:
  - **Invoices**: Track billing and payments.
  - **Estimates**: Send quotes to clients.
  - **Receipts**: Track business expenses.
  - **Leads**: View incoming quote requests from the homepage.
- **WebDAV Storage**: All data is stored as flat JSON files via WebDAV, allowing for easy self-hosting (e.g., Nextcloud) and data ownership.
- **Import Tools**: Bulk import capabilities for receipt processing.

## Tech Stack
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Radix UI Themes](https://www.radix-ui.com/) & CSS Modules
- **Icons**: Lucide React
- **Storage**: WebDAV (JSON-based document store)
- **Containerization**: Docker & Docker Compose

## Project Structure

```
src/
├── app/
│   ├── actions.ts       # Server Actions for forms and data mutations
│   ├── page.tsx         # Public Homepage
│   ├── proxy.ts         # Authentication Proxy Middleware
│   ├── dashboard/       # Private Dashboard Gateway
│   ├── estimates/       # Estimate management
│   ├── invoices/        # Invoice management
│   ├── receipts/        # Receipt management
│   └── settings/        # App configuration (WebDAV connection)
├── lib/
│   ├── data.ts          # Data fetching logic
│   ├── webdav.ts        # WebDAV client implementation
│   └── types.ts         # TypeScript definitions
└── scripts/
    └── convert-receipts.js # Utility for batch processing receipts
```

## Getting Started

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

3. **Configure Storage**:
   - Go to `/settings` or `/dashboard`.
   - Configure your WebDAV URL and credentials to enable data persistence.

### Docker Deployment

The project includes a `Dockerfile` and `docker-compose.yml` for easy deployment.

```bash
docker compose up -d --build
```

The application will be available at port `3000`.

## Authentication

This application is designed to sit behind an authentication proxy (like **Authentik** or **Authelia**). 

- **Middleware**: `src/proxy.ts` is configured to intercept requests.
- **Configuration**: By default, it allows all traffic but serves as a placeholder for header-based authentication checks (e.g., verifying `X-authentik-username`).

## License

Private repository for Marotto Solutions.

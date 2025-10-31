# BIVA Real Estate Platform

## Overview

BIVA is a real estate platform for Angola connecting property owners, tenants, buyers, and agents. It facilitates property listings, search, contract management, visit scheduling, and proposal handling. The platform emphasizes a strong user experience with smooth animations, interactive maps, and a modern PropTech aesthetic inspired by Zillow, Redfin, Linear, and Stripe.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

- **Framework**: React 18+ with TypeScript, Vite for build.
- **UI**: Shadcn/ui (Radix UI), Tailwind CSS (custom design system), Framer Motion for animations.
- **State Management**: React Query for server state, Wouter for routing, React Hook Form with Zod for forms.
- **Design**: Professional blue primary color, Inter/Plus Jakarta Sans fonts, consistent spacing, max 1280px container width.
- **Key Features**: Animated hero, advanced property search, interactive cards, responsive design, property approval workflow.

### Backend

- **Framework**: Express.js with TypeScript for REST API.
- **Authentication**: Session-based using `express-session`, Bcrypt for password hashing, phone number as identifier.
- **Authorization**: Role-based (proprietario, cliente, corretor) with middleware.
- **API Design**: RESTful endpoints, Zod for request validation.
- **Key Endpoints**: `/api/auth/*`, `/api/properties`, `/api/contracts`, `/api/visits`, `/api/proposals`, `/api/payments`.

### Data Storage

- **Database**: PostgreSQL (Supabase) via Drizzle ORM with `pg` driver.
- **Connection**: Supabase Session Pooler (IPv4-compatible) at `aws-1-sa-east-1.pooler.supabase.com`.
- **Schema**: `users`, `properties` (with approval status), `contracts`, `visits`, `proposals`, `payments`, `notifications`, `virtualTours`, `tourRooms`, `tourHotspots`, `advertisements`.
- **Data Layer**: Storage abstraction, centralized connection management, Drizzle Kit for migrations.
- **Migration**: Migrated from Neon to Supabase (October 2025) using Session Pooler for IPv4 compatibility with Replit.

### Authentication & Authorization

- **Authentication**: Session-based with `express-session` and `connect-pg-simple`. Phone number as ID.
- **Authorization**: Three roles (proprietario, cliente, corretor), middleware-based role checking.
- **Security**: CSRF protection, credential-based API calls, Zod for password validation.

### Property Approval System

- **Workflow**: `pendente` (awaiting admin), `aprovado` (public), `recusado` (admin rejected).
- **Features**: New properties are `pendente`, public only sees `aprovado`, owners view all their properties, admins approve/reject with feedback, owners acknowledge rejections.
- **API**: Endpoints for fetching pending, approving, rejecting, and acknowledging rejections.
- **Frontend Pages**: `/imoveis-pendentes` (owner), `/admin/aprovar-imoveis` (admin).

### Performance Optimizations

- **Connection Pooling**: Advanced configuration with 10 max connections, 2 min idle, keep-alive enabled (10s initial delay), 30-minute max lifetime, statement/query timeouts (30s), graceful shutdown handlers, event monitoring for debugging.
- **In-Memory Caching**: Multi-layer caching system with automatic TTL expiration (5 minutes), pattern-based invalidation, dedicated user cache (5m TTL) with exact key invalidation on profile/status changes.
- **HTTP Compression**: Gzip compression (level 6) for responses >1KB, reducing bandwidth usage by 60-80%.
- **ETag Support**: MD5-based ETags for efficient browser caching with HTTP 304 Not Modified responses, reducing unnecessary data transfer.
- **Rate Limiting**: Per-client rate limiting (200 req/min per IP) with automatic cleanup, proxy-aware configuration (`trust proxy`) for Render deployment.
- **Pagination**: Default 30 items per page (93% reduction), max 200 items, custom response structure.
- **Image Optimization**: Lazy loading (`loading="lazy"`, `decoding="async"`), client-side compression (1200px max width, 75% JPEG quality) reducing size by 70-80%, separate endpoint for images with 24h cache.
- **Database Optimizations**: Strategic composite indexes including new additions (`users: phone+status`, `proposals: property+status, cliente+status`, `payments: contract+status, status+vencimento`), query limits, field selection (listings return only thumbnails).
- **HTTP Caching**: `Cache-Control` headers for properties (120s), virtual tours (300s), and images (24h).
- **React Query**: `staleTime: 0`, `gcTime: 5m`, disabled auto-refetch, parallel `invalidateQueries` on mutations for instant UI updates.

## External Dependencies

### Third-Party Services

- **Database Hosting**: Supabase PostgreSQL.
- **Font Services**: Google Fonts (Inter, Plus Jakarta Sans).

### Key NPM Packages

- **UI & Styling**: `@radix-ui/*`, `tailwindcss`, `framer-motion`, `class-variance-authority`, `embla-carousel-react`.
- **Data & State Management**: `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`, `drizzle-orm`, `drizzle-kit`.
- **Backend**: `express`, `express-session`, `connect-pg-simple`, `bcrypt`, `pg` (node-postgres).
- **Developer Tools**: `typescript`, `vite`, `esbuild`, `tsx`, `wouter`, `drizzle-kit`.

### Asset Management

- **Images**: Stock images in `attached_assets/stock_images/`, generated images in `attached_assets/generated_images/`, Vite alias `@assets`.
- **Property Images**: Stored in Replit Object Storage with automatic base64 fallback.
  - **Primary**: Replit Object Storage (`@replit/object-storage`) for scalable file hosting.
  - **Fallback**: Base64 encoding when Object Storage is unavailable.
  - **URL Generation**: Full shareable URLs (`https://yourapp.replit.app/api/storage/properties/...`) for Object Storage, data URLs for base64.
  - **Serving**: Images served via `/api/storage/properties/:filename` endpoint with 24h cache.
  - **Configuration**: Lazy initialization, automatic fallback, 5MB file limit, 10 files max per upload.

### Future Integration Considerations

- **Map Integration**: Planned for Google Maps or Mapbox with marker clustering and geocoding.
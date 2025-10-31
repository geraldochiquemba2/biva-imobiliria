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

- **Database**: PostgreSQL (Supabase) via Drizzle ORM.
- **Schema**: `users`, `properties` (with approval status), `contracts`, `visits`, `proposals`, `payments`.
- **Data Layer**: Storage abstraction, centralized connection management, Drizzle Kit for migrations.

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

- **Connection Pooling**: Optimized with 3 max connections, 30s idle timeout for efficient resource usage.
- **Pagination**: Default 30 items per page (93% reduction), max 200 items, custom response structure.
- **Image Optimization**: Lazy loading (`loading="lazy"`, `decoding="async"`), client-side compression (1200px max width, 75% JPEG quality) reducing size by 70-80%.
- **Database Optimizations**: Strategic composite indexes (`status + featured`, `type + status`, `status + createdAt`, `approvalStatus + ownerId`), query limits, field selection (e.g., property listings return only thumbnails).
- **HTTP Caching**: `Cache-Control` headers for properties (120s) and virtual tours (300s).
- **React Query**: `staleTime: 0`, `gcTime: 5m`, disabled auto-refetch, parallel `invalidateQueries` on mutations for instant UI updates.

## External Dependencies

### Third-Party Services

- **Database Hosting**: Supabase PostgreSQL.
- **Font Services**: Google Fonts (Inter, Plus Jakarta Sans).

### Key NPM Packages

- **UI & Styling**: `@radix-ui/*`, `tailwindcss`, `framer-motion`, `class-variance-authority`, `embla-carousel-react`.
- **Data & State Management**: `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`, `drizzle-orm`, `drizzle-kit`.
- **Backend**: `express`, `express-session`, `connect-pg-simple`, `bcrypt`, `@neondatabase/serverless`.
- **Developer Tools**: `typescript`, `vite`, `esbuild`, `tsx`, `wouter`.

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
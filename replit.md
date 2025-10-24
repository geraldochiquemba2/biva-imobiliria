# BIVA Real Estate Platform

## Overview

BIVA is a modern real estate platform for Angola that connects property owners, tenants, buyers, and real estate agents. The platform enables property listings, search functionality, contract management, visit scheduling, and proposal handling. Built with a focus on user experience, the application features smooth animations, an interactive map integration, and a sophisticated tech startup aesthetic inspired by modern PropTech platforms like Zillow and Redfin combined with SaaS design patterns from Linear and Stripe.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type safety and modern component patterns
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for lightweight client-side routing
- React Query (TanStack Query) for server state management and API data fetching

**UI Component Library**
- Shadcn/ui components built on Radix UI primitives for accessible, customizable UI elements
- Tailwind CSS for utility-first styling with a custom design system
- CSS variables for theming support (light/dark mode)
- Framer Motion for smooth animations and micro-interactions

**Design System**
- Professional blue primary color (#0066FF or similar)
- Inter or Plus Jakarta Sans typography
- Consistent spacing using Tailwind units (p-4, m-8, gap-12)
- Max container width of 1280px (max-w-7xl)
- Component-based architecture with reusable UI elements

**Key Features**
- Animated hero section with Angola map visualization
- Advanced property search with multiple filters (location, price, bedrooms, property type)
- Interactive property cards with hover effects
- Responsive design for mobile and desktop
- Form validation using React Hook Form with Zod schemas

### Backend Architecture

**Server Framework**
- Express.js with TypeScript for the REST API
- Session-based authentication using express-session
- Bcrypt for password hashing (currently simplified for demo, ready for production upgrade)

**API Design**
- RESTful endpoints under `/api` prefix
- Authentication middleware for protected routes
- Role-based authorization (proprietario, cliente, corretor)
- Zod schemas for request validation matching database schema

**Key Endpoints**
- `/api/auth/*` - Authentication (login, register, logout, session management)
- `/api/properties` - Property CRUD operations with advanced search
- `/api/contracts` - Contract management
- `/api/visits` - Visit scheduling
- `/api/proposals` - Property proposals
- `/api/payments` - Payment tracking

### Data Storage

**Database**
- PostgreSQL as the primary database (via Neon serverless)
- Drizzle ORM for type-safe database queries and schema management
- WebSocket support for serverless PostgreSQL connections

**Database Schema**
- `users` - User accounts with types (proprietario, cliente, corretor)
- `properties` - Property listings with location, pricing, and features
- `contracts` - Rental and sale agreements
- `visits` - Scheduled property viewings
- `proposals` - Purchase/rental offers
- `payments` - Payment records linked to contracts

**Data Layer Pattern**
- Storage abstraction layer (`storage.ts`) providing clean interface to database operations
- Centralized database connection management (`db.ts`)
- Migration support via Drizzle Kit

### Authentication & Authorization

**Authentication Strategy**
- Session-based authentication using express-session with PostgreSQL session store (connect-pg-simple)
- Phone number as primary identifier (format: +244XXXXXXXXX for Angola)
- Bcrypt password hashing (10 rounds in production)
- Session data stored in database for persistence across server restarts

**Authorization Model**
- Three user roles: proprietario (property owner), cliente (client/tenant), corretor (broker/agent)
- Middleware-based role checking (`requireAuth`, `requireRole`)
- Admin corretor account for platform management

**Security Considerations**
- CSRF protection implicit through session cookies
- Credential-based fetch requests for API calls
- Password requirements enforced via Zod validation (minimum 6 characters)

### Development Workflow

**Database Management**
- `npm run db:push` - Push schema changes to database
- Automatic database seeding in development with demo users
- Demo credentials: admin@gmail.com/123456789 (corretor), proprietario@biva.ao/demo123, cliente@biva.ao/demo123

**Development Server**
- Hot module replacement via Vite
- Concurrent Express API server
- Automatic TypeScript compilation
- Development-only error overlays and debugging tools

**Build & Deployment**
- Production build: `npm run build`
- Separate client (Vite) and server (esbuild) bundling
- Static assets served from `/dist/public`
- Environment variable configuration for database connection

## External Dependencies

### Third-Party Services

**Database Hosting**
- Neon serverless PostgreSQL for cloud-hosted database
- WebSocket-based connection pooling for serverless compatibility
- Requires `DATABASE_URL` environment variable

**Font Services**
- Google Fonts for Inter and Playfair Display typefaces
- Preconnect hints for performance optimization

### Key NPM Packages

**UI & Styling**
- `@radix-ui/*` - Accessible component primitives (dialogs, dropdowns, forms, etc.)
- `tailwindcss` - Utility-first CSS framework
- `framer-motion` - Animation library for React
- `class-variance-authority` - Type-safe variant styles
- `embla-carousel-react` - Carousel component for hero section

**Data & State Management**
- `@tanstack/react-query` - Server state and caching
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Form validation integration
- `zod` - Schema validation library
- `drizzle-orm` - TypeScript ORM
- `drizzle-kit` - Database migrations and schema management

**Backend**
- `express` - Web server framework
- `express-session` - Session middleware
- `connect-pg-simple` - PostgreSQL session store
- `bcrypt` - Password hashing
- `@neondatabase/serverless` - Neon database driver

**Developer Tools**
- `typescript` - Type checking
- `vite` - Build tool and dev server
- `esbuild` - Fast JavaScript bundler
- `tsx` - TypeScript execution for Node.js
- `wouter` - Lightweight routing library

### Asset Management

**Image Storage**
- Stock images stored in `attached_assets/stock_images/`
- Generated images in `attached_assets/generated_images/`
- Vite alias `@assets` for clean imports
- Property images support via image URLs or local paths

### Future Integration Considerations

**Map Integration** (Planned)
- Google Maps or Mapbox for interactive property location visualization
- Marker clustering for property density
- Geocoding for address-to-coordinates conversion
- Integration mentioned in design guidelines but not yet implemented
# BIVA Real Estate Platform - Design Guidelines

## Design Approach
**Selected Approach:** Reference-Based (Tech Startup Aesthetic)
- Primary Inspiration: Modern PropTech platforms (Zillow, Redfin) combined with sleek SaaS design (Linear, Stripe)
- Focus: Sophisticated, futuristic minimalism with emphasis on smooth animations and micro-interactions
- Justification: Real estate platform requiring strong visual appeal to differentiate in market while maintaining usability

## Color Palette
- **Primary:** Professional blue (#0066FF or similar deep blue)
- **Secondary:** White (#FFFFFF) for clean backgrounds
- **Accent:** Neutral grays (#F5F5F5 for backgrounds, #333333 for text)
- **Interactive Elements:** Vibrant blue for CTAs and hover states
- **Map/Data Visualization:** Gradient blues to represent property density

## Typography System
**Font Families:**
- Primary: 'Inter' or 'Plus Jakarta Sans' (modern, clean sans-serif)
- Secondary: System font stack for optimal performance

**Hierarchy:**
- Hero Headline: Bold, 48-56px desktop / 32-40px mobile
- Section Headers: Semibold, 32-40px desktop / 24-28px mobile  
- Subheadings: Medium, 20-24px desktop / 18-20px mobile
- Body Text: Regular, 16-18px
- Small Text/Labels: Regular, 14-16px

## Layout System
**Spacing Units:** Tailwind units of 2, 4, 8, 12, 16, 20, 24 (e.g., p-4, m-8, gap-12)
- Consistent vertical rhythm: py-16 to py-24 for major sections
- Component internal padding: p-6 to p-8
- Card spacing: gap-6 to gap-8 in grids

**Container Strategy:**
- Max-width: 1280px (max-w-7xl) for main content
- Hero section: Full-width with inner container
- Search bar: max-w-4xl centered

## Hero Section Design
**Layout:**
- Full viewport height (min-h-screen) with gradient background
- Animated Angola map as background layer (SVG or Canvas-based)
- Centered content overlay with headline and search

**Animation Specifications:**
- Map illumination: Gradual fade-in of property location dots over 2-3 seconds
- Synchronized with headline text reveal (stagger animation, word-by-word or line-by-line)
- Subtle pulse effect on property location markers
- Use GSAP or Framer Motion for smooth, performant animations

**Content Structure:**
- Main headline: "Simplificando a Gestão Imobiliária em Angola"
- Subtitle: "Soluções digitais para o arrendamento e a venda de imóveis"
- Integrated search bar (see Search Component below)

## Search Bar Component
**Design:**
- Prominent, elevated card design with subtle shadow (shadow-xl)
- White background with rounded corners (rounded-2xl)
- Positioned centrally below hero headline

**Filter Elements:**
- Property Type toggle buttons: "Arrendar" / "Vender" with active state styling
- Location input: Combo-box with autocomplete for Bairro/Município/Província
- Price range: Dual-handle slider with Kz currency display
- Bedrooms: Dropdown or button group (0, 1, 2, 3, 4+)
- Search CTA: Large, prominent button with icon

**Interactions:**
- Smooth hover transitions (transition-all duration-300)
- Focus states with blue ring (ring-2 ring-blue-500)
- Quick fade animations on dropdown reveals

## Property Cards Grid
**Layout:**
- Grid: 3 columns desktop (grid-cols-3), 2 tablet (md:grid-cols-2), 1 mobile
- Gap: gap-6 to gap-8
- Container: max-w-7xl with proper padding

**Card Design:**
- Image: Aspect ratio 4:3, rounded-t-xl
- Content padding: p-6
- White background with subtle border or shadow
- Hover effect: Lift (translate-y-[-4px]) + enhanced shadow

**Animations:**
- Entrance: Staggered fade-in with slide-up (translate-y-8 to 0)
- Use Intersection Observer to trigger on scroll
- Timing: 100ms stagger between cards

**Card Content:**
- Property image (with overlay badge for property type)
- Price (large, bold Kz display)
- Location (icon + bairro/município)
- Key specs: bedrooms, bathrooms, area (icon-based row)

## User Profiles Carousel
**Layout:**
- 4 cards displayed: 2x2 grid on desktop, carousel on mobile
- Each card: Equal height with icon, title, description

**Profiles:**
1. Proprietários - "Gerenciar contratos e propriedades"
2. Clientes/Inquilinos - "Encontrar imóvel ideal"
3. Corretores - "Expandir portfólio de clientes"
4. Gestores de Imóveis - "Otimizar operações"

**Card Styling:**
- Minimal design with large icon (64px)
- Icon in branded blue with light background circle
- Short description text below
- Hover: Subtle scale effect (scale-105)

**Animation:**
- Auto-rotating carousel on mobile (5s intervals)
- Smooth slide transitions with easing
- Pause on hover

## Interactive Map Section
**Design:**
- Full-width section with embedded map background
- Overlay content card on left or right side
- Map: Google Maps or Mapbox integration with custom styling

**Map Features:**
- Custom markers for properties (branded blue pins)
- Cluster markers for density areas
- Animated marker drops on initial load
- Smooth zoom/pan interactions

**Overlay Content:**
- Feature description card
- CTA to explore map view
- Semi-transparent background with backdrop blur

## Call-to-Action Sections
**Primary CTAs:**
- "Cadastre-se como Proprietário/Corretor" - Professional targeting
- "Encontre seu Imóvel" - Client targeting

**Button Styling:**
- Large size (px-8 py-4)
- Bold, clear text
- Primary CTA: Blue background with white text
- Secondary CTA: Outline style with blue border
- Hover: Slight scale (scale-105) + shadow enhancement

**Placement:**
- Prominent in hero section
- Repeated strategically in footer or dedicated CTA section

## Animation & Interaction Principles
**Performance Requirements:**
- Target 60fps for all animations
- Use CSS transforms (translate, scale) over position changes
- Leverage GPU acceleration with will-change or transform3d
- Lazy load Lottie animations below fold
- Optimize map rendering with clustering

**Micro-Interactions:**
- Button hovers: 200ms ease-out transitions
- Input focus: Smooth ring appearance
- Card reveals: Staggered with 100-150ms delays
- Scroll-triggered animations: Use Intersection Observer with threshold 0.1

## Responsive Design Strategy
**Breakpoints:**
- Mobile: < 768px (single column, stacked layout)
- Tablet: 768px - 1024px (2-column grids)
- Desktop: > 1024px (3-column grids, full layouts)

**Mobile Optimizations:**
- Simplified hero with smaller map animation
- Vertical search filter stack
- Carousel for property cards and user profiles
- Hamburger navigation menu
- Touch-optimized interactive elements (min 44px tap targets)

## Images
**Hero Section:**
- Animated Angola map (SVG-based) as background element with property location dots
- Semi-transparent gradient overlay for text readability

**Property Cards:**
- High-quality property photographs (16:9 or 4:3 aspect ratio)
- Lazy-loaded with blur-up placeholder technique

**User Profile Icons:**
- Custom icon set for each user type (owner, client, broker, manager)
- Modern, line-based icon style matching overall aesthetic

**Map Section:**
- Live interactive map (Google Maps/Mapbox) with custom styling to match brand colors
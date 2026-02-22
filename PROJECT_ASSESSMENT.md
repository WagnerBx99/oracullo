# Oracullo (Base44) - Project Assessment & Development Guide

## 1. Project Overview & Context
This repository contains the codebase for **Oracullo** (also referred to as **Base44 App**), a full-stack application designed as a B2B management/dashboard system. It aggregates and synchronizes data from external ERPs and CRMs (like **OMIE** and **MERCOS**), presenting consolidated metrics, operational reports, and KPIs (e.g., Revenue, Ticket Average, Margin, Active Integrations) for multiple business modules (Comercial, Diretoria, Operacional).

The system architecture is divided into a frontend SPA and a Node.js REST API backend interacting directly with PostgreSQL databases (differentiating between a transactional and an analytical DB).

---

## 2. Technology Stack

### Frontend (Root Directory)
- **Framework**: React 18 + Vite.
- **Styling**: Tailwind CSS + Shadcn UI (Radix UI primitives).
- **Routing**: React Router DOM (v6).
- **State Management & Data Fetching**: TanStack React Query + Axios.
- **Form Handling & Validation**: React Hook Form + Zod.
- **Data Visualization**: Recharts, React Leaflet (maps), three.js (likely for a 3D component/effect), canvas-confetti.
- **Utilities**: Date-fns, Lodash.

### Backend (`/backend` Directory)
- **Framework**: Node.js + Express.
- **Database**: PostgreSQL (accessed via raw queries using the `pg` driver, differentiating pools `poolTransacional` and `poolAnalitico` – **No ORM** like Prisma or TypeORM is used).
- **Authentication**: JWT (`jsonwebtoken`) + cookies (`cookie-parser`) and bcrypt/bcryptjs for password hashing.
- **Configuration**: `dotenv` for environment variables.
- **Deployment**: Configured to run on an Ubuntu VPS using standard Linux services (`systemctl`) or `pm2`.

---

## 3. Architecture & Core Modules

### 3.1 Integrations
The core value of this system handles data sync from third-party systems:
- **MERCOS (CRM/B2B)**: Currently integrated via `/src/api/mercosService.js` and `backend/routes/mercos.js`. Support for throttling, pagination, and incremental sync. **Pending**: Webhooks, bidirectional sync, entity mapping, and production keys.
- **OMIE (ERP)**: Existing sync logic (`/api/omie` and `/api/omie-internal`). **Pending requirement**: Ensuring the `custo` (cost) field is synced for products to correctly calculate the Net Margin in the dashboard.

### 3.2 Key Backend Routes
- **Dashboard (`/api/dashboard`)**: Provides stats and KPIs. Recently refactored to aggregate data in real-time from `pedidos` rather than a static reporting table (`kpis_consolidados`).
- **Comercial / Operacional / Diretoria**: Departmental routes handling specific business logic.
- **Usuarios / Perfis / Clientes / Produtos**: CRUD functionalities.

---

## 4. Known Business Rules & Tech Debt

### 4.1 Real-Time KPI Calculation vs. Analytical DB
The dashboard computes KPIs directly from the `pedidos` table (e.g., `SUM(valor_total)` and `AVG(valor_total)`).
- **Tech Debt/Risk**: As the database grows, scanning raw tables for every dashboard load will cause bottlenecks.
- **Recommended Action**: Implement Redis caching, or reinstate a scheduled cron job to populate `kpis_consolidados` (Analytical DB) asynchronously. Add indexes to `data_pedido` and `integracao_id`.

### 4.2 Database Direct Queries
The application executes raw SQL statements (`await poolTransacional.query(...)`). This requires caution regarding SQL Injection (always use parameterized `$1, $2` queries) and makes schema refactoring harder. 
- **Rule**: If adding new filters or columns, always ensure exact column names are used. A recent critical bug occurred due to querying nonexistent columns like `ativo` and `total_registros` instead of `total_filiais`.

### 4.3 Missing Net Margin Computation
The dashboard currently returns `0.0%` for Net Margin (`Margem Líquida`) because the product costs (`custo`) are missing or not being systematically synced from OMIE.

### 4.4 Sandbox vs. Production Configurations
The Mercos integration uses Sandbox tokens. Before deploying live, the system must swap keys and set `isProduction = true` in the API service.

---

## 5. Guidelines for Future Development

1. **Developing Features**:
   - **Frontend**: Create cohesive, responsive components using Shadcn UI in `src/components/ui/`. Manage complex state or external API calls with `react-query` to ensure caching and loading states are handled out-of-the-box.
   - **Backend**: Place new route handlers in `backend/routes/`. Reuse the DB pools properly: `poolTransacional` for operational data and CRUD, `poolAnalitico` for heavy analytical/dashboard queries. Use parameterized queries strictly.

2. **Security & Authentication**:
   - Every protected route must use the `authenticate` middleware found in `backend/middleware/auth.js`.
   - Never expose raw API Keys from OMIE or MERCOS to the frontend. Proxy all external integration requests through the Oracullo backend.

3. **Deployments**:
   - The current CI/CD process relies on a direct pull to the VPS (`srv1011496`) and PM2 restars.
   - Before any production merge, ensure `deploy_vps.sh` scripts cover the structural changes or manually adapt them.

4. **Short-Term Priorities**:
   - Finish mapping MERCOS entities (`Clientes`, `Produtos`, `Pedidos`) into the Oracullo database.
   - Add field `company_token` to the external `Integracao` configuration model in DB to support MERCOS properly.
   - Fetch `custo` on OMIE synchronization to unlock Net Margin visualization on the board.

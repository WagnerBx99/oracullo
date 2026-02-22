# Oracullo (Base44) - B2B Management Dashboard

Oracullo (also known as Base44 App) is a full-stack, monorepo-style application designed as a B2B management and dashboard system. It aggregates and synchronizes data from external ERPs and CRMs (like OMIE and MERCOS) to present consolidated metrics, operational reports, and KPIs for multiple business modules (Comercial, Diretoria, Operacional).

The system consists of a frontend React SPA and a Node.js REST API backend interacting directly with PostgreSQL databases.

## 🛠 Technology Stack

### Frontend (Root Directory)
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS + Shadcn UI
- **Routing**: React Router DOM
- **Data Fetching**: TanStack React Query + Axios

### Backend (`/backend`)
- **Framework**: Node.js + Express
- **Database**: PostgreSQL (using `pg` driver with raw SQL queries)
- **Architecture**: 3 distinct databases for segregation of concerns:
  - `oracullo_gestao`: Users, Permissions, Integrations
  - `oracullo_transacional`: Operational Data (Clients, Products, Orders)
  - `oracullo_analitico`: Consolidated Data for Dashboards

---

## 🚀 Local Development Setup

To run this application locally, you will need **Node.js** (v18+) and **Docker** installed on your machine.
The development database is containerized for an easy start.

### 1. Start the PostgreSQL Database

We use Docker to spin up a PostgreSQL 15 instance and automatically populate the schemas for the three databases (`gestao`, `transacional`, `analitico`).

In the **root directory**, run:
```bash
docker compose up -d
```
*Wait a few seconds for the `docker-init.sh` script to run and populate the SQL schemas on the first boot.*

### 2. Configure the Backend

Navigate to the backend directory:
```bash
cd backend
```

Create an `.env` file based on `.env.example`, or use the local Docker defaults:
```env
# Banco de Dados Docker Local
DB_HOST=localhost
DB_PORT=5432
DB_USER=oracullo_user
DB_PASSWORD=oracullo123
DB_NAME_GESTAO=oracullo_gestao
DB_NAME_TRANSACIONAL=oracullo_transacional
DB_NAME_ANALITICO=oracullo_analitico

# Configurações do Servidor
PORT=3000
NODE_ENV=development

# JWT Secrets para desenvolvimento local
JWT_SECRET=super_secret_jwt_key
JWT_REFRESH_SECRET=super_secret_jwt_refresh_key
```

Install dependencies and start the backend development server:
```bash
npm install
npm run dev
```
*The backend runs on `http://localhost:3000`.*

### 3. Configure the Frontend

Open a new terminal session in the **root directory**.
The frontend `vite.config.js` is already configured to automatically proxy `/api` requests to `http://localhost:3000`.

Install dependencies and start the React app:
```bash
npm install
npm run dev
```

*The frontend runs on `http://localhost:5173`.*

### 4. Admin Access
By default, creating an admin user might be required to log in since the frontend restricts access without a valid JWT token. You can run custom SQL inserts against the `oracullo_gestao` database to inject a `.bcrypt` hashed user manually or use internal helper scripts if available.

---

## 🏗 Deployments

The backend can be deployed using `deploy_vps.sh` scripts against Ubuntu environments running `pm2` and nginx, while the frontend is usually built into a dist folder (`npm run build`). Always check `PROJECT_ASSESSMENT.md` for specific technical debts or structural changes regarding the live configurations.

# RiskGuard - Enterprise Risk Management SaaS

A modern, flexible risk management platform built with React, TypeScript, and Supabase.

## Features

### Core Risk Management
- **Flexible Risk Methodologies** - Support for ISO 31000, COSO, NIST frameworks
- **Configurable Risk Matrix** - Custom likelihood and impact scales
- **Inherent vs Residual Risk** - Track risk before and after controls
- **Risk Register** - Comprehensive risk inventory and tracking
- **Controls Management** - Link controls to risks and track effectiveness
- **Real-time Dashboards** - Risk heat maps and trend analysis

### Key Capabilities
- Multi-tenant SaaS architecture
- Role-based access control
- Audit trails for all changes
- Real-time collaboration
- Data import/export
- Custom reporting

## Tech Stack

- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Real-time)
- **Charts:** Recharts
- **State Management:** React Query
- **Routing:** React Router
- **Forms:** React Hook Form + Zod validation

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd risk-management-saas
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Configure your Supabase project:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql`
   - Update `.env` with your Supabase URL and anon key

5. Start the development server
```bash
npm start
```

## Database Schema

The application uses a flexible schema designed for multi-tenant risk management:

- **Organizations** - Multi-tenant support
- **Risk Methodologies** - Configurable frameworks
- **Risk Categories** - Hierarchical risk taxonomy
- **Risks** - Core risk register
- **Controls** - Risk mitigation controls
- **Risk Assessments** - Historical risk evaluations
- **Audit Logs** - Complete change tracking

## Development Roadmap

### Phase 1: Core Risk Management ✅
- [x] Project setup and architecture
- [x] Authentication and multi-tenancy
- [x] Basic risk register
- [ ] Risk assessment workflows
- [ ] Controls management
- [ ] Dashboard and reporting

### Phase 2: Advanced Features
- [ ] AI-powered risk scoring
- [ ] Advanced analytics
- [ ] Mobile application
- [ ] Third-party integrations

### Phase 3: Enterprise Features
- [ ] Advanced compliance modules
- [ ] Incident management
- [ ] Business continuity planning
- [ ] Advanced reporting and BI

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For support and questions, contact: support@riskguard.com

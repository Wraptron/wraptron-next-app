This is the Wraptron frontend, built with [Next.js](https://nextjs.org) and deployed via OpenNext (Cloudflare).

## Getting Started


### Users

|User Profile|Description|
|-------------|-------------|
|Administrator|App admin users with master permissions|
|Managers|Wraptron Leadership and project management|
|Staff| Employees from wraptron|
|Users| 1st time users, Potential customers and leads|
|Customers| Customers of wraptron|
|Vendors| Service providers for wraptron|

## Sales
### Process Flow
1. New Lead Generation - Contact
2. Sales Qualification - Deal
3. Discovery and Requirement - BRD
4. Sales Proposal - Quotation
5. Acceptance - PO and Move to projects

## Projects
### Process Flow
1. Planning - Milestone and Tasklist with target dates
2. UI/UX Design - Brand and Product Guideline, Copy Content and Media
3. Development
4. Quality 
5. Deployment 

## Support
### Process Flow
1. Production
2. Triage
3. Maintenance

## Accounts

 
## HR
### Roles and Responsiblities
- Recruitment & Talent Acquition
- Onboarding and Induction
- Operations and Performance Management
- Employee engagement
- Payroll
- Seperation


### Environment configuration (dev vs prod)

The frontend talks to the backend using `NEXT_PUBLIC_API_URL`.

- **Development**: configured in `.env.development`
- **Production**: configured in `.env.production`
- **Template**: `.env.example`
- **Personal overrides**: create `.env.local` (ignored by git)

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Run the development server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy

### Deploy to Cloudflare Workers (OpenNext)

This project is set up to deploy as a **Cloudflare Worker** using OpenNext.

Prerequisites:
- Cloudflare account
- Wrangler auth (`wrangler login`)
- A **publicly reachable backend API** (your prod backend cannot be `localhost`)

Steps:

1) Set the production API URL (build-time):

```bash
cd frontend/web
echo "NEXT_PUBLIC_API_URL=https://api.your-domain.com" > .env.production
```

2) Build + deploy:

```bash
npm install
npm run cf:deploy:prod
```

3) (Optional) Custom domain routing:
- Edit `wrangler.jsonc` and add `routes` under `env.production`.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

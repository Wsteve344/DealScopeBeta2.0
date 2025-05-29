import { z } from 'zod';

// Product schema for type safety
const productSchema = z.object({
  id: z.string(),
  priceId: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  mode: z.enum(['payment', 'subscription'])
});

export type Product = z.infer<typeof productSchema>;

// Credit packs (one-time payments)
export const creditPacks: Product[] = [
  {
    id: 'prod_SODfrIGB1L1XuH',
    priceId: 'price_1RTREJ07yY3S6Wgrh5GYY5MH',
    name: 'Elite Pack',
    description: '50 Credits (Save 20%)',
    price: 2250, // $45 per credit vs $65
    mode: 'payment'
  },
  {
    id: 'prod_SODfm7zxwdhhPp',
    priceId: 'price_1RTRDw07yY3S6WgrNHz4OfER',
    name: 'Pro Pack',
    description: '15 credits (Save 15%)',
    price: 825, // $55 per credit vs $65
    mode: 'payment'
  },
  {
    id: 'prod_SODe2fPVbHCVbJ',
    priceId: 'price_1RTRDa07yY3S6WgrANGOBT5P',
    name: 'Starter Pack',
    description: '5 Credits',
    price: 325, // $65 per credit
    mode: 'payment'
  }
];

// Subscription plans (recurring payments)
export const subscriptionPlans: Product[] = [
  {
    id: 'prod_SODdMLyIMBDkbE',
    priceId: 'price_1RTRCW07yY3S6WgrcMOuI7db',
    name: 'Elite',
    description: 'DealScope Elite ($599/mo)\nSubmit unlimited deals and monitor all in real time\n20 Elite Report credits/month\nFast-Track 48-hr turnaround on reports\nDedicated account manager & priority phone support\nFull API access, white-label branding & custom integrations',
    price: 599,
    mode: 'subscription'
  },
  {
    id: 'prod_SODdQ2guwuqNYZ',
    priceId: 'price_1RTRC107yY3S6WgrUVh5yoUd',
    name: 'Pro',
    description: 'DealScope Pro ($299/mo)\nSubmit up to 3 deals and track real‐time analyst progress\n10 Pro Report credits/month\nPriority email support and direct analyst chat\nDashboard export & API access for portfolio tracking',
    price: 299,
    mode: 'subscription'
  },
  {
    id: 'prod_SODcQcDRBVsgIa',
    priceId: 'price_1RTRBd07yY3S6WgrewBNAXbT',
    name: 'Starter',
    description: 'DealScope Starter ($97/mo)\nSubmit 1 deal address and track real‐time analyst progress\n5 Basic Report credits/month\nAccess to core dashboard and progress notifications\nEmail support and beta feedback channel',
    price: 97,
    mode: 'subscription'
  }
];
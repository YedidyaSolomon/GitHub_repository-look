/**
 * Demo-only accounts (mock auth). Admins are not registered via UI — use these sign-in credentials.
 * Passwords are fake; stored only in this mock layer, never sent to Supabase.
 */
export const MOCK_DEMO_ACCOUNTS = {
  admin: {
    email: "admin@demo-therapy.local",
    password: "DemoAdmin!23",
  },
  businessActive: {
    email: "owner.active@demo-therapy.local",
    password: "DemoBiz!23",
  },
  businessNoSub: {
    email: "owner.nosub@demo-therapy.local",
    password: "DemoBiz!23",
  },
  businessPending: {
    email: "owner.pending@demo-therapy.local",
    password: "DemoBiz!23",
  },
  customer: {
    email: "customer@demo-therapy.local",
    password: "DemoCust!23",
  },
} as const;

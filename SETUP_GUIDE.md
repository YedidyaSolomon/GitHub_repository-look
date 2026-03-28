# Therapy Marketplace - Setup & Integration Guide

## Database Schema Requirements

Ensure your Supabase database has the following tables:

### 1. profiles
```sql
- id (UUID, PK)
- email (TEXT)
- role (ENUM: 'ADMIN', 'BUSINESS', 'CUSTOMER')
- full_name (TEXT)
- phone (TEXT)
- created_at (TIMESTAMP)
```

### 2. businesses
```sql
- id (UUID, PK)
- owner_id (UUID, FK to profiles)
- name (TEXT)
- email (TEXT)
- phone (TEXT)
- address (TEXT)
- status (ENUM: 'PENDING', 'APPROVED', 'SUSPENDED')
- subscription_status (ENUM: 'INACTIVE', 'ACTIVE', 'EXPIRED')
- subscription_plan (TEXT: 'MONTHLY', 'QUARTERLY', 'YEARLY')
- subscription_start_date (TIMESTAMP)
- rejection_reason (TEXT, nullable)
- created_at (TIMESTAMP)
```

### 3. transactions
```sql
- id (UUID, PK)
- business_id (UUID, FK to businesses)
- tx_ref (TEXT, unique)
- plan (TEXT: 'MONTHLY', 'QUARTERLY', 'YEARLY')
- amount (INTEGER, in cents)
- status (ENUM: 'pending', 'success', 'failed')
- verified (BOOLEAN)
- created_at (TIMESTAMP)
```

### 4. subscriptions
```sql
- id (UUID, PK)
- business_id (UUID, FK to businesses)
- transaction_id (UUID, FK to transactions)
- plan (TEXT: 'MONTHLY', 'QUARTERLY', 'YEARLY')
- status (ENUM: 'pending', 'ACTIVE', 'EXPIRED')
- start_date (TIMESTAMP, nullable)
- end_date (TIMESTAMP, nullable)
- created_at (TIMESTAMP)
```

### 5. services
```sql
- id (UUID, PK)
- business_id (UUID, FK to businesses)
- name (TEXT)
- description (TEXT)
- price (INTEGER, in cents)
- duration_minutes (INTEGER)
- created_at (TIMESTAMP)
```

### 6. specialists
```sql
- id (UUID, PK)
- business_id (UUID, FK to businesses)
- name (TEXT)
- specialty (TEXT)
- bio (TEXT, nullable)
- is_available (BOOLEAN)
- created_at (TIMESTAMP)
```

### 7. bookings
```sql
- id (UUID, PK)
- business_id (UUID, FK to businesses)
- service_id (UUID, FK to services)
- specialist_id (UUID, FK to specialists)
- customer_name (TEXT)
- customer_email (TEXT)
- customer_phone (TEXT)
- booking_date (TIMESTAMP)
- status (ENUM: 'pending', 'confirmed', 'completed', 'cancelled')
- created_at (TIMESTAMP)
```

## Environment Variables Required

Add these to your Vercel project variables:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
CHAPA_SECRET_KEY=<your-chapa-api-key>
NEXTAUTH_URL=<your-production-url> (for redirects)
```

## Chapa Integration Details

### Payment Flow

1. **Initiation**: POST `/api/initiate-chapa-payment`
   - Creates transaction and subscription records
   - Generates unique tx_ref
   - Returns checkout_url

2. **Callback**: POST `/api/chapa-callback`
   - Verifies payment with Chapa
   - Updates transaction status
   - Activates subscription
   - Updates business subscription_status

### Pricing

- Monthly: ₦49.00 (4900 cents)
- Quarterly: ₦147.00 (14700 cents)
- Yearly: ₦490.00 (49000 cents)

## User Flows

### Business Registration & Approval

1. Business registers via `/auth/business`
2. Profile created with role='BUSINESS', status='PENDING'
3. Admin sees pending businesses at `/dashboard/admin`
4. Admin approves → status changes to 'APPROVED'
5. Business redirected to pricing page → selects plan → initiates payment
6. After successful payment → subscription_status='ACTIVE'
7. Business can now manage services and specialists

### Customer Booking

1. Customer accesses `/dashboard/customer`
2. Searches for businesses (filters by subscription_status='ACTIVE')
3. Selects service and specialist
4. Books with guest info or account

## Testing Checklist

- [ ] Admin dashboard shows only PENDING businesses
- [ ] Approve button updates status to APPROVED
- [ ] Reject button updates status to SUSPENDED with reason
- [ ] Business sees pricing page after approval
- [ ] Chapa payment initiates correctly
- [ ] Callback updates subscription to ACTIVE
- [ ] Business can manage services/specialists after activation
- [ ] Customer can search and book services

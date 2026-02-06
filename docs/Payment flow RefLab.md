## **Payment flow**

Create stripe checkout payment workflow, make sure it is reusable.  
The payment will contain several executable main function that are represented in the front-end

* Billing history and invoices → insight into cost, connected to the user account  
* Payment method updates  
* Start subscription → Authorize recurring payments → Monthly subscriptions or yearly subscription (One time off)  
* Cancel subscription → Remove payment authorization  
* Success and failure notifications  
* Failed payment handling  
* Usage based billing?

### **Overview scheme**

Note that for the schematic there are the following main components:

* Regarding database layer (Supabase):  
1. `customers` \- Links users to Stripe customer IDs  
2. `subscriptions` \- Tracks subscription status, plan, billing period  
3. `invoices` \- Stores invoice history and status  
4. `payment_methods` \- Stores payment method details  
5. `usage_records` \- For usage-based billing tracking  
6. `webhook_events` \- Audit trail for Stripe webhooks  
* Stripe Integration Layer  
1. Customer management  
2. Subscription lifecycle  
3. Checkout sessions  
4. Payment intents  
5. Webhook handlers  
* Application Layer  
1. API routes for each user action  
2. Webhook endpoints  
3. Background jobs for usage tracking

![diagram-export-2-4-2026-5\_46\_08-PM.png][image1]Source: [https://app.eraser.io/workspace/KKGQr4MjGHxWbETWeXce?origin=share](https://app.eraser.io/workspace/KKGQr4MjGHxWbETWeXce?origin=share)  
In general the flowchart contains the following

* **Frontend buttons** (purple): All user-facing actions  
* **API Layer** (orange): Backend endpoints  
* **Stripe Operations** (green/red): Payment processing and decisions  
* **Webhooks** (teal): Event handlers  
* **Supabase Operations** (indigo): Database persistence  
* **Notifications** (yellow): User communications  
* **Decision Points** (diamond shapes): Payment success, retries, cancellation timing, usage limits  
* **End States** (blue/green/red): Final outcomes

### **Payment flow file/folder architecture**

project-root/  
├── supabase/  
│   ├── migrations/  
│   │   └── 20240204\_payment\_schema.sql  
│   └── functions/  
│       ├── stripe-webhook/  
│       │   ├── index.ts  
│       │   └── handlers/  
│       │       ├── checkout-complete.ts  
│       │       ├── subscription-updated.ts  
│       │       ├── payment-failed.ts  
│       │       └── invoice-paid.ts  
│       └── send-email/  
│           └── index.ts  
├── src/  
│   ├── lib/  
│   │   ├── supabase/  
│   │   │   ├── client.ts  
│   │   │   └── server.ts  
│   │   ├── stripe/  
│   │   │   ├── client.ts  
│   │   │   └── config.ts  
│   │   └── utils/  
│   │       └── helpers.ts  
│   ├── types/  
│   │   ├── database.types.ts  
│   │   └── stripe.types.ts  
│   ├── app/  
│   │   ├── api/  
│   │   │   ├── stripe/  
│   │   │   │   ├── create-checkout/route.ts  
│   │   │   │   ├── create-portal/route.ts  
│   │   │   │   ├── cancel-subscription/route.ts  
│   │   │   │   ├── get-invoices/route.ts  
│   │   │   │   ├── get-usage/route.ts  
│   │   │   │   └── track-usage/route.ts  
│   │   │   └── webhooks/  
│   │   │       └── stripe/route.ts  
│   │   ├── dashboard/  
│   │   │   ├── billing/  
│   │   │   │   ├── page.tsx  
│   │   │   │   └── components/  
│   │   │   │       ├── SubscriptionCard.tsx  
│   │   │   │       ├── InvoiceHistory.tsx  
│   │   │   │       ├── PaymentMethodCard.tsx  
│   │   │   │       └── UsageDisplay.tsx  
│   │   │   └── page.tsx  
│   │   └── success/page.tsx  
│   └── actions/  
│       └── stripe-actions.ts  
└── .env.local

### **API Routes ✓**

* ✓ `/api/stripe/create-checkout` \- Create checkout session  
* ✓ `/api/stripe/create-portal` \- Manage payment methods  
* ✓ `/api/stripe/cancel-subscription` \- Cancel subscription  
* ✓ `/api/stripe/get-invoices` \- Fetch invoices  
* ✓ `/api/stripe/get-usage` \- Get current usage  
* ✓ `/api/stripe/get-subscription` \- Get subscription status  
* ✓ `/api/stripe/track-usage` \- Track usage events  
* ✓ `/api/webhooks/stripe` \- Handle Stripe webhooks  
* ✓ `/api/notifications` \- Get/update notifications

### **Components ✓**

* ✓ `SubscriptionCard` \- Display subscription info  
* ✓ `InvoiceHistory` \- Show invoice list  
* ✓ `PaymentMethodCard` \- Manage payment methods  
* ✓ `UsageDisplay` \- Show current usage  
* ✓ `NotificationsPanel` \- Real-time notifications

### **Supabase Functions ✓**

* ✓ `send-email` \- Send transactional emails

### **Database ✓**

* ✓ All tables with RLS policies  
* ✓ Indexes for performance  
* ✓ Triggers for timestamps

### **Example code**

**.env variables for Stripe**  
*\# Stripe*  
NEXT\_PUBLIC\_STRIPE\_PUBLISHABLE\_KEY=pk\_test\_...  
STRIPE\_SECRET\_KEY=sk\_test\_...  
STRIPE\_WEBHOOK\_SECRET=whsec\_...

*\# App URLs*NEXT\_PUBLIC\_APP\_URL=http://localhost:3000

*\# Stripe Price IDs*  
STRIPE\_PRICE\_MONTHLY=price\_...  
STRIPE\_PRICE\_YEARLY=price\_...  
**Stripe config**  
// src/lib/stripe/config.ts

import Stripe from 'stripe';

if (\!process.env.STRIPE\_SECRET\_KEY) {  
 throw new Error('Missing STRIPE\_SECRET\_KEY');  
}

export const stripe \= new Stripe(process.env.STRIPE\_SECRET\_KEY, {  
 apiVersion: '2024-11-20.acacia',  
 typescript: true,  
});

export const STRIPE\_CONFIG \= {  
 prices: {  
   monthly: process.env.STRIPE\_PRICE\_MONTHLY\!,  
   yearly: process.env.STRIPE\_PRICE\_YEARLY\!,  
 },  
 webhookSecret: process.env.STRIPE\_WEBHOOK\_SECRET\!,  
};  
**Stripe checkout session**  
// src/app/api/stripe/create-checkout/route.ts

import { NextRequest, NextResponse } from 'next/server';  
import { stripe, STRIPE\_CONFIG } from '@/lib/stripe/config';  
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {  
 try {  
   const { priceId, planType } \= await req.json();  
    
   const supabase \= createClient();  
   const { data: { user }, error: userError } \= await supabase.auth.getUser();  
    
   if (userError || \!user) {  
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });  
   }

   // Get or create Stripe customer  
   let customerId: string;  
    
   const { data: existingCustomer } \= await supabase  
     .from('customers')  
     .select('stripe\_customer\_id')  
     .eq('user\_id', user.id)  
     .single();

   if (existingCustomer) {  
     customerId \= existingCustomer.stripe\_customer\_id;  
   } else {  
     // Create new Stripe customer  
     const customer \= await stripe.customers.create({  
       email: user.email\!,  
       metadata: {  
         supabase\_user\_id: user.id,  
       },  
     });

     // Store in Supabase  
     await supabase.from('customers').insert({  
       user\_id: user.id,  
       stripe\_customer\_id: customer.id,  
       email: user.email\!,  
     });

     customerId \= customer.id;  
   }

   // Create checkout session  
   const session \= await stripe.checkout.sessions.create({  
     customer: customerId,  
     mode: 'subscription',  
     payment\_method\_types: \['card'\],  
     line\_items: \[  
       {  
         price: priceId,  
         quantity: 1,  
       },  
     \],  
     success\_url: \`${process.env.NEXT\_PUBLIC\_APP\_URL}/dashboard?success=true\`,  
     cancel\_url: \`${process.env.NEXT\_PUBLIC\_APP\_URL}/dashboard?canceled=true\`,  
     metadata: {  
       user\_id: user.id,  
       plan\_type: planType,  
     },  
   });

   return NextResponse.json({ url: session.url });  
 } catch (error: any) {  
   console.error('Checkout error:', error);  
   return NextResponse.json(  
     { error: error.message },  
     { status: 500 }  
   );  
 }  
}  
**Stripe: Cancel subscription**  
// src/app/api/stripe/cancel-subscription/route.ts

import { NextRequest, NextResponse } from 'next/server';  
import { stripe } from '@/lib/stripe/config';  
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {  
 try {  
   const { subscriptionId, cancelAtPeriodEnd } \= await req.json();  
    
   const supabase \= createClient();  
   const { data: { user }, error: userError } \= await supabase.auth.getUser();  
    
   if (userError || \!user) {  
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });  
   }

   // Verify subscription belongs to user  
   const { data: subscription } \= await supabase  
     .from('subscriptions')  
     .select('stripe\_subscription\_id')  
     .eq('user\_id', user.id)  
     .eq('stripe\_subscription\_id', subscriptionId)  
     .single();

   if (\!subscription) {  
     return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });  
   }

   // Cancel in Stripe  
   const updatedSubscription \= await stripe.subscriptions.update(subscriptionId, {  
     cancel\_at\_period\_end: cancelAtPeriodEnd,  
   });

   // Update in Supabase  
   await supabase  
     .from('subscriptions')  
     .update({  
       cancel\_at\_period\_end: cancelAtPeriodEnd,  
       canceled\_at: cancelAtPeriodEnd ? new Date().toISOString() : null,  
       updated\_at: new Date().toISOString(),  
     })  
     .eq('stripe\_subscription\_id', subscriptionId);

   return NextResponse.json({  
     success: true,  
     subscription: updatedSubscription  
   });  
 } catch (error: any) {  
   console.error('Cancel subscription error:', error);  
   return NextResponse.json(  
     { error: error.message },  
     { status: 500 }  
   );  
 }  
}  
**Get Invoices**  
// src/app/api/stripe/get-invoices/route.ts

import { NextRequest, NextResponse } from 'next/server';  
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {  
 try {  
   const supabase \= createClient();  
   const { data: { user }, error: userError } \= await supabase.auth.getUser();  
    
   if (userError || \!user) {  
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });  
   }

   const { data: invoices, error } \= await supabase  
     .from('invoices')  
     .select('\*')  
     .eq('user\_id', user.id)  
     .order('created\_at', { ascending: false });

   if (error) throw error;

   return NextResponse.json({ invoices });  
 } catch (error: any) {  
   console.error('Get invoices error:', error);  
   return NextResponse.json(  
     { error: error.message },  
     { status: 500 }  
   );  
 }  
}  
**Track Usage**  
**Track Usage** is for **usage-based billing** (also called metered billing). It records how much of a resource or service your users consume, so you can charge them based on their actual usage rather than (or in addition to) a flat subscription fee.

Example 1: API Service  
Base subscription: $29/month (includes 1,000 API calls)Additional usage: $0.01 per API call over 1,000  
User makes 5,000 API calls in a month:- Base: $29- Overage: (5,000 \- 1,000) × $0.01 \= $40- Total: $69  
Example 2: Cloud storage  
Base subscription: $10/month (includes 10 GB)Additional usage: $0.10 per GB over limit  
User stores 45 GB:- Base: $10- Overage: (45 \- 10\) × $0.10 \= $3.50- Total: $13.50  
Example 3: AI Platform  
Track multiple metrics:- GPT-4 tokens: $0.03 per 1K tokens- Image generations: $0.02 per image-  
Fine-tuning hours: $5 per hour  
Code  
// src/app/api/stripe/track-usage/route.ts

import { NextRequest, NextResponse } from 'next/server';  
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {  
 try {  
   const { metricName, quantity } \= await req.json();  
    
   const supabase \= createClient();  
   const { data: { user }, error: userError } \= await supabase.auth.getUser();  
    
   if (userError || \!user) {  
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });  
   }

   // Get active subscription  
   const { data: subscription } \= await supabase  
     .from('subscriptions')  
     .select('stripe\_subscription\_id, current\_period\_start, current\_period\_end')  
     .eq('user\_id', user.id)  
     .eq('status', 'active')  
     .single();

   if (\!subscription) {  
     return NextResponse.json({ error: 'No active subscription' }, { status: 404 });  
   }

   // Record usage  
   const { data, error } \= await supabase  
     .from('usage\_records')  
     .insert({  
       user\_id: user.id,  
       stripe\_subscription\_id: subscription.stripe\_subscription\_id,  
       metric\_name: metricName,  
       quantity,  
       billing\_period\_start: subscription.current\_period\_start,  
       billing\_period\_end: subscription.current\_period\_end,  
     })  
     .select()  
     .single();

   if (error) throw error;

   return NextResponse.json({ success: true, record: data });  
 } catch (error: any) {  
   console.error('Track usage error:', error);  
   return NextResponse.json(  
     { error: error.message },  
     { status: 500 }  
   );  
 }  
}

**Webhook handler**  
// src/app/api/webhooks/stripe/route.ts

import { NextRequest, NextResponse } from 'next/server';  
import { stripe, STRIPE\_CONFIG } from '@/lib/stripe/config';  
import { createServiceClient } from '@/lib/supabase/server';  
import Stripe from 'stripe';

export async function POST(req: NextRequest) {  
 const body \= await req.text();  
 const signature \= req.headers.get('stripe-signature')\!;

 let event: Stripe.Event;

 try {  
   event \= stripe.webhooks.constructEvent(  
     body,  
     signature,  
     STRIPE\_CONFIG.webhookSecret  
   );  
 } catch (err: any) {  
   console.error('Webhook signature verification failed:', err.message);  
   return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });  
 }

 const supabase \= createServiceClient();

 // Log webhook event  
 await supabase.from('webhook\_events').insert({  
   stripe\_event\_id: event.id,  
   type: event.type,  
   data: event.data as any,  
 });

 try {  
   switch (event.type) {  
     case 'checkout.session.completed': {  
       const session \= event.data.object as Stripe.Checkout.Session;  
        
       if (session.mode \=== 'subscription') {  
         const subscription \= await stripe.subscriptions.retrieve(  
           session.subscription as string  
         );

         await supabase.from('subscriptions').insert({  
           user\_id: session.metadata?.user\_id\!,  
           stripe\_subscription\_id: subscription.id,  
           stripe\_customer\_id: subscription.customer as string,  
           status: subscription.status,  
           price\_id: subscription.items.data\[0\].price.id,  
           current\_period\_start: new Date(subscription.current\_period\_start \* 1000).toISOString(),  
           current\_period\_end: new Date(subscription.current\_period\_end \* 1000).toISOString(),  
           plan\_type: session.metadata?.plan\_type || 'monthly',  
           plan\_name: 'pro', // Adjust based on your plans  
         });

         // Create success notification  
         await supabase.from('notifications').insert({  
           user\_id: session.metadata?.user\_id\!,  
           type: 'payment\_success',  
           title: 'Subscription Activated',  
           message: 'Your subscription has been successfully activated.',  
           metadata: { subscription\_id: subscription.id },  
         });  
       }  
       break;  
     }

     case 'customer.subscription.updated': {  
       const subscription \= event.data.object as Stripe.Subscription;

       await supabase  
         .from('subscriptions')  
         .update({  
           status: subscription.status,  
           cancel\_at\_period\_end: subscription.cancel\_at\_period\_end,  
           current\_period\_start: new Date(subscription.current\_period\_start \* 1000).toISOString(),  
           current\_period\_end: new Date(subscription.current\_period\_end \* 1000).toISOString(),  
           canceled\_at: subscription.canceled\_at  
             ? new Date(subscription.canceled\_at \* 1000).toISOString()  
             : null,  
           updated\_at: new Date().toISOString(),  
         })  
         .eq('stripe\_subscription\_id', subscription.id);

       break;  
     }

     case 'customer.subscription.deleted': {  
       const subscription \= event.data.object as Stripe.Subscription;

       const { data: subData } \= await supabase  
         .from('subscriptions')  
         .select('user\_id')  
         .eq('stripe\_subscription\_id', subscription.id)  
         .single();

       await supabase  
         .from('subscriptions')  
         .update({  
           status: 'canceled',  
           ended\_at: new Date().toISOString(),  
           updated\_at: new Date().toISOString(),  
         })  
         .eq('stripe\_subscription\_id', subscription.id);

       // Create cancellation notification  
       if (subData) {  
         await supabase.from('notifications').insert({  
           user\_id: subData.user\_id,  
           type: 'subscription\_canceled',  
           title: 'Subscription Canceled',  
           message: 'Your subscription has been canceled.',  
           metadata: { subscription\_id: subscription.id },  
         });  
       }  
       break;  
     }

     case 'invoice.paid': {  
       const invoice \= event.data.object as Stripe.Invoice;

       const { data: customer } \= await supabase  
         .from('customers')  
         .select('user\_id')  
         .eq('stripe\_customer\_id', invoice.customer as string)  
         .single();

       if (customer) {  
         await supabase.from('invoices').insert({  
           user\_id: customer.user\_id,  
           stripe\_invoice\_id: invoice.id,  
           stripe\_customer\_id: invoice.customer as string,  
           stripe\_subscription\_id: invoice.subscription as string || null,  
           amount\_due: invoice.amount\_due,  
           amount\_paid: invoice.amount\_paid,  
           currency: invoice.currency,  
           status: invoice.status\!,  
           invoice\_pdf: invoice.invoice\_pdf || null,  
           hosted\_invoice\_url: invoice.hosted\_invoice\_url || null,  
           billing\_reason: invoice.billing\_reason || null,  
           created\_at: new Date(invoice.created \* 1000).toISOString(),  
           period\_start: invoice.period\_start  
             ? new Date(invoice.period\_start \* 1000).toISOString()  
             : null,  
           period\_end: invoice.period\_end  
             ? new Date(invoice.period\_end \* 1000).toISOString()  
             : null,  
           paid\_at: new Date().toISOString(),  
         });

         // Create payment success notification  
         await supabase.from('notifications').insert({  
           user\_id: customer.user\_id,  
           type: 'payment\_success',  
           title: 'Payment Successful',  
           message: \`Your payment of $${(invoice.amount\_paid / 100).toFixed(2)} has been processed.\`,  
           metadata: { invoice\_id: invoice.id },  
         });  
       }  
       break;  
     }

     case 'invoice.payment\_failed': {  
       const invoice \= event.data.object as Stripe.Invoice;

       const { data: customer } \= await supabase  
         .from('customers')  
         .select('user\_id')  
         .eq('stripe\_customer\_id', invoice.customer as string)  
         .single();

       if (customer) {  
         // Update subscription status  
         if (invoice.subscription) {  
           await supabase  
             .from('subscriptions')  
             .update({  
               status: 'past\_due',  
               updated\_at: new Date().toISOString(),  
             })  
             .eq('stripe\_subscription\_id', invoice.subscription as string);  
         }

         // Create payment failure notification  
         await supabase.from('notifications').insert({  
           user\_id: customer.user\_id,  
           type: 'payment\_failed',  
           title: 'Payment Failed',  
           message: 'Your recent payment failed. Please update your payment method.',  
           metadata: { invoice\_id: invoice.id },  
         });  
       }  
       break;  
     }

     case 'payment\_method.attached': {  
       const paymentMethod \= event.data.object as Stripe.PaymentMethod;

       const { data: customer } \= await supabase  
         .from('customers')  
         .select('user\_id')  
         .eq('stripe\_customer\_id', paymentMethod.customer as string)  
         .single();

       if (customer && paymentMethod.card) {  
         await supabase.from('payment\_methods').insert({  
           user\_id: customer.user\_id,  
           stripe\_payment\_method\_id: paymentMethod.id,  
           stripe\_customer\_id: paymentMethod.customer as string,  
           type: paymentMethod.type,  
           card\_brand: paymentMethod.card.brand,  
           card\_last4: paymentMethod.card.last4,  
           card\_exp\_month: paymentMethod.card.exp\_month,  
           card\_exp\_year: paymentMethod.card.exp\_year,  
         });  
       }  
       break;  
     }  
   }

   // Mark event as processed  
   await supabase  
     .from('webhook\_events')  
     .update({  
       processed: true,  
       processed\_at: new Date().toISOString()  
     })  
     .eq('stripe\_event\_id', event.id);

   return NextResponse.json({ received: true });  
 } catch (error: any) {  
   console.error('Webhook handler error:', error);  
    
   // Log error  
   await supabase  
     .from('webhook\_events')  
     .update({  
       processing\_error: error.message  
     })  
     .eq('stripe\_event\_id', event.id);

   return NextResponse.json(  
     { error: error.message },  
     { status: 500 }  
   );  
 }  
}  
**Billing dashboard example**

// src/app/dashboard/billing/page.tsx

'use client';

import { useEffect, useState } from 'react';  
import { createClient } from '@/lib/supabase/client';  
import SubscriptionCard from './components/SubscriptionCard';  
import InvoiceHistory from './components/InvoiceHistory';  
import UsageDisplay from './components/UsageDisplay';

export default function BillingPage() {  
 const \[subscription, setSubscription\] \= useState\<any\>(null);  
 const \[loading, setLoading\] \= useState(true);  
 const supabase \= createClient();

 useEffect(() \=\> {  
   async function loadSubscription() {  
     const { data: { user } } \= await supabase.auth.getUser();  
      
     if (user) {  
       const { data } \= await supabase  
         .from('subscriptions')  
         .select('\*')  
         .eq('user\_id', user.id)  
         .eq('status', 'active')  
         .single();  
        
       setSubscription(data);  
     }  
      
     setLoading(false);  
   }

   loadSubscription();  
 }, \[\]);

 const handleSubscribe \= async (planType: 'monthly' | 'yearly') \=\> {  
   const priceId \= planType \=== 'monthly'  
     ? process.env.NEXT\_PUBLIC\_STRIPE\_PRICE\_MONTHLY  
     : process.env.NEXT\_PUBLIC\_STRIPE\_PRICE\_YEARLY;

   const response \= await fetch('/api/stripe/create-checkout', {  
     method: 'POST',  
     headers: { 'Content-Type': 'application/json' },  
     body: JSON.stringify({ priceId, planType }),  
   });

   const { url } \= await response.json();  
   if (url) window.location.href \= url;  
 };

 const handleCancel \= async (cancelAtPeriodEnd: boolean) \=\> {  
   if (\!subscription) return;

   const response \= await fetch('/api/stripe/cancel-subscription', {  
     method: 'POST',  
     headers: { 'Content-Type': 'application/json' },  
     body: JSON.stringify({  
       subscriptionId: subscription.stripe\_subscription\_id,  
       cancelAtPeriodEnd  
     }),  
   });

   if (response.ok) {  
     // Reload subscription data  
     window.location.reload();  
   }  
 };

 if (loading) return \<div\>Loading...\</div\>;

 return (  
   \<div className="container mx-auto p-6 space-y-6"\>  
     \<h1 className="text-3xl font-bold"\>Billing & Subscription\</h1\>  
      
     {subscription ? (  
       \<\>  
         \<SubscriptionCard  
           subscription={subscription}  
           onCancel={handleCancel}  
         /\>  
         \<UsageDisplay subscriptionId={subscription.stripe\_subscription\_id} /\>  
         \<InvoiceHistory /\>  
       \</\>  
     ) : (  
       \<div className="space-y-4"\>  
         \<h2 className="text-xl"\>Choose a Plan\</h2\>  
         \<div className="grid md:grid-cols-2 gap-4"\>  
           \<button  
             onClick={() \=\> handleSubscribe('monthly')}  
             className="p-6 border rounded-lg hover:border-blue-500"  
           \>  
             \<h3 className="text-lg font-bold"\>Monthly Plan\</h3\>  
             \<p className="text-2xl"\>$29/month\</p\>  
           \</button\>  
           \<button  
             onClick={() \=\> handleSubscribe('yearly')}  
             className="p-6 border rounded-lg hover:border-blue-500"  
           \>  
             \<h3 className="text-lg font-bold"\>Yearly Plan\</h3\>  
             \<p className="text-2xl"\>$290/year\</p\>  
             \<p className="text-sm text-green-600"\>Save 17%\</p\>  
           \</button\>  
         \</div\>  
       \</div\>  
     )}  
   \</div\>  
 );  
}  
**Subscription card**  
// src/app/dashboard/billing/components/SubscriptionCard.tsx

'use client';

export default function SubscriptionCard({  
 subscription,  
 onCancel  
}: {  
 subscription: any;  
 onCancel: (cancelAtPeriodEnd: boolean) \=\> void;  
}) {  
 const periodEnd \= new Date(subscription.current\_period\_end);

 return (  
   \<div className="border rounded-lg p-6"\>  
     \<h2 className="text-xl font-bold mb-4"\>Current Subscription\</h2\>  
      
     \<div className="space-y-2"\>  
       \<div className="flex justify-between"\>  
         \<span\>Plan:\</span\>  
         \<span className="font-semibold capitalize"\>  
           {subscription.plan\_name} ({subscription.plan\_type})  
         \</span\>  
       \</div\>  
        
       \<div className="flex justify-between"\>  
         \<span\>Status:\</span\>  
         \<span className={\`font-semibold ${  
           subscription.status \=== 'active' ? 'text-green-600' : 'text-yellow-600'  
         }\`}\>  
           {subscription.status}  
         \</span\>  
       \</div\>  
        
       \<div className="flex justify-between"\>  
         \<span\>Next billing date:\</span\>  
         \<span\>{periodEnd.toLocaleDateString()}\</span\>  
       \</div\>  
        
       {subscription.cancel\_at\_period\_end && (  
         \<div className="text-yellow-600 mt-2"\>  
           Subscription will cancel on {periodEnd.toLocaleDateString()}  
         \</div\>  
       )}  
     \</div\>  
      
     \<div className="mt-6 space-x-2"\>  
       {\!subscription.cancel\_at\_period\_end ? (  
         \<button  
           onClick={() \=\> onCancel(true)}  
           className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"  
         \>  
           Cancel Subscription  
         \</button\>  
       ) : (  
         \<button  
           onClick={() \=\> onCancel(false)}  
           className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"  
         \>  
           Resume Subscription  
         \</button\>  
       )}  
     \</div\>  
   \</div\>  
 );  
}  
**Invoice History**  
// src/app/dashboard/billing/components/InvoiceHistory.tsx

'use client';

import { useEffect, useState } from 'react';

export default function InvoiceHistory() {  
 const \[invoices, setInvoices\] \= useState\<any\[\]\>(\[\]);  
 const \[loading, setLoading\] \= useState(true);

 useEffect(() \=\> {  
   async function loadInvoices() {  
     const response \= await fetch('/api/stripe/get-invoices');  
     const { invoices } \= await response.json();  
     setInvoices(invoices || \[\]);  
     setLoading(false);  
   }

   loadInvoices();  
 }, \[\]);

 if (loading) return \<div\>Loading invoices...\</div\>;

 return (  
   \<div className="border rounded-lg p-6"\>  
     \<h2 className="text-xl font-bold mb-4"\>Invoice History\</h2\>  
      
     {invoices.length \=== 0 ? (  
       \<p className="text-gray-500"\>No invoices yet\</p\>  
     ) : (  
       \<div className="space-y-2"\>  
         {invoices.map((invoice) \=\> (  
           \<div  
             key={invoice.id}  
             className="flex justify-between items-center p-3 border-b"  
           \>  
             \<div\>  
               \<p className="font-semibold"\>  
                 ${(invoice.amount\_paid / 100).toFixed(2)}  
               \</p\>  
               \<p className="text-sm text-gray-500"\>  
                 {new Date(invoice.created\_at).toLocaleDateString()}  
               \</p\>  
             \</div\>  
              
             \<div className="flex gap-2"\>  
               \<span className={\`px-2 py-1 rounded text-sm ${  
                 invoice.status \=== 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'  
               }\`}\>  
                 {invoice.status}  
               \</span\>  
                
               {invoice.invoice\_pdf && (  
                  
                   href={invoice.invoice\_pdf}  
                   target="\_blank"  
                   rel="noopener noreferrer"  
                   className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"  
                 \>  
                   PDF  
                 \</a\>  
               )}  
             \</div\>  
           \</div\>  
         ))}  
       \</div\>  
     )}  
   \</div\>  
 );  
}  
**Supabase migration example**  
\-- supabase/migrations/20240204\_payment\_schema.sql

\-- Enable UUID extension  
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\-- Customers Table (Links Supabase users to Stripe)  
CREATE TABLE customers (  
 id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
 user\_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  
 stripe\_customer\_id TEXT UNIQUE NOT NULL,  
 email TEXT NOT NULL,  
 created\_at TIMESTAMPTZ DEFAULT NOW(),  
 updated\_at TIMESTAMPTZ DEFAULT NOW(),  
 UNIQUE(user\_id)  
);

\-- Subscriptions Table  
CREATE TABLE subscriptions (  
 id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
 user\_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  
 stripe\_subscription\_id TEXT UNIQUE NOT NULL,  
 stripe\_customer\_id TEXT NOT NULL REFERENCES customers(stripe\_customer\_id),  
 status TEXT NOT NULL, \-- active, past\_due, canceled, incomplete, trialing  
 price\_id TEXT NOT NULL,  
 quantity INTEGER DEFAULT 1,  
 cancel\_at\_period\_end BOOLEAN DEFAULT FALSE,  
 current\_period\_start TIMESTAMPTZ NOT NULL,  
 current\_period\_end TIMESTAMPTZ NOT NULL,  
 canceled\_at TIMESTAMPTZ,  
 ended\_at TIMESTAMPTZ,  
 trial\_start TIMESTAMPTZ,  
 trial\_end TIMESTAMPTZ,  
 plan\_type TEXT NOT NULL, \-- monthly, yearly  
 plan\_name TEXT NOT NULL, \-- pro, enterprise, etc.  
 created\_at TIMESTAMPTZ DEFAULT NOW(),  
 updated\_at TIMESTAMPTZ DEFAULT NOW()  
);

\-- Invoices Table  
CREATE TABLE invoices (  
 id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
 user\_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  
 stripe\_invoice\_id TEXT UNIQUE NOT NULL,  
 stripe\_customer\_id TEXT NOT NULL REFERENCES customers(stripe\_customer\_id),  
 stripe\_subscription\_id TEXT REFERENCES subscriptions(stripe\_subscription\_id),  
 amount\_due INTEGER NOT NULL, \-- in cents  
 amount\_paid INTEGER NOT NULL,  
 currency TEXT DEFAULT 'usd',  
 status TEXT NOT NULL, \-- draft, open, paid, uncollectible, void  
 invoice\_pdf TEXT,  
 hosted\_invoice\_url TEXT,  
 billing\_reason TEXT, \-- subscription\_create, subscription\_cycle, etc.  
 created\_at TIMESTAMPTZ NOT NULL,  
 period\_start TIMESTAMPTZ,  
 period\_end TIMESTAMPTZ,  
 paid\_at TIMESTAMPTZ  
);

\-- Payment Methods Table  
CREATE TABLE payment\_methods (  
 id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
 user\_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  
 stripe\_payment\_method\_id TEXT UNIQUE NOT NULL,  
 stripe\_customer\_id TEXT NOT NULL REFERENCES customers(stripe\_customer\_id),  
 type TEXT NOT NULL, \-- card, bank\_account, etc.  
 card\_brand TEXT, \-- visa, mastercard, etc.  
 card\_last4 TEXT,  
 card\_exp\_month INTEGER,  
 card\_exp\_year INTEGER,  
 is\_default BOOLEAN DEFAULT FALSE,  
 created\_at TIMESTAMPTZ DEFAULT NOW(),  
 updated\_at TIMESTAMPTZ DEFAULT NOW()  
);

\-- Usage Records Table (for usage-based billing)  
CREATE TABLE usage\_records (  
 id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
 user\_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  
 stripe\_subscription\_id TEXT REFERENCES subscriptions(stripe\_subscription\_id),  
 metric\_name TEXT NOT NULL, \-- api\_calls, storage\_gb, etc.  
 quantity NUMERIC NOT NULL,  
 timestamp TIMESTAMPTZ DEFAULT NOW(),  
 billing\_period\_start TIMESTAMPTZ NOT NULL,  
 billing\_period\_end TIMESTAMPTZ NOT NULL,  
 synced\_to\_stripe BOOLEAN DEFAULT FALSE,  
 stripe\_usage\_record\_id TEXT,  
 created\_at TIMESTAMPTZ DEFAULT NOW()  
);

\-- Webhook Events Table (audit trail)  
CREATE TABLE webhook\_events (  
 id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
 stripe\_event\_id TEXT UNIQUE NOT NULL,  
 type TEXT NOT NULL,  
 data JSONB NOT NULL,  
 processed BOOLEAN DEFAULT FALSE,  
 processing\_error TEXT,  
 created\_at TIMESTAMPTZ DEFAULT NOW(),  
 processed\_at TIMESTAMPTZ  
);

\-- Notifications Table  
CREATE TABLE notifications (  
 id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),  
 user\_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  
 type TEXT NOT NULL, \-- payment\_success, payment\_failed, subscription\_canceled, etc.  
 title TEXT NOT NULL,  
 message TEXT NOT NULL,  
 read BOOLEAN DEFAULT FALSE,  
 metadata JSONB,  
 created\_at TIMESTAMPTZ DEFAULT NOW()  
);

\-- Indexes for performance  
CREATE INDEX idx\_customers\_user\_id ON customers(user\_id);  
CREATE INDEX idx\_customers\_stripe\_id ON customers(stripe\_customer\_id);  
CREATE INDEX idx\_subscriptions\_user\_id ON subscriptions(user\_id);  
CREATE INDEX idx\_subscriptions\_stripe\_id ON subscriptions(stripe\_subscription\_id);  
CREATE INDEX idx\_subscriptions\_status ON subscriptions(status);  
CREATE INDEX idx\_invoices\_user\_id ON invoices(user\_id);  
CREATE INDEX idx\_invoices\_stripe\_id ON invoices(stripe\_invoice\_id);  
CREATE INDEX idx\_usage\_records\_user\_id ON usage\_records(user\_id);  
CREATE INDEX idx\_usage\_records\_period ON usage\_records(billing\_period\_start, billing\_period\_end);  
CREATE INDEX idx\_webhook\_events\_processed ON webhook\_events(processed);  
CREATE INDEX idx\_notifications\_user\_id ON notifications(user\_id);  
CREATE INDEX idx\_notifications\_read ON notifications(read);

\-- Row Level Security (RLS) Policies  
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;  
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;  
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;  
ALTER TABLE payment\_methods ENABLE ROW LEVEL SECURITY;  
ALTER TABLE usage\_records ENABLE ROW LEVEL SECURITY;  
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

\-- Customers policies  
CREATE POLICY "Users can view their own customer data"  
 ON customers FOR SELECT  
 USING (auth.uid() \= user\_id);

\-- Subscriptions policies  
CREATE POLICY "Users can view their own subscriptions"  
 ON subscriptions FOR SELECT  
 USING (auth.uid() \= user\_id);

\-- Invoices policies  
CREATE POLICY "Users can view their own invoices"  
 ON invoices FOR SELECT  
 USING (auth.uid() \= user\_id);

\-- Payment methods policies  
CREATE POLICY "Users can view their own payment methods"  
 ON payment\_methods FOR SELECT  
 USING (auth.uid() \= user\_id);

\-- Usage records policies  
CREATE POLICY "Users can view their own usage records"  
 ON usage\_records FOR SELECT  
 USING (auth.uid() \= user\_id);

\-- Notifications policies  
CREATE POLICY "Users can view their own notifications"  
 ON notifications FOR SELECT  
 USING (auth.uid() \= user\_id);

CREATE POLICY "Users can update their own notifications"  
 ON notifications FOR UPDATE  
 USING (auth.uid() \= user\_id);

\-- Functions for updated\_at timestamps  
CREATE OR REPLACE FUNCTION update\_updated\_at\_column()  
RETURNS TRIGGER AS $$  
BEGIN  
 NEW.updated\_at \= NOW();  
 RETURN NEW;  
END;  
$$ language 'plpgsql';

CREATE TRIGGER update\_customers\_updated\_at BEFORE UPDATE ON customers  
 FOR EACH ROW EXECUTE FUNCTION update\_updated\_at\_column();

CREATE TRIGGER update\_subscriptions\_updated\_at BEFORE UPDATE ON subscriptions  
 FOR EACH ROW EXECUTE FUNCTION update\_updated\_at\_column();

CREATE TRIGGER update\_payment\_methods\_updated\_at BEFORE UPDATE ON payment\_methods  
 FOR EACH ROW EXECUTE FUNCTION update\_updated\_at\_column();  
'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
);

export default function StripeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Elements stripe={stripePromise}>{children}</Elements>;
}

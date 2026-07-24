import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { config } from 'dotenv';
import path from 'path';

@Injectable()
export class StripeService implements OnModuleInit {
    private stripe: Stripe;

    constructor() {
        config({ path: path.resolve(process.cwd(), '.env') });
        console.log('🔑 Stripe secret key loaded:', process.env.STRIPE_SECRET_KEY ? 'Yes' : 'No');
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            throw new Error('STRIPE_SECRET_KEY is required in environment variables');
        }
        this.stripe = new Stripe(secretKey);
    }

    onModuleInit() {
        console.log('✅ StripeService initialized');
    }

  async createPaymentIntent(amount: number, currency: string = 'inr'){
    try {
      // amount is in rupees (DB stores rupees) — Stripe needs paisa (smallest unit), so multiply by 100
      const amountInPaisa = Math.round(amount * 100);
      console.log('💰 Creating Stripe payment intent — rupees:', amount, '→ paisa:', amountInPaisa, 'currency:', currency);
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInPaisa,
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      console.log('✅ Stripe payment intent created:', paymentIntent.id);
      return {
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      console.error('❌ Stripe error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create payment intent';
      throw new BadRequestException({
        code: 'STRIPE_PAYMENT_FAILED',
        message: errorMessage
      });
    }
  }
}
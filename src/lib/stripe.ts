import { loadStripe, Stripe } from "@stripe/stripe-js";

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status:
    | "requires_payment_method"
    | "requires_confirmation"
    | "requires_action"
    | "processing"
    | "requires_capture"
    | "canceled"
    | "succeeded";
  client_secret: string;
  metadata?: Record<string, string>;
}

export interface StripePaymentMethod {
  id: string;
  type: "card" | "paypal" | "bank_transfer";
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  productId: string;
  userId: string;
  deliveryMethod: "pickup" | "delivery";
  deliveryAddress?: string;
  metadata?: Record<string, string>;
}

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = getStripePublishableKey();
    if (!publishableKey || publishableKey === "pk_test_placeholder") {
      console.warn("⚠️ Stripe publishable key not found. Using test mode.");
      stripePromise = Promise.resolve(null);
    } else {
      stripePromise = loadStripe(publishableKey);
    }
  }
  return stripePromise;
};

let stripeServerInstance: any = null;

export const getStripeServer = async () => {
  if (!stripeServerInstance) {
    const Stripe = (await import("stripe")).default;
    const secretKey = getStripeSecretKey();

    if (!secretKey || secretKey === "sk_test_placeholder") {
      console.warn(
        "⚠️ Stripe secret key not found. Payment processing will fail.",
      );
      return null;
    }

    stripeServerInstance = new Stripe(secretKey, {
      apiVersion: "2025-06-30.basil",
      typescript: true,
    });
  }
  return stripeServerInstance;
};

export async function createPaymentIntent(
  params: CreatePaymentIntentParams,
): Promise<StripePaymentIntent> {
  try {
    const stripe = await getStripeServer();

    if (!stripe) {
      console.log("🔮 Test mode - createPaymentIntent called with:", params);
      return {
        id: `pi_test_${Date.now()}`,
        amount: params.amount,
        currency: params.currency,
        status: "requires_payment_method",
        client_secret: `pi_test_${Date.now()}_secret_test`,
        metadata: {
          product_id: params.productId,
          user_id: params.userId,
          delivery_method: params.deliveryMethod,
          ...params.metadata,
        },
      };
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      metadata: {
        product_id: params.productId,
        user_id: params.userId,
        delivery_method: params.deliveryMethod,
        delivery_address: params.deliveryAddress || "",
        ...params.metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status as any,
      client_secret: paymentIntent.client_secret!,
      metadata: paymentIntent.metadata,
    };
  } catch (error) {
    console.error("❌ Stripe createPaymentIntent error:", error);
    throw handleStripeError(error);
  }
}

export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId?: string,
): Promise<StripePaymentIntent> {
  try {
    const stripe = await getStripeServer();

    if (!stripe) {
      console.log("🔮 Test mode - confirmPaymentIntent called:", {
        paymentIntentId,
        paymentMethodId,
      });
      return {
        id: paymentIntentId,
        amount: 0,
        currency: "eur",
        status: "succeeded",
        client_secret: `${paymentIntentId}_secret_confirmed`,
      };
    }

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
    });

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status as any,
      client_secret: paymentIntent.client_secret!,
      metadata: paymentIntent.metadata,
    };
  } catch (error) {
    console.error("❌ Stripe confirmPaymentIntent error:", error);
    throw handleStripeError(error);
  }
}

export async function retrievePaymentIntent(
  paymentIntentId: string,
): Promise<StripePaymentIntent> {
  try {
    const stripe = await getStripeServer();

    if (!stripe) {
      console.log(
        "🔮 Test mode - retrievePaymentIntent called:",
        paymentIntentId,
      );
      return {
        id: paymentIntentId,
        amount: 0,
        currency: "eur",
        status: "succeeded",
        client_secret: `${paymentIntentId}_secret`,
      };
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status as any,
      client_secret: paymentIntent.client_secret!,
      metadata: paymentIntent.metadata,
    };
  } catch (error) {
    console.error("❌ Stripe retrievePaymentIntent error:", error);
    throw handleStripeError(error);
  }
}

export function formatStripeAmount(amount: number): number {
  return Math.round(amount * 100);
}

export function formatAmountFromStripe(amount: number): number {
  return amount / 100;
}

export function getStripePublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.warn(
      "⚠️ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found in environment variables",
    );
    return "pk_test_placeholder";
  }
  return key;
}

export function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn("⚠️ STRIPE_SECRET_KEY not found in environment variables");
    return "sk_test_placeholder";
  }
  return key;
}

export function validatePaymentMethod(paymentMethod: string): boolean {
  const allowedMethods = ["card", "paypal"];
  return allowedMethods.includes(paymentMethod);
}

export class StripeError extends Error {
  constructor(
    public code: string,
    message: string,
    public type:
      | "card_error"
      | "invalid_request_error"
      | "api_error"
      | "authentication_error"
      | "rate_limit_error",
  ) {
    super(message);
    this.name = "StripeError";
  }
}

export function handleStripeError(error: any): StripeError {
  console.error("Stripe error:", error);

  if (error.type) {
    return new StripeError(
      error.code || "unknown_error",
      error.message || "Une erreur de paiement est survenue",
      error.type,
    );
  }

  return new StripeError(
    "unknown_error",
    error.message || "Une erreur de paiement est survenue",
    "api_error",
  );
}

export async function verifyWebhookSignature(
  payload: string,
  signature: string,
): Promise<any> {
  try {
    const stripe = await getStripeServer();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe || !webhookSecret) {
      throw new Error("Stripe or webhook secret not configured");
    }

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
    return event;
  } catch (error) {
    console.error("❌ Webhook signature verification failed:", error);
    throw error;
  }
}

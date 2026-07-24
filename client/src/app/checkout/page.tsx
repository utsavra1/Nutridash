"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCartStore } from "../../stores/cart-store";
import { useAuthStore } from "../../stores/auth-store";
import { ordersApi } from "../../lib/api";
import styles from "./page.module.css";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder"
);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#1f2937",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: "#ef4444", iconColor: "#ef4444" },
  },
};

// ── Inner form — rendered inside a clientSecret-scoped <Elements> ──────────
function PaymentForm({
  clientSecret,
  deliveryAddress,
  setDeliveryAddress,
  checkoutError,
  setCheckoutError,
}: {
  clientSecret: string | null;
  deliveryAddress: string;
  setDeliveryAddress: (v: string) => void;
  checkoutError: string;
  setCheckoutError: (v: string) => void;
}) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const { items, clearCart, getTotalPrice } = useCartStore();
  const { accessToken } = useAuthStore();
  const totalPrice = getTotalPrice();

  const orderMutation = useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: (data) => {
      // Redirect FIRST — then clear cart so the items.length===0 effect
      // doesn't race and push to /cart before the confirmation page loads.
      router.push(`/orders/confirmation?id=${data.id}`);
      setTimeout(() => clearCart(), 300);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message;
      setCheckoutError(
        Array.isArray(message) ? message.join(", ") : message || "Failed to place order. Please try again."
      );
      setIsProcessing(false);
    },
  });

  const handleCardChange = (event: any) => {
    setCardError(event.error ? event.error.message : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setIsProcessing(true);
    setCheckoutError("");

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (error) {
      setCheckoutError(error.message || "Payment failed. Please check your card details and try again.");
      setIsProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      orderMutation.mutate({
        items: items.map((item) => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
        })),
        deliveryAddress,
        paymentIntentId: paymentIntent.id,
      });
    } else {
      setIsProcessing(false);
    }
  };

  const isLoading = orderMutation.isPending || isProcessing;
  const isDisabled =
    isLoading || !deliveryAddress || !clientSecret || !stripe || !elements || !accessToken || !!cardError;

  return (
    <div className={styles.checkoutLayout}>
      <form id="checkout-form" className={styles.form} onSubmit={handleSubmit}>
        {/* Delivery address */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h2 className={styles.cardTitle}>Delivery Address</h2>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="address">Delivery Location</label>
            <div className={styles.textareaWrapper}>
              <textarea
                id="address"
                className={styles.textarea}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter your complete delivery address (Street name, building/apartment number, floor...)"
                required
              />
            </div>
          </div>
        </div>

        {/* Card details */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
              </svg>
            </div>
            <h2 className={styles.cardTitle}>Payment Details</h2>
            <div className={styles.secureBadge}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Secure
            </div>
          </div>

          <div className={styles.formGroup}>
            {!clientSecret ? (
              <div className={styles.addressNotice}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.noticeIcon}>
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                Please enter your delivery address to initialize payment details.
              </div>
            ) : (
              <>
                <label className={styles.label} htmlFor="card-element">Credit or Debit Card</label>
                <div className={styles.cardElementWrapper}>
                  <div className={styles.cardElementContainer}>
                    <CardElement id="card-element" options={CARD_ELEMENT_OPTIONS} onChange={handleCardChange} />
                  </div>
                </div>
                {cardError && (
                  <div className={styles.cardValidationError}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px", flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {cardError}
                  </div>
                )}
                <div className={styles.cardBrandBadges}>
                  <span className={styles.brandBadge}>Visa</span>
                  <span className={styles.brandBadge}>Mastercard</span>
                  <span className={styles.brandBadge}>Amex</span>
                  <span className={styles.brandBadge}>Stripe Secure</span>
                </div>
              </>
            )}
          </div>
        </div>
      </form>

      {/* Order summary sidebar */}
      <div className={styles.sidebar}>
        <div className={`${styles.card} ${styles.summaryCard}`}>
          <h2 className={styles.summaryTitle}>Order Summary</h2>

          <div className={styles.itemsList}>
            {items.map((item) => (
              <div key={item.menuItem.id} className={styles.summaryItem}>
                <div className={styles.itemDetails}>
                  <span className={styles.itemName}>{item.menuItem.name}</span>
                  <span className={styles.itemQuantity}>Qty: {item.quantity}</span>
                </div>
                <span className={styles.itemPrice}>
                  Rs. {(item.menuItem.priceRs * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>Rs. {totalPrice.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Delivery Fee</span>
            <span className={styles.freeBadge}>FREE</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>Total Amount</span>
            <span className={styles.totalPrice}>Rs. {totalPrice.toFixed(2)}</span>
          </div>

          <button
            type="submit"
            form="checkout-form"
            className={styles.submitButton}
            disabled={isDisabled}
          >
            {isLoading ? (
              <span className={styles.loaderContainer}>
                <span className={styles.spinner}></span>
                {orderMutation.isPending ? "Placing Order..." : "Processing Payment..."}
              </span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Pay Rs. {totalPrice.toFixed(2)}
              </>
            )}
          </button>

          <div className={styles.securityText}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "4px" }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Payments are secure and encrypted.
          </div>
        </div>

        {checkoutError && (
          <div className={styles.errorAlert}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={styles.errorIcon}>
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div className={styles.errorText}>
              <strong>Payment Error</strong>
              <p>{checkoutError}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page shell — owns the payment intent + passes clientSecret into Elements ─
export default function CheckoutPage() {
  const router = useRouter();
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState("");

  const { items } = useCartStore();
  const { accessToken, hasHydrated } = useAuthStore();

  const hasMixedRestaurants =
    new Set(items.map((item) => item.menuItem.restaurantId)).size > 1;
  const hasInvalidItems = items.some(
    (item) => !item.menuItem.id || !item.menuItem.restaurantId || item.quantity < 1
  );

  useEffect(() => {
    if (items.length === 0) router.push("/cart");
  }, [items.length, router]);

  // Create payment intent whenever address + cart are ready
  const paymentIntentMutation = useMutation({
    mutationFn: ordersApi.createPaymentIntent,
    onSuccess: (data) => {
      setCheckoutError("");
      setClientSecret(data.clientSecret);
    },
    onError: (error: any) => {
      setClientSecret(null);
      const message = error.response?.data?.message;
      setCheckoutError(
        Array.isArray(message) ? message.join(", ") : message || "Failed to prepare payment. Please try again."
      );
    },
  });

  useEffect(() => {
    if (!hasHydrated) return;

    if (!accessToken) {
      setClientSecret(null);
      setCheckoutError("Your session is not ready yet. Please sign in again and retry.");
      return;
    }
    if (hasInvalidItems) {
      setClientSecret(null);
      setCheckoutError("Your cart contains an invalid item. Please remove it and try again.");
      return;
    }
    if (hasMixedRestaurants) {
      setClientSecret(null);
      setCheckoutError("Your cart contains items from multiple restaurants. Please clear the cart and add items from one restaurant only.");
      return;
    }

    if (items.length > 0 && deliveryAddress.trim()) {
      setCheckoutError("");
      paymentIntentMutation.mutate({
        items: items.map((item) => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
        })),
        deliveryAddress,
      });
    } else {
      setClientSecret(null);
      setCheckoutError("");
    }
  }, [items, deliveryAddress, hasHydrated, accessToken, hasInvalidItems, hasMixedRestaurants]);

  if (items.length === 0) return null;

  // Scope Elements to the clientSecret so Stripe knows the currency is INR
  const elementsOptions = clientSecret
    ? { clientSecret, currency: "inr" as const, locale: "en" as const }
    : undefined;

  return (
    <div className={styles.container}>
      <Link href="/cart" className={styles.backLink}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}>
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Cart
      </Link>

      <div className={styles.headerSection}>
        <h1 className={styles.title}>Secure Checkout</h1>
        <div className={styles.steps}>
          <span className={styles.stepDone}>Cart</span>
          <span className={styles.stepDivider}>/</span>
          <span className={styles.stepActive}>Checkout</span>
          <span className={styles.stepDivider}>/</span>
          <span className={styles.stepTodo}>Confirmation</span>
        </div>
      </div>

      {/* Wrap only the interactive checkout section in a clientSecret-scoped Elements */}
      <Elements stripe={stripePromise} options={elementsOptions}>
        <PaymentForm
          clientSecret={clientSecret}
          deliveryAddress={deliveryAddress}
          setDeliveryAddress={setDeliveryAddress}
          checkoutError={checkoutError}
          setCheckoutError={setCheckoutError}
        />
      </Elements>
    </div>
  );
}


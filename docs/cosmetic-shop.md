# PayPal cosmetic shop

The popup has Outfits, Wings and Auras, previews and account ownership. Every
paid item costs **$5.00 USD**. An outfit theme includes both variants. Purchases
work across all four account characters and do not change combat stats.
Adventurer (both variants) is free. Choosing a class at level 5 earns that class's
outfit for that character, including both variants. These five basic themes are
not sold. All other outfits, wings and auras require a verified purchase.

This follows the latest requested rule: previously equipped premium cosmetics
are NOT grandfathered. On entry, an unowned premium appearance returns to the
free automatic outfit/no wings/no aura. Equipment, stats and progress are not
reset. Existing purchases survive server restarts in account entitlements.

## Setup before taking payments

No live payment or production migration has been performed by this change.

1. Apply `supabase/migrations/202610310002_cosmetic_shop.sql` in Supabase SQL
   Editor after the character-slot migration. It creates private account
   entitlements, an idempotent order ledger, and payment/refund records. It is
   safe to rerun and grants no legacy premium cosmetics.
2. In PayPal Developer Dashboard, create a REST app for your PayPal Business
   account. Start with **Sandbox** credentials and test buyer/seller accounts.
3. On Render set these **server-only** environment variables:
   - `PAYPAL_CLIENT_ID`: REST app client ID.
   - `PAYPAL_CLIENT_SECRET`: REST app secret. Never put it in Vercel/public code.
   - `PAYPAL_ENVIRONMENT=sandbox` for testing; `live` for real payments.
   - `PAYPAL_WEBHOOK_ID`: webhook ID for that app and environment.
   - `SHOP_CLIENT_URL=https://realm-of-shadows-client-ah6e.vercel.app` (the exact
     client origin, no trailing slash; adjust to the actual production domain).
   - `COSMETIC_SHOP_ENABLED=true` to enable the payment/entitlement service.
4. Register `https://realmofshadows.onrender.com/shop/webhook` as that app's
   webhook URL. Subscribe to `PAYMENT.CAPTURE.COMPLETED`,
   `PAYMENT.CAPTURE.REFUNDED`, `CUSTOMER.DISPUTE.CREATED`, and
   `CUSTOMER.DISPUTE.RESOLVED`.
5. Deploy Render, then Vercel. No PayPal secret is needed on Vercel.
6. Use sandbox buyer checkout to verify approval, return/capture, unlock,
   re-login, another character, cancellation, duplicate notification and refund.
   Only then replace both credentials and webhook ID with the **Live** app's
   values and set `PAYPAL_ENVIRONMENT=live`.

Prices are fixed on the server, with no client-supplied price or account ID.
Checkout is one-time USD 5.00, digital goods, no shipping. This implementation
adds no automatic tax calculation; configure the business's tax treatment before
launch rather than changing the captured total without updating validation.
Customers see a price and availability message; configuration details stay here.

## Payment and access behavior

Authenticated POST `/shop/checkout` creates a server-priced PayPal CAPTURE order
bound to the verified account and cosmetic. Approval goes to PayPal's hosted
checkout. Existing ownership is checked first and an in-flight approval URL is
reused to reduce duplicate checkouts. A server restart or separate tabs can
still produce more than one approval; do not approve the same item twice.

Returning to `?shop=paypal&token=ORDER_ID` does not grant anything. After login
and character selection, POST `/shop/capture` retrieves the order, checks the
account/SKU/quantity/USD 5.00 total, captures an APPROVED order, and retrieves the
canonical COMPLETED order/capture before recording the entitlement. The return
query remains available for retry if capture fails. A canceled or unpaid order
never unlocks a cosmetic. The order ID is not an authentication credential.

PayPal notifications are verified through PayPal's server-side webhook signature
verification API using the configured webhook ID. Completed captures retrieve
the canonical order and use the same fulfillment path. Duplicate events/capture
requests are idempotent. A database outage causes a non-2xx response so PayPal
can retry. No card details are stored or handled by this application.

Full refunds revoke that payment's cosmetic; partial refunds keep it. Disputes
block their capture and a seller-favour resolution restores it if no full refund
still blocks it. A refund arriving before completion cannot be undone by a late
completion event. Another valid purchase for the same cosmetic retains ownership.
Active characters refresh purchases and remove revoked appearances. Keep webhook
delivery retries enabled and review failed events in the PayPal dashboard.

GET `/shop/catalog` offers the public catalog and, with a verified token, only
that account's ownership. Server-side equip checks reject unowned paid IDs,
including forged wardrobe messages. Guests only use Adventurer. Disabled payment
configuration cannot charge customers; the earned-outfit restrictions still apply.

## Validation

`npm test`, `npm run build`, `npm run test:shop:integration`, and
`npm run test:shop:browser` (Vite at 5344 or TEST_CLIENT_URL). Unit tests use a
mock PayPal HTTP transport and a real local SQL engine; they do not send real
money. Browser tests cover mobile/desktop previews, all categories/prices and
free/class outfit locks. Integration tests cover server equip checks, sharing
purchases across slots, account isolation, and refund revocation. Real PayPal
sandbox testing with your own credentials remains a deployment step.

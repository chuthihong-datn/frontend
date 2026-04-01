/**
 * VNPay Payment Integration Guide
 * 
 * Frontend Flow:
 * 1. User fills checkout form on /cart page
 * 2. Calls createOrderApi with payment method 'VNPAY'
 * 3. Backend returns paymentUrl from VNPayService.createPaymentUrl()
 * 4. Frontend redirects to paymentUrl (VNPay payment gateway)
 * 5. User completes payment on VNPay
 * 6. VNPay redirects to the configured returnUrl with callback params
 * 7. Backend processes payment at /payment/vnpay-return endpoint
 * 8. Frontend shows success/failed page
 */

// ============================================================
// BACKEND CONFIGURATION (Required)
// ============================================================
/**
 * File: Backend VNPayConfig (application.yml or .properties)
 * 
 * vnpay:
 *   tmn-code: "YOUR_TMN_CODE"
 *   hash-secret: "YOUR_HASH_SECRET"
 *   pay-url: "https://sandbox.vnpayment.vn/paygate"  # or production URL
 *   return-url: "http://localhost:3000/api/payment/vnpay-return"  # Frontend API route
 * 
 * For production:
 *   return-url: "https://yourdomain.com/api/payment/vnpay-return"
 */

// ============================================================
// FRONTEND API ROUTE (Already created)
// ============================================================
/**
 * File: src/app/api/payment/vnpay-return/route.ts
 * 
 * - This route receives the VNPay callback
 * - Forwards it to backend's /payment/vnpay-return endpoint
 * - Redirects to success/failed/error pages based on response code
 */

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================
/**
 * .env.local file should contain:
 * 
 * NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
 * # or for production
 * NEXT_PUBLIC_API_BASE_URL=https://your-backend-api.com/api
 */

// ============================================================
// STEPS TO IMPLEMENT
// ============================================================
/**
 * 1. Configure VNPay credentials in backend application.yml
 * 2. Set the return-url to point to frontend API route
 * 3. Ensure NEXT_PUBLIC_API_BASE_URL is set correctly in .env.local
 * 4. Test in sandbox mode first
 * 5. Once working, switch to production VNPay URLs and credentials
 */

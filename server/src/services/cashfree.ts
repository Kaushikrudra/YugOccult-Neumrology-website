import { Cashfree, CFEnvironment } from 'cashfree-pg'

/**
 * Service for interfacing with Cashfree Payment Gateway APIs.
 * Supports sandbox and production environments switchable via CASHFREE_ENV.
 * API version is controlled globally by CASHFREE_API_VERSION (default: 2025-01-01).
 * Never logs secrets, card details, or full webhook payload.
 */

const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID?.trim() || ''
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET?.trim() || ''
const CASHFREE_ENV = (process.env.CASHFREE_ENV?.trim() || 'sandbox').toLowerCase()
export const CASHFREE_API_VERSION = process.env.CASHFREE_API_VERSION?.trim() || '2025-01-01'

export function isCashfreeConfigured(): boolean {
  return Boolean(CASHFREE_CLIENT_ID && CASHFREE_CLIENT_SECRET)
}

function getCashfreeClient(): Cashfree {
  if (!isCashfreeConfigured()) {
    throw new Error('Cashfree credentials are not configured.')
  }

  const env = CASHFREE_ENV === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX
  const client = new Cashfree(env, CASHFREE_CLIENT_ID, CASHFREE_CLIENT_SECRET)
  client.XApiVersion = CASHFREE_API_VERSION
  return client
}

export interface CreateCashfreeOrderParams {
  orderId: string
  orderAmount: number
  orderCurrency?: string
  customerId: string
  customerName?: string
  customerEmail?: string
  customerPhone: string
  returnUrl: string
  notifyUrl?: string
}

export interface CreateCashfreeOrderResult {
  orderId: string
  paymentSessionId: string
  orderStatus: string
  orderAmount: number
}

/**
 * Creates an order on Cashfree Payment Gateway and returns the payment session ID.
 */
export async function createCashfreeOrder(
  params: CreateCashfreeOrderParams
): Promise<CreateCashfreeOrderResult> {
  const client = getCashfreeClient()

  // Format phone to 10 digits as required by Cashfree
  const cleanPhone = params.customerPhone.replace(/\D/g, '').slice(-10)
  if (cleanPhone.length !== 10) {
    throw new Error('Customer phone number must contain at least 10 valid digits.')
  }

  const numericAmount = parseFloat(String(params.orderAmount)) || 0

  const createOrderRequest: any = {
    order_id: params.orderId,
    order_amount: Number(numericAmount.toFixed(2)),
    order_currency: params.orderCurrency || 'INR',
    customer_details: {
      customer_id: params.customerId,
      customer_name: params.customerName || 'Seeker',
      customer_email: params.customerEmail || 'support@yugskill.com',
      customer_phone: cleanPhone,
    },
    order_meta: {
      return_url: params.returnUrl,
      ...(params.notifyUrl ? { notify_url: params.notifyUrl } : {}),
    },
  }

  try {
    const response = await client.PGCreateOrder(createOrderRequest)
    const data = response.data

    if (!data.payment_session_id) {
      throw new Error('Cashfree response did not include payment_session_id.')
    }

    return {
      orderId: data.order_id || params.orderId,
      paymentSessionId: data.payment_session_id,
      orderStatus: data.order_status || 'ACTIVE',
      orderAmount: Number(data.order_amount) || params.orderAmount,
    }
  } catch (err: any) {
    const errorData = err?.response?.data || {}
    const errorMsg = errorData.message || err?.message || 'Cashfree order creation failed'
    console.error(`[Cashfree:CreateOrder] Error creating order ${params.orderId}:`, errorMsg)
    throw new Error(errorMsg)
  }
}

/**
 * Fetches order details from Cashfree by order ID.
 */
export async function fetchCashfreeOrder(orderId: string): Promise<any> {
  const client = getCashfreeClient()
  try {
    const response = await client.PGFetchOrder(orderId)
    return response.data
  } catch (err: any) {
    const errorData = err?.response?.data || {}
    console.error(`[Cashfree:FetchOrder] Error fetching order ${orderId}:`, errorData.message || err.message)
    throw err
  }
}

/**
 * Fetches all payment transactions associated with a Cashfree order.
 */
export async function fetchCashfreePayments(orderId: string): Promise<any[]> {
  const client = getCashfreeClient()
  try {
    const response = await client.PGOrderFetchPayments(orderId)
    return Array.isArray(response.data) ? response.data : []
  } catch (err: any) {
    const errorData = err?.response?.data || {}
    console.error(`[Cashfree:FetchPayments] Error fetching payments for order ${orderId}:`, errorData.message || err.message)
    return []
  }
}

/**
 * Verifies the authenticity of Cashfree webhook notification using HMAC SHA256.
 */
export function verifyWebhookSignature(
  signature: string,
  rawBody: string,
  timestamp: string
): any {
  const client = getCashfreeClient()
  return client.PGVerifyWebhookSignature(signature, rawBody, timestamp)
}

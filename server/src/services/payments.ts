import { pool } from '../db'
import { isCashfreeConfigured, fetchCashfreeOrder, fetchCashfreePayments } from './cashfree'
import { grantEnrollment } from './enrollment'

export interface OrderRecord {
  id: string
  type: 'course' | 'consultation' | 'ebook' | 'report'
  reference_id: string | null
  reference_title: string | null
  amount: number
  status: 'pending' | 'paid' | 'failed' | 'cancelled'
  cashfree_order_id: string | null
  payment_session_id: string | null
  cashfree_payment_id: string | null
  payment_method: string | null
  customer_name: string
  customer_email: string
  customer_phone: string
  user_id: string | null
  paid_at: string | null
  failure_reason: string | null
  created_at: string
  updated_at: string
}

export interface SyncOrderResult {
  order: OrderRecord | null
  alreadyPaid?: boolean
  error?: string
}

/**
 * Synchronizes a local order's status with Cashfree Payment Gateway.
 * Idempotent: If an order is already marked 'paid', it will never be downgraded or reprocessed.
 * Verifies exact order amount before marking an order as paid.
 */
export async function syncOrderWithCashfree(orderIdentifier: string): Promise<SyncOrderResult> {
  // 1. Fetch local order record by primary ID or Cashfree order ID
  const orderRes = await pool.query<OrderRecord>(
    `SELECT 
      id, type, reference_id, reference_title, amount::float AS amount,
      LOWER(status) AS status, cashfree_order_id, payment_session_id,
      cashfree_payment_id, payment_method, customer_name, customer_email,
      customer_phone, user_id, paid_at, failure_reason, created_at, updated_at
     FROM orders 
     WHERE id::text = $1 OR cashfree_order_id = $1
     LIMIT 1;`,
    [orderIdentifier]
  )

  if (orderRes.rows.length === 0) {
    return { order: null, error: 'Order not found' }
  }

  const order = orderRes.rows[0]

  // If already paid locally, return immediately (strictly idempotent)
  if (order.status === 'paid') {
    return { order, alreadyPaid: true }
  }

  // If Cashfree is not configured (e.g. tests or missing env), return current order state
  if (!isCashfreeConfigured()) {
    return { order }
  }

  const cfLookupId = order.cashfree_order_id || order.id

  try {
    // 2. Fetch fresh status from Cashfree
    const cfOrder = await fetchCashfreeOrder(cfLookupId)
    if (!cfOrder) {
      return { order }
    }

    const cfStatus = (cfOrder.order_status || '').toUpperCase()

    // 3. Handle PAID order
    if (cfStatus === 'PAID') {
      const cfAmount = Number(cfOrder.order_amount)
      const localAmount = Number(order.amount)

      // Strict security: Verify order amount matches
      if (Math.abs(cfAmount - localAmount) > 0.01) {
        console.error(
          `[Payments:Security] Amount mismatch for order ${order.id}. Local: ${localAmount}, Cashfree: ${cfAmount}`
        )
        return { order, error: 'Payment amount mismatch. Order verification blocked.' }
      }

      // Fetch payment details to obtain payment ID & method
      let paymentId: string | null = null
      let paymentMethod: string | null = null
      let paidAtTimestamp: string = new Date().toISOString()

      try {
        const payments = await fetchCashfreePayments(cfLookupId)
        const successfulPayment = payments.find(
          (p: any) => p.payment_status === 'SUCCESS' || p.payment_status === 'PAID'
        ) || payments[0]

        if (successfulPayment) {
          paymentId = String(successfulPayment.cf_payment_id || successfulPayment.payment_id || '')
          paymentMethod = String(
            successfulPayment.payment_group ||
            successfulPayment.payment_method?.type ||
            successfulPayment.payment_method ||
            'ONLINE'
          )
          if (successfulPayment.payment_time) {
            paidAtTimestamp = new Date(successfulPayment.payment_time).toISOString()
          }
        }
      } catch (pErr) {
        console.warn(`[Payments:Sync] Could not fetch payment details for order ${order.id}:`, pErr)
      }

      // Update local order to 'paid' in a transaction
      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        const updateRes = await client.query<OrderRecord>(
          `UPDATE orders
           SET status = 'paid',
               paid_at = COALESCE(paid_at, $1),
               cashfree_payment_id = COALESCE($2, cashfree_payment_id),
               payment_method = COALESCE($3, payment_method),
               updated_at = timezone('utc'::text, now())
           WHERE id = $4 AND status <> 'paid'
           RETURNING 
            id, type, reference_id, reference_title, amount::float AS amount,
            status, cashfree_order_id, payment_session_id, cashfree_payment_id,
            payment_method, customer_name, customer_email, customer_phone,
            user_id, paid_at, failure_reason, created_at, updated_at;`,
          [paidAtTimestamp, paymentId, paymentMethod, order.id]
        )

        // 4. Fulfill purchase by type
        if (order.type === 'course' && order.user_id && order.reference_id) {
          await grantEnrollment({
            userId: order.user_id,
            courseId: order.reference_id,
            orderId: order.id,
            source: 'payment',
          })
          console.log(`[Payments:Fulfill] Granted enrollment for user ${order.user_id} in course ${order.reference_id}`)
        } else if (order.type === 'ebook' && order.user_id && order.reference_id) {
          await client.query(
            `INSERT INTO ebook_purchases (ebook_id, user_id, order_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (ebook_id, user_id) DO UPDATE SET order_id = EXCLUDED.order_id;`,
            [order.reference_id, order.user_id, order.id]
          )
          console.log(`[Payments:Fulfill] Granted ebook purchase for user ${order.user_id} on ebook ${order.reference_id}`)
        } else if (order.type === 'report') {
          await client.query(
            `UPDATE report_orders
             SET status = 'paid',
                 updated_at = timezone('utc'::text, now())
             WHERE order_id = $1 AND status = 'new';`,
            [order.id]
          )
          console.log(`[Payments:Fulfill] Marked report_order paid for order ${order.id}`)
        } else if (order.type === 'consultation') {
          // Consultation booking remains 'new' (admin confirms), order is paid
          console.log(`[Payments:Fulfill] Paid consultation booking registered for order ${order.id}`)
        }

        await client.query('COMMIT')

        const updatedOrder = updateRes.rows[0] || { ...order, status: 'paid', paid_at: paidAtTimestamp }
        return { order: updatedOrder }
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(`[Payments:FulfillError] Error updating order ${order.id}:`, err)
        throw err
      } finally {
        client.release()
      }
    }

    // 5. Handle FAILED or EXPIRED order
    if (cfStatus === 'EXPIRED' || cfStatus === 'FAILED') {
      const reason = cfOrder.order_status_description || 'Payment expired or failed at gateway'
      const updateRes = await pool.query<OrderRecord>(
        `UPDATE orders
         SET status = 'failed',
             failure_reason = $1,
             updated_at = timezone('utc'::text, now())
         WHERE id = $2 AND status NOT IN ('paid', 'failed')
         RETURNING 
          id, type, reference_id, reference_title, amount::float AS amount,
          status, cashfree_order_id, payment_session_id, cashfree_payment_id,
          payment_method, customer_name, customer_email, customer_phone,
          user_id, paid_at, failure_reason, created_at, updated_at;`,
        [reason, order.id]
      )
      return { order: updateRes.rows[0] || { ...order, status: 'failed', failure_reason: reason } }
    }

    // 6. Handle TERMINATED / CANCELLED order
    if (cfStatus === 'TERMINATED' || cfStatus === 'CANCELLED') {
      const reason = cfOrder.order_status_description || 'Order terminated'
      const updateRes = await pool.query<OrderRecord>(
        `UPDATE orders
         SET status = 'cancelled',
             failure_reason = $1,
             updated_at = timezone('utc'::text, now())
         WHERE id = $2 AND status NOT IN ('paid', 'cancelled')
         RETURNING 
          id, type, reference_id, reference_title, amount::float AS amount,
          status, cashfree_order_id, payment_session_id, cashfree_payment_id,
          payment_method, customer_name, customer_email, customer_phone,
          user_id, paid_at, failure_reason, created_at, updated_at;`,
        [reason, order.id]
      )
      return { order: updateRes.rows[0] || { ...order, status: 'cancelled', failure_reason: reason } }
    }

    return { order }
  } catch (err: any) {
    console.error(`[Payments:SyncError] Error syncing order ${order.id}:`, err?.message || err)
    return { order }
  }
}

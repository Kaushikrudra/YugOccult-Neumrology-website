import { load } from '@cashfreepayments/cashfree-js'

let cashfreeInstance: any = null
let loadPromise: Promise<any> | null = null

/**
 * Initializes and retrieves the singleton instance of Cashfree SDK.
 * Reads mode from VITE_CASHFREE_MODE (defaults to 'sandbox').
 */
export async function getCashfree(): Promise<any> {
  if (cashfreeInstance) {
    return cashfreeInstance
  }

  if (!loadPromise) {
    const rawMode = (import.meta.env.VITE_CASHFREE_MODE || 'sandbox').trim().toLowerCase()
    const mode = rawMode === 'production' ? 'production' : 'sandbox'

    loadPromise = load({ mode }).then((cf: any) => {
      cashfreeInstance = cf
      return cf
    })
  }

  return loadPromise
}

/**
 * Opens Cashfree hosted checkout page for a given payment session ID.
 * Redirects in the current window (_self) to ensure seamless flow on mobile & desktop.
 */
export async function startCheckout(paymentSessionId: string): Promise<void> {
  if (!paymentSessionId) {
    throw new Error('Payment session ID is required to initiate checkout.')
  }

  const cashfree = await getCashfree()
  if (!cashfree) {
    throw new Error('Unable to load Cashfree payment gateway.')
  }

  await cashfree.checkout({
    paymentSessionId,
    redirectTarget: '_self',
  })
}

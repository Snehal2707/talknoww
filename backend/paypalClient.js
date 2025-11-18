require('dotenv').config();
const axios = require('axios');

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox'; // 'sandbox' or 'live'

const PAYPAL_BASE_URL = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

let accessToken = null;
let tokenExpiry = 0;

/**
 * Get PayPal access token
 */
async function getAccessToken() {
  // Return cached token if still valid
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    accessToken = response.data.access_token;
    // Token expires in 32400 seconds (9 hours), cache for 8 hours
    tokenExpiry = Date.now() + (8 * 60 * 60 * 1000);
    
    return accessToken;
  } catch (error) {
    console.error('[PayPal] Error getting access token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with PayPal');
  }
}

/**
 * Verify PayPal subscription/order
 */
async function verifyOrder(orderId) {
  try {
    const token = await getAccessToken();
    
    const response = await axios.get(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('[PayPal] Error verifying order:', error.response?.data || error.message);
    throw new Error('Failed to verify PayPal order');
  }
}

/**
 * Verify PayPal subscription
 */
async function verifySubscription(subscriptionId) {
  try {
    const token = await getAccessToken();
    
    const response = await axios.get(
      `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('[PayPal] Error verifying subscription:', error.response?.data || error.message);
    throw new Error('Failed to verify PayPal subscription');
  }
}

/**
 * Create PayPal subscription
 */
async function createSubscription(planId) {
  try {
    const token = await getAccessToken();
    
    const response = await axios.post(
      `${PAYPAL_BASE_URL}/v1/billing/subscriptions`,
      {
        plan_id: planId,
        start_time: new Date(Date.now() + 60000).toISOString(), // Start 1 minute from now
        application_context: {
          brand_name: 'ChatCorner',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
          },
          return_url: `${process.env.CLIENT_ORIGINS?.split(',')[0] || 'http://localhost:3000'}/subscription/success`,
          cancel_url: `${process.env.CLIENT_ORIGINS?.split(',')[0] || 'http://localhost:3000'}/subscription/cancel`
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('[PayPal] Error creating subscription:', error.response?.data || error.message);
    throw new Error('Failed to create PayPal subscription');
  }
}

/**
 * Cancel PayPal subscription
 */
async function cancelSubscription(subscriptionId) {
  try {
    const token = await getAccessToken();
    
    await axios.post(
      `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
      {
        reason: 'User requested cancellation'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return true;
  } catch (error) {
    console.error('[PayPal] Error cancelling subscription:', error.response?.data || error.message);
    throw new Error('Failed to cancel PayPal subscription');
  }
}

module.exports = {
  getAccessToken,
  verifyOrder,
  verifySubscription,
  createSubscription,
  cancelSubscription,
  PAYPAL_BASE_URL
};


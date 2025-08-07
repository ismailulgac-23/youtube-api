const axios = require('axios');

class PaymentService {
  constructor() {
    this.dodoPaymentsConfig = {
      apiKey: process.env.DODO_PAYMENTS_API_KEY,
      baseURL: process.env.DODO_PAYMENTS_BASE_URL || 'https://api.dodopayments.com',
      webhookSecret: process.env.DODO_PAYMENTS_WEBHOOK_SECRET
    };

    this.coinbaseConfig = {
      apiKey: process.env.COINBASE_API_KEY,
      apiSecret: process.env.COINBASE_API_SECRET,
      baseURL: process.env.COINBASE_BASE_URL || 'https://api.commerce.coinbase.com',
      webhookSecret: process.env.COINBASE_WEBHOOK_SECRET
    };
  }

  // DodoPayments Integration
  async createDodoPayment(orderData) {
    try {
      const paymentData = {
        amount: orderData.finalPrice,
        currency: orderData.currency === '₺' ? 'TRY' : orderData.currency,
        order_id: orderData.orderNumber,
        description: `Payment for ${orderData.productName} - ${orderData.serviceName}`,
        customer: {
          name: orderData.customerDetails.fullName,
          email: orderData.customerDetails.email,
          phone: orderData.customerDetails.phone
        },
        callback_url: `${process.env.BASE_URL}/api/payments/dodo/callback`,
        return_url: `${process.env.FRONTEND_URL}/order-success`,
        cancel_url: `${process.env.FRONTEND_URL}/order-cancelled`,
        metadata: {
          order_id: orderData.orderId,
          user_id: orderData.userId
        }
      };

      const response = await axios.post(
        `${this.dodoPaymentsConfig.baseURL}/v1/payments`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${this.dodoPaymentsConfig.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        paymentId: response.data.id,
        paymentUrl: response.data.payment_url,
        status: response.data.status,
        data: response.data
      };

    } catch (error) {
      console.error('DodoPayments error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Payment creation failed'
      };
    }
  }

  async checkDodoPaymentStatus(paymentId) {
    try {
      const response = await axios.get(
        `${this.dodoPaymentsConfig.baseURL}/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.dodoPaymentsConfig.apiKey}`
          }
        }
      );

      return {
        success: true,
        status: response.data.status,
        data: response.data
      };

    } catch (error) {
      console.error('DodoPayments status check error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Status check failed'
      };
    }
  }

  // Coinbase Commerce Integration
  async createCoinbasePayment(orderData) {
    try {
      const paymentData = {
        name: `${orderData.productName} - ${orderData.serviceName}`,
        description: `Payment for ${orderData.productName}`,
        pricing_type: 'fixed_price',
        local_price: {
          amount: orderData.finalPrice.toString(),
          currency: orderData.currency === '₺' ? 'USD' : orderData.currency // Coinbase doesn't support TRY
        },
        metadata: {
          order_id: orderData.orderId,
          order_number: orderData.orderNumber,
          user_id: orderData.userId,
          customer_name: orderData.customerDetails.fullName,
          customer_email: orderData.customerDetails.email
        },
        redirect_url: `${process.env.FRONTEND_URL}/order-success`,
        cancel_url: `${process.env.FRONTEND_URL}/order-cancelled`
      };

      const response = await axios.post(
        `${this.coinbaseConfig.baseURL}/charges`,
        paymentData,
        {
          headers: {
            'X-CC-Api-Key': this.coinbaseConfig.apiKey,
            'X-CC-Version': '2018-03-22',
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        paymentId: response.data.data.id,
        paymentUrl: response.data.data.hosted_url,
        status: response.data.data.timeline[0].status,
        data: response.data.data
      };

    } catch (error) {
      console.error('Coinbase Commerce error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Payment creation failed'
      };
    }
  }

  async checkCoinbasePaymentStatus(paymentId) {
    try {
      const response = await axios.get(
        `${this.coinbaseConfig.baseURL}/charges/${paymentId}`,
        {
          headers: {
            'X-CC-Api-Key': this.coinbaseConfig.apiKey,
            'X-CC-Version': '2018-03-22'
          }
        }
      );

      const latestTimeline = response.data.data.timeline[response.data.data.timeline.length - 1];

      return {
        success: true,
        status: latestTimeline.status,
        data: response.data.data
      };

    } catch (error) {
      console.error('Coinbase status check error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Status check failed'
      };
    }
  }

  // Generic payment creation method
  async createPayment(paymentMethod, orderData) {
    switch (paymentMethod) {
      case 'crypto_dodo':
        return await this.createDodoPayment(orderData);
      case 'crypto_coinbase':
        return await this.createCoinbasePayment(orderData);
      default:
        return {
          success: false,
          error: 'Unsupported payment method'
        };
    }
  }

  // Generic payment status check method
  async checkPaymentStatus(paymentMethod, paymentId) {
    switch (paymentMethod) {
      case 'crypto_dodo':
        return await this.checkDodoPaymentStatus(paymentId);
      case 'crypto_coinbase':
        return await this.checkCoinbasePaymentStatus(paymentId);
      default:
        return {
          success: false,
          error: 'Unsupported payment method'
        };
    }
  }

  // Webhook signature verification
  verifyDodoWebhook(payload, signature) {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.dodoPaymentsConfig.webhookSecret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  }

  verifyCoinbaseWebhook(payload, signature) {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.coinbaseConfig.webhookSecret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  }

  // Map payment statuses to our internal statuses
  mapPaymentStatus(paymentMethod, externalStatus) {
    const statusMappings = {
      crypto_dodo: {
        'pending': 'pending',
        'processing': 'processing',
        'completed': 'completed',
        'failed': 'failed',
        'cancelled': 'cancelled',
        'refunded': 'refunded'
      },
      crypto_coinbase: {
        'NEW': 'pending',
        'PENDING': 'processing',
        'CONFIRMED': 'completed',
        'FAILED': 'failed',
        'EXPIRED': 'cancelled',
        'CANCELED': 'cancelled',
        'REFUND PENDING': 'refunded',
        'REFUNDED': 'refunded'
      }
    };

    return statusMappings[paymentMethod]?.[externalStatus] || 'pending';
  }
}

module.exports = new PaymentService();
import Stripe from 'stripe';
import PaymentHistory from '../models/paymentHistory.model.js';
import User from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'usd', planName } = req.body;
    const userId = req.user._id;

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        userId: userId.toString(),
        planName,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Error creating payment intent' });
  }
};

export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handleSuccessfulPayment(paymentIntent);
      break;
    case 'payment_intent.payment_failed':
      const failedPaymentIntent = event.data.object;
      await handleFailedPayment(failedPaymentIntent);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

export const handleSuccessfulPayment = async (paymentIntent) => {
  try {
    const { userId, planName, paymentHistoryId } = paymentIntent.metadata;
    
    // Update the existing payment record
    await PaymentHistory.findByIdAndUpdate(paymentHistoryId, {
      $set: {
        status: 'completed',
        transactionId: paymentIntent.id,
        paymentDate: new Date(),
        paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
        'metadata.paymentCompleted': new Date().toISOString(),
        'metadata.stripePaymentIntent': paymentIntent.id,
        'metadata.paymentStatus': paymentIntent.status
      }
    });
    
    // Here you can add additional logic like sending confirmation emails, updating user subscription, etc.
    
  } catch (error) {
    console.error('Error handling successful payment:', error);
    // Consider implementing a retry mechanism or logging to a monitoring system
  }
};

// New endpoint to handle successful payment confirmation


const handleFailedPayment = async (paymentIntent) => {
  try {
    const { userId, planName } = paymentIntent.metadata;
    
    await PaymentHistory.create({
      userId,
      amount: paymentIntent.amount / 100,
      status: 'failed',
      transactionId: paymentIntent.id,
      paymentMethod: paymentIntent.payment_method_types[0] || 'other',
      planName: paymentIntent.metadata.planName,
    });
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
};

export const createCheckoutSession = async (req, res) => {
  try {
    const { successUrl, cancelUrl, customerEmail, amount, planName } = req.body;
    const userId = req.user?._id;

    // Create a payment history record
    const paymentRecord = await PaymentHistory.create({
      userId,
      amount,
      status: 'pending',
      paymentMethod: 'stripe',
      planName,
      transactionId: 'temp',
      planType: planName.toLowerCase().includes('monthly') ? 'monthly' : 'yearly',
      paymentDate: new Date()
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planName || 'Premium Plan',
              description: planName || 'Subscription',
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
    });

    // Update the payment record with the session ID
    await PaymentHistory.findByIdAndUpdate(paymentRecord._id, {
      transactionId: session.id
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message || 'Error creating checkout session' });
  }
};


export const confirmPaymentSuccess = async (req, res) => {
    try {
      const { session_id } = req.query;
      
      if (!session_id) {
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }
      
      // Retrieve the session from Stripe
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ['payment_intent']
      });
      
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }
      
      // Update payment history
      const paymentHistory = await PaymentHistory.findOneAndUpdate(
        { transactionId: session.id },
        {
          status: 'completed',
          paymentDate: new Date()
        },
        { new: true }
      );
      
      if (!paymentHistory) {
        console.warn(`Payment history not found for session: ${session_id}`);
        throw new Error('Payment history not found');
      }

      // Update user's subscription end date
      const subscriptionEnd = new Date();
      if (paymentHistory.planType === 'monthly') {
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
      } else if (paymentHistory.planType === 'yearly') {
        subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);
      }

      await User.findByIdAndUpdate(paymentHistory.userId, {
        subscriptionEnd: subscriptionEnd
      });
      
      // Return success response with relevant data
      res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully',
        data: {
          paymentId: session.payment_intent?.id || session.id,
          amount: session.amount_total ? session.amount_total / 100 : null,
          currency: session.currency,
          status: session.payment_status,
          customer: session.customer_details,
          paymentHistoryId: paymentHistory?._id
        }
      });
      
    } catch (error) {
      console.error('Error confirming payment:', error);
      res.status(500).json({
        success: false,
        message: 'Error confirming payment',
        error: error.message
      });
    }
  };

export const getPaymentHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const payments = await PaymentHistory.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Error fetching payment history' });
  }
};

const {
  getSubscriptionsByCustomer,
  getSubscriptionById,
  updateSubscription,
  cancelSubscription,
} = require("../services/billingService");

// ─── Helper — parse and validate :id param ────────────────────────────────────
function parseId(raw) {
  const id = parseInt(raw, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// ─── GET /api/subscriptions ────────────────────────────────────────────────────
// Returns subscriptions for the authenticated user's customer account.
// For simplicity, if user is not a CUSTOMER, return empty array.
async function getSubscriptionsHandler(req, res) {
  try {
    let subscriptions = [];

    // If the user has a customer_id in their JWT or profile, use it
    // For this implementation, we'll look up by user role
    if (req.user.role === "CUSTOMER") {
      // Assume customer_id = user_id for CUSTOMER role
      subscriptions = await getSubscriptionsByCustomer(req.user.id);
    } else if (req.query.customer_id) {
      // Admin/Finance can query by customer_id
      const customerId = parseId(req.query.customer_id);
      if (customerId) {
        subscriptions = await getSubscriptionsByCustomer(customerId);
      }
    }

    return res.status(200).json({ success: true, subscriptions });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch subscriptions",
    });
  }
}

// ─── GET /api/subscriptions/:id ────────────────────────────────────────────────
async function getSubscriptionHandler(req, res) {
  const subscriptionId = parseId(req.params.id);
  if (!subscriptionId) {
    return res.status(400).json({ success: false, message: "Invalid subscription ID" });
  }

  try {
    const subscription = await getSubscriptionById(subscriptionId);
    return res.status(200).json({ success: true, subscription });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to fetch subscription",
    });
  }
}

// ─── PUT /api/subscriptions/:id ────────────────────────────────────────────────
// Update subscription (e.g., change quantity with proration).
//
// Body:
// {
//   "quantity": 3,
//   "remaining_days": 15,
//   "cycle_days": 30
// }
async function updateSubscriptionHandler(req, res) {
  const subscriptionId = parseId(req.params.id);
  if (!subscriptionId) {
    return res.status(400).json({ success: false, message: "Invalid subscription ID" });
  }

  const { quantity, remaining_days, cycle_days } = req.body;

  try {
    const result = await updateSubscription(subscriptionId, {
      quantity,
      remainingDays: remaining_days,
      cycleDays: cycle_days,
    });

    return res.status(200).json({
      success: true,
      message: "Subscription updated",
      subscription: result.subscription,
      prorated_amount: result.prorated_amount,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to update subscription",
    });
  }
}

// ─── POST /api/subscriptions/:id/cancel ────────────────────────────────────────
// Cancel an active subscription.
async function cancelSubscriptionHandler(req, res) {
  const subscriptionId = parseId(req.params.id);
  if (!subscriptionId) {
    return res.status(400).json({ success: false, message: "Invalid subscription ID" });
  }

  try {
    const subscription = await cancelSubscription(subscriptionId);
    return res.status(200).json({
      success: true,
      message: "Subscription cancelled",
      subscription,
    });
  } catch (err) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Failed to cancel subscription",
    });
  }
}

module.exports = {
  getSubscriptionsHandler,
  getSubscriptionHandler,
  updateSubscriptionHandler,
  cancelSubscriptionHandler,
};

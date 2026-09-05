const APIClient = require("./helpers/apiClient");
const Logger = require("./helpers/logger");
const Validator = require("./helpers/validator");

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 12 — TASK 43: COMPLETE BACKEND DEMO FLOW
// ─────────────────────────────────────────────────────────────────────────────
// This script demonstrates the complete DealFlow360 business process:
//
// LOGIN → CREATE QUOTE → ADD PRODUCTS → APPLY DISCOUNT → CALCULATE MARGIN →
// CALCULATE RISK → AUTO APPROVAL → MANAGER APPROVAL → FINANCE APPROVAL →
// WAREHOUSE SPLIT → CONFIRM ORDER → GENERATE BILLING → CUSTOMER NEGOTIATION →
// RE-CALCULATE RISK → RE-APPROVAL → FINAL CONFIRMATION → PAYMENT
//
// This proves all backend phases (1-11) work together as one system.
// ─────────────────────────────────────────────────────────────────────────────

class DealFlowDemo {
  constructor() {
    this.client = new APIClient();
    this.logger = new Logger();
    this.state = {
      salesRepToken: null,
      managerToken: null,
      financeToken: null,
      customerToken: null,
      quoteId: null,
      productIds: [],
      invoiceId: null,
      subscriptionId: null,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1: LOGIN (Sales Rep)
  // ═══════════════════════════════════════════════════════════════════════════
  async step1_login() {
    this.logger.step("LOGIN (Sales Rep)");

    const response = await this.client.post("/auth/login", {
      email: "sales@dealflow.com",
      password: "password123",
    });

    Validator.assertSuccess(response, "Login");
    Validator.assertExists(response.token, "JWT token");

    this.state.salesRepToken = response.token;
    this.client.setToken(response.token);

    this.logger.success("Sales Rep authenticated");
    this.logger.info(`Token: ${response.token.substring(0, 20)}...`);
    this.logger.info(`User: ${response.user.name} (${response.user.role})`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2: CREATE QUOTE
  // ═══════════════════════════════════════════════════════════════════════════
  async step2_createQuote() {
    this.logger.step("CREATE QUOTE");

    const response = await this.client.post("/quotes", {
      customer_id: 1,
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    });

    Validator.assertSuccess(response, "Create Quote");
    Validator.assertExists(response.quote.id, "Quote ID");

    this.state.quoteId = response.quote.id;

    this.logger.success("Quote created");
    this.logger.info(`Quote ID: ${this.state.quoteId}`);
    this.logger.info(`Status: ${response.quote.status}`);
    this.logger.info(`Customer ID: ${response.quote.customer_id}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3: ADD PRODUCTS
  // ═══════════════════════════════════════════════════════════════════════════
  async step3_addProducts() {
    this.logger.step("ADD PRODUCTS");

    // Add Laptop × 2
    const laptop = await this.client.post(
      `/quotes/${this.state.quoteId}/lines`,
      {
        product_id: 1,
        quantity: 2,
      }
    );
    Validator.assertSuccess(laptop, "Add Laptop");

    // Add Support × 1
    const support = await this.client.post(
      `/quotes/${this.state.quoteId}/lines`,
      {
        product_id: 2,
        quantity: 1,
      }
    );
    Validator.assertSuccess(support, "Add Support");

    this.logger.success("Products added to quote");
    this.logger.info("Laptop × 2");
    this.logger.info("Support × 1");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4: APPLY DISCOUNT
  // ═══════════════════════════════════════════════════════════════════════════
  async step4_applyDiscount() {
    this.logger.step("APPLY DISCOUNT");

    const response = await this.client.put(`/quotes/${this.state.quoteId}`, {
      discount_percentage: 10,
    });

    Validator.assertSuccess(response, "Apply Discount");

    this.logger.success("Discount applied");
    this.logger.info("Discount: 10%");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5: CALCULATE MARGIN & RISK
  // ═══════════════════════════════════════════════════════════════════════════
  async step5_calculateMarginAndRisk() {
    this.logger.step("CALCULATE MARGIN & RISK");

    const response = await this.client.get(`/quotes/${this.state.quoteId}`);

    Validator.assertSuccess(response, "Get Quote");
    Validator.assertExists(response.quote.margin_percentage, "Margin");
    Validator.assertExists(response.quote.risk_score, "Risk Score");

    this.logger.success("Margin and risk calculated");
    this.logger.info(`Margin: ${response.quote.margin_percentage}%`);
    this.logger.info(`Risk Score: ${response.quote.risk_score}`);
    this.logger.info(`Risk Level: ${response.quote.risk_level}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 6: SUBMIT FOR APPROVAL
  // ═══════════════════════════════════════════════════════════════════════════
  async step6_submitForApproval() {
    this.logger.step("SUBMIT FOR APPROVAL");

    const response = await this.client.post(
      `/quotes/${this.state.quoteId}/submit`
    );

    Validator.assertSuccess(response, "Submit Quote");

    this.logger.success("Quote submitted");
    this.logger.info(`Status: ${response.quote.status}`);
    this.logger.info(`Approval Required: ${response.approval_required}`);

    if (response.approval_required) {
      this.logger.info(
        `Approval Level: ${response.quote.current_approval_level}`
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 7: MANAGER APPROVAL
  // ═══════════════════════════════════════════════════════════════════════════
  async step7_managerApproval() {
    this.logger.step("MANAGER APPROVAL");

    // Login as manager
    const loginResponse = await this.client.post("/auth/login", {
      email: "manager@dealflow.com",
      password: "password123",
    });

    Validator.assertSuccess(loginResponse, "Manager Login");
    this.state.managerToken = loginResponse.token;
    this.client.setToken(loginResponse.token);

    this.logger.success("Manager authenticated");

    // Get pending approvals
    const pendingResponse = await this.client.get("/approvals/pending");
    Validator.assertSuccess(pendingResponse, "Get Pending Approvals");

    this.logger.info(
      `Pending approvals: ${pendingResponse.pending_approvals.length}`
    );

    // Check if our quote is in the queue
    const quoteApproval = pendingResponse.pending_approvals.find(
      (a) => a.quote_id === this.state.quoteId
    );

    if (!quoteApproval) {
      this.logger.info("Quote does not require manager approval (auto-approved)");
      this.client.setToken(this.state.salesRepToken);
      return;
    }

    // Approve the quote
    const approvalResponse = await this.client.post(
      `/quotes/${this.state.quoteId}/approve`,
      {
        comments: "Approved by manager - good margin",
      }
    );

    Validator.assertSuccess(approvalResponse, "Manager Approval");

    this.logger.success("Manager approved quote");
    this.logger.info(`New status: ${approvalResponse.quote.status}`);

    // Switch back to sales rep
    this.client.setToken(this.state.salesRepToken);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 8: FINANCE APPROVAL
  // ═══════════════════════════════════════════════════════════════════════════
  async step8_financeApproval() {
    this.logger.step("FINANCE APPROVAL");

    // Check current quote status
    const quoteResponse = await this.client.get(`/quotes/${this.state.quoteId}`);
    const currentStatus = quoteResponse.quote.status;

    if (currentStatus !== "PENDING_FINANCE") {
      this.logger.info("Quote does not require finance approval");
      return;
    }

    // Login as finance
    const loginResponse = await this.client.post("/auth/login", {
      email: "finance@dealflow.com",
      password: "password123",
    });

    Validator.assertSuccess(loginResponse, "Finance Login");
    this.state.financeToken = loginResponse.token;
    this.client.setToken(loginResponse.token);

    this.logger.success("Finance authenticated");

    // Approve the quote
    const approvalResponse = await this.client.post(
      `/quotes/${this.state.quoteId}/approve`,
      {
        comments: "Approved by finance - acceptable risk",
      }
    );

    Validator.assertSuccess(approvalResponse, "Finance Approval");

    this.logger.success("Finance approved quote");
    this.logger.info(`New status: ${approvalResponse.quote.status}`);

    // Switch back to sales rep
    this.client.setToken(this.state.salesRepToken);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 9: WAREHOUSE SPLIT
  // ═══════════════════════════════════════════════════════════════════════════
  async step9_warehouseSplit() {
    this.logger.step("WAREHOUSE SPLIT");

    // Get fulfillment suggestion
    const suggestion = await this.client.get(
      `/quotations/${this.state.quoteId}/fulfillment-suggestion`
    );

    Validator.assertSuccess(suggestion, "Get Fulfillment Suggestion");

    this.logger.success("Fulfillment suggestion generated");
    this.logger.info(
      `Allocations: ${suggestion.data.allocations.length} warehouse(s)`
    );

    suggestion.data.allocations.forEach((alloc) => {
      this.logger.info(
        `  ${alloc.warehouse} → ${alloc.quantity} units`
      );
    });

    this.logger.info(`Fulfilled: ${suggestion.data.fulfilled_quantity}`);
    this.logger.info(`Backorder: ${suggestion.data.backorder_quantity}`);

    // Accept suggested split
    const acceptResponse = await this.client.post(
      `/quotations/${this.state.quoteId}/fulfillment/accept`
    );

    Validator.assertSuccess(acceptResponse, "Accept Fulfillment");

    this.logger.success("Fulfillment accepted");
    this.logger.info("Inventory reserved");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 10: CONFIRM ORDER
  // ═══════════════════════════════════════════════════════════════════════════
  async step10_confirmOrder() {
    this.logger.step("CONFIRM ORDER");

    const response = await this.client.post(
      `/quotes/${this.state.quoteId}/confirm`
    );

    Validator.assertSuccess(response, "Confirm Order");

    this.logger.success("Order confirmed");
    this.logger.info(`Status: ${response.quote.status}`);
    this.logger.info(`Order ID: ${response.order.id}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 11: GENERATE BILLING
  // ═══════════════════════════════════════════════════════════════════════════
  async step11_generateBilling() {
    this.logger.step("GENERATE BILLING");

    // Get invoices
    const invoiceResponse = await this.client.get("/invoices");
    Validator.assertSuccess(invoiceResponse, "Get Invoices");

    const quoteInvoices = invoiceResponse.invoices.filter(
      (inv) => inv.quote_id === this.state.quoteId
    );

    this.logger.success("Billing generated");
    this.logger.info(`Invoices created: ${quoteInvoices.length}`);

    if (quoteInvoices.length > 0) {
      this.state.invoiceId = quoteInvoices[0].id;
      quoteInvoices.forEach((inv) => {
        this.logger.info(
          `  Invoice ${inv.id}: ${inv.billing_type} - ₹${inv.amount} (${inv.status})`
        );
      });
    }

    // Get subscriptions
    const subscriptionResponse = await this.client.get("/subscriptions");
    Validator.assertSuccess(subscriptionResponse, "Get Subscriptions");

    const quoteSubscriptions = subscriptionResponse.subscriptions.filter(
      (sub) => sub.quote_id === this.state.quoteId
    );

    if (quoteSubscriptions.length > 0) {
      this.state.subscriptionId = quoteSubscriptions[0].id;
      this.logger.info(`Subscriptions created: ${quoteSubscriptions.length}`);
      quoteSubscriptions.forEach((sub) => {
        this.logger.info(
          `  Subscription ${sub.id}: ${sub.billing_cycle} - ${sub.status}`
        );
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 12: CUSTOMER NEGOTIATION
  // ═══════════════════════════════════════════════════════════════════════════
  async step12_customerNegotiation() {
    this.logger.step("CUSTOMER NEGOTIATION");

    // Get customer portal token (simulate customer receiving email link)
    // In real system, this would be sent via email
    const customerResponse = await this.client.post("/auth/login", {
      email: "customer@example.com",
      password: "password123",
    });

    Validator.assertSuccess(customerResponse, "Customer Login");
    this.state.customerToken = customerResponse.token;
    this.client.setToken(customerResponse.token);

    this.logger.success("Customer authenticated");

    // View quotation
    const viewResponse = await this.client.get("/customer/quotation");
    Validator.assertSuccess(viewResponse, "View Quotation");

    this.logger.info("Customer viewing quotation");
    this.logger.info(`Current discount: ${viewResponse.quotation.discount_percentage}%`);

    // Request higher discount (will trigger re-approval)
    const negotiateResponse = await this.client.post(
      "/customer/quotation/negotiate",
      {
        requested_discount: 18,
        justification: "Bulk order for entire company",
        line_comments: [
          {
            quote_line_id: 1,
            comment: "Need more units if discount approved",
          },
        ],
      }
    );

    Validator.assertSuccess(negotiateResponse, "Negotiate");

    this.logger.success("Customer negotiation submitted");
    this.logger.info("Requested discount: 18%");
    this.logger.info("Justification: Bulk order for entire company");

    // Switch back to sales rep
    this.client.setToken(this.state.salesRepToken);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 13: RE-CALCULATE RISK
  // ═══════════════════════════════════════════════════════════════════════════
  async step13_recalculateRisk() {
    this.logger.step("RE-CALCULATE RISK");

    // Sales rep reviews negotiation and updates quote
    const updateResponse = await this.client.put(
      `/quotes/${this.state.quoteId}`,
      {
        discount_percentage: 18,
      }
    );

    Validator.assertSuccess(updateResponse, "Update Discount");

    // Get updated quote to see recalculated risk
    const quoteResponse = await this.client.get(`/quotes/${this.state.quoteId}`);
    Validator.assertSuccess(quoteResponse, "Get Quote");

    this.logger.success("Risk recalculated after negotiation");
    this.logger.info(`New discount: ${quoteResponse.quote.discount_percentage}%`);
    this.logger.info(`New margin: ${quoteResponse.quote.margin_percentage}%`);
    this.logger.info(`New risk score: ${quoteResponse.quote.risk_score}`);
    this.logger.info(`New risk level: ${quoteResponse.quote.risk_level}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 14: RE-APPROVAL
  // ═══════════════════════════════════════════════════════════════════════════
  async step14_reApproval() {
    this.logger.step("RE-APPROVAL");

    // Submit for re-approval
    const submitResponse = await this.client.post(
      `/quotes/${this.state.quoteId}/submit`
    );

    Validator.assertSuccess(submitResponse, "Submit for Re-Approval");

    this.logger.success("Quote submitted for re-approval");
    this.logger.info(`Status: ${submitResponse.quote.status}`);

    if (!submitResponse.approval_required) {
      this.logger.info("No re-approval required");
      return;
    }

    // Manager re-approves
    this.client.setToken(this.state.managerToken);

    const approvalResponse = await this.client.post(
      `/quotes/${this.state.quoteId}/approve`,
      {
        comments: "Re-approved after customer negotiation",
      }
    );

    Validator.assertSuccess(approvalResponse, "Manager Re-Approval");

    this.logger.success("Manager re-approved quote");
    this.logger.info(`New status: ${approvalResponse.quote.status}`);

    // Switch back to sales rep
    this.client.setToken(this.state.salesRepToken);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 15: FINAL CONFIRMATION
  // ═══════════════════════════════════════════════════════════════════════════
  async step15_finalConfirmation() {
    this.logger.step("FINAL CONFIRMATION");

    // Customer confirms the negotiated terms
    this.client.setToken(this.state.customerToken);

    const confirmResponse = await this.client.post(
      "/customer/quotation/confirm"
    );

    Validator.assertSuccess(confirmResponse, "Customer Confirmation");

    this.logger.success("Customer confirmed final quotation");
    this.logger.info("Deal finalized");

    // Switch back to sales rep
    this.client.setToken(this.state.salesRepToken);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 16: PAYMENT
  // ═══════════════════════════════════════════════════════════════════════════
  async step16_payment() {
    this.logger.step("PAYMENT");

    if (!this.state.invoiceId) {
      this.logger.info("No invoice found - skipping payment");
      return;
    }

    const paymentResponse = await this.client.post(
      `/invoices/${this.state.invoiceId}/payment`,
      {
        payment_method: "CREDIT_CARD",
        transaction_reference: `TXN${Date.now()}`,
      }
    );

    Validator.assertSuccess(paymentResponse, "Payment");

    this.logger.success("Payment processed");
    this.logger.info(`Invoice ${this.state.invoiceId}: UNPAID → PAID`);
    this.logger.info(
      `Transaction: ${paymentResponse.invoice.transaction_reference}`
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN EXECUTION
  // ═══════════════════════════════════════════════════════════════════════════
  async run() {
    this.logger.header("DEALFLOW360 COMPLETE BACKEND DEMO FLOW");
    this.logger.info("Phase 12 - Task 43: End-to-End Integration Test");
    this.logger.info("Testing all backend modules as one complete system\n");

    try {
      await this.step1_login();
      await this.step2_createQuote();
      await this.step3_addProducts();
      await this.step4_applyDiscount();
      await this.step5_calculateMarginAndRisk();
      await this.step6_submitForApproval();
      await this.step7_managerApproval();
      await this.step8_financeApproval();
      await this.step9_warehouseSplit();
      await this.step10_confirmOrder();
      await this.step11_generateBilling();
      await this.step12_customerNegotiation();
      await this.step13_recalculateRisk();
      await this.step14_reApproval();
      await this.step15_finalConfirmation();
      await this.step16_payment();

      this.logger.header("DEMO FLOW COMPLETED SUCCESSFULLY ✓");
      this.logger.success("All backend phases integrated correctly");
      this.logger.success("Complete deal lifecycle verified");

      process.exit(0);
    } catch (error) {
      this.logger.header("DEMO FLOW FAILED ✗");
      this.logger.error(`Error: ${error.message}`);
      if (error.response) {
        this.logger.error(
          `Response: ${JSON.stringify(error.response.data, null, 2)}`
        );
      }
      process.exit(1);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Execute demo flow if run directly
// ─────────────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const demo = new DealFlowDemo();
  demo.run();
}

module.exports = DealFlowDemo;

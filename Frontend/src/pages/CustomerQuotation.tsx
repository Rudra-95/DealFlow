import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { apiClient } from "../api/client";
import { negotiationApi } from "../api/negotiation";
import {
    BillingLine,
    Button,
    PageHeader,
    PanelTitle,
    StatusBadge,
} from "../components/shared";
import { useToast } from "../contexts/ToastContext";
import { quotes } from "../data";
import { money } from "../utils/format";

export function CustomerQuotation() {
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  async function handleNegotiate() {
    if (!message.trim()) {
      error("Add a request before submitting the negotiation.");
      return;
    }
    setSaving(true);
    try {
      if (apiClient.baseUrl) await negotiationApi.negotiate({ message: message.trim() });
      setSubmitted(true);
      setMessage("");
      success(apiClient.baseUrl ? "Negotiation request submitted." : "Negotiation request saved in demo mode.");
    } catch {
      error("We could not submit the negotiation request. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      if (apiClient.baseUrl) await negotiationApi.confirm();
      setSubmitted(true);
      success(apiClient.baseUrl ? "Quotation confirmed." : "Quotation confirmed in demo mode.");
    } catch {
      error("We could not confirm this quotation. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Customer portal / My quotation"
        title="Your Northstar Labs quotation"
        description="Review the latest proposal and tell us what would make it work."
        action={
          <StatusBadge
            status={submitted ? "Approval required" : "Under negotiation"}
          />
        }
      />
      <div className="customer-grid">
        <section className="panel customer-quote">
          <PanelTitle
            title="Q-1048"
            text="Prepared for Olivia Carter · Valid until Oct 05, 2026"
          />
          {quotes[0].lines.map((line) => (
            <BillingLine
              key={line.id}
              name={line.product}
              detail={`${line.quantity} × ${money(line.price)} · ${line.discount}% discount`}
              amount={money(
                line.quantity * line.price * (1 - line.discount / 100),
              )}
            />
          ))}
          <div className="customer-total-row">
            <span>Total investment</span>
            <strong>$42,860</strong>
          </div>
          <div className="customer-actions">
            <Button
              onClick={handleConfirm}
              icon={<Check size={16} />}
            >
              {saving ? "Saving…" : "Confirm quotation"}
            </Button>
            <Button variant="secondary" icon={<Sparkles size={16} />} onClick={() => setMessage("I would like to request a change to this quotation.")}>
              Request changes
            </Button>
          </div>
        </section>
        <section className="panel negotiation">
          <PanelTitle
            title="Negotiation"
            text="Questions and requests about this proposal."
          />
          <div className="message customer-message">
            <strong>You</strong>
            <p>Can this be 15% instead of 10% on the Observability Suite?</p>
            <time>Today, 10:12 AM</time>
          </div>
          <div className="message rep-message">
            <strong>Maya Chen · DealFlow360</strong>
            <p>
              We can take this back to our team. I’ve flagged it for approval.
            </p>
            <time>Today, 10:24 AM</time>
          </div>
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Add a comment or request..." />
          <Button variant="secondary" onClick={handleNegotiate}>
            {saving ? "Submitting…" : "Submit negotiation request"}
          </Button>
        </section>
      </div>
    </>
  );
}

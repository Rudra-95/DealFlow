import { Boxes, Sparkles } from "lucide-react";
import { useState } from "react";
import { apiClient } from "../api/client";
import { fulfillmentApi } from "../api/fulfillment";
import {
    Back,
    Button,
    Detail,
    PageHeader,
    StatusBadge,
} from "../components/shared";
import { useToast } from "../contexts/ToastContext";

export function FulfillmentDetail() {
  const [status, setStatus] = useState<"Split pending" | "Fulfilled">("Split pending");
  const [manualOpen, setManualOpen] = useState(false);
  const [mainUnits, setMainUnits] = useState(8);
  const [eastUnits, setEastUnits] = useState(4);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  async function acceptSplit() {
    setSaving(true);
    try {
      if (apiClient.baseUrl) await fulfillmentApi.acceptSplit("ORD-8841");
      setStatus("Fulfilled");
      success(apiClient.baseUrl ? "Suggested split accepted." : "Suggested split accepted in demo mode.");
    } catch {
      error("We could not accept the suggested split. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function saveManualSplit() {
    if (mainUnits < 0 || eastUnits < 0 || mainUnits + eastUnits !== 12) {
      error("Allocate exactly 12 units across the warehouses.");
      return;
    }
    setSaving(true);
    try {
      if (apiClient.baseUrl) await fulfillmentApi.manualSplit("ORD-8841", { allocations: [{ warehouseId: "main", quantity: mainUnits }, { warehouseId: "east", quantity: eastUnits }] });
      setManualOpen(false);
      success(apiClient.baseUrl ? "Manual split saved." : "Manual split saved in demo mode.");
    } catch {
      error("We could not save the manual split. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Back to="/fulfillment" label="Back to fulfillment" />
      <PageHeader
        eyebrow="Order ORD-8841"
        title="Northstar Labs"
        description="Edge Gateway Pro · 12 units · Customer requested Sep 18"
        action={<StatusBadge status={status} />}
      />
      <div className="detail-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Suggested allocation</h2>
              <p>Optimized for earliest complete delivery.</p>
            </div>
            <Button onClick={acceptSplit}>{saving ? "Saving…" : "Accept split"}</Button>
          </div>
          {[
            ["Main Warehouse", "Chicago, IL · 8 available", "8 units", "67%"],
            ["East Depot", "Newark, NJ · 4 available", "4 units", "33%"],
          ].map((row) => (
            <div className="warehouse" key={row[0]}>
              <div className="warehouse-icon">
                <Boxes />
              </div>
              <div>
                <strong>{row[0]}</strong>
                <span>{row[1]}</span>
              </div>
              <b>{row[2]}</b>
              <div className="allocation-bar">
                <span style={{ width: row[3] }} />
              </div>
            </div>
          ))}
          <div className="callout">
            <Sparkles size={17} />
            <span>
              <strong>Why this split?</strong> Both locations have stock and
              keep the delivery inside the requested window.
            </span>
          </div>
        </section>
        <section className="panel side-details">
          <h3>Order details</h3>
          <Detail label="Order value" value="$28,800" />
          <Detail label="Shipping method" value="Priority ground" />
          <Detail label="Backorder" value="None" />
          <Button variant="secondary" onClick={() => setManualOpen((open) => !open)}>Manual override</Button>
          {manualOpen && (
            <div className="manual-split-form">
              <label>Main Warehouse<input type="number" min="0" max="12" value={mainUnits} onChange={(event) => setMainUnits(Number(event.target.value))} /></label>
              <label>East Depot<input type="number" min="0" max="12" value={eastUnits} onChange={(event) => setEastUnits(Number(event.target.value))} /></label>
              <Button variant="quiet" onClick={saveManualSplit}>{saving ? "Saving…" : "Save split"}</Button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

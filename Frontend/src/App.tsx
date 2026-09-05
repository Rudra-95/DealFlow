import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { AppShell } from './components/layout/AppShell'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AdminRules } from './pages/AdminRules'
import { ApprovalDetail } from './pages/ApprovalDetail'
import { Approvals } from './pages/Approvals'
import { CustomerMessages } from './pages/CustomerMessages'
import { CustomerProfile } from './pages/CustomerProfile'
import { CustomerQuotation } from './pages/CustomerQuotation'
import { Dashboard } from './pages/Dashboard'
import { DealHealth } from './pages/DealHealth'
import { Fulfillment } from './pages/Fulfillment'
import { FulfillmentDetail } from './pages/FulfillmentDetail'
import { InvoiceDetail } from './pages/InvoiceDetail'
import { Invoices } from './pages/Invoices'
import { Login } from './pages/Login'
import { ProductDetail } from './pages/ProductDetail'
import { Products } from './pages/Products'
import { QuotationDetail } from './pages/QuotationDetail'
import { Quotations } from './pages/Quotations'
import { Reports } from './pages/Reports'
import { SubscriptionDetail } from './pages/SubscriptionDetail'
import { Subscriptions } from './pages/Subscriptions'

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Login />} />

            {/* Protected shell */}
            <Route element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Internal routes — redirect customers away */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/quotations" element={<ProtectedRoute><Quotations /></ProtectedRoute>} />
              <Route path="/quotations/:id" element={<ProtectedRoute><QuotationDetail /></ProtectedRoute>} />
              <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
              <Route path="/approvals/:id" element={<ProtectedRoute><ApprovalDetail /></ProtectedRoute>} />
              <Route path="/fulfillment" element={<ProtectedRoute><Fulfillment /></ProtectedRoute>} />
              <Route path="/fulfillment/:id" element={<ProtectedRoute><FulfillmentDetail /></ProtectedRoute>} />
              <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
              <Route path="/subscriptions/:id" element={<ProtectedRoute><SubscriptionDetail /></ProtectedRoute>} />
              <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
              <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
              <Route path="/deal-health" element={<ProtectedRoute><DealHealth /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
              <Route path="/products/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
              <Route path="/admin/discount-rules" element={<ProtectedRoute allowedRoles={['Admin', 'Sales Manager']}><AdminRules /></ProtectedRoute>} />

              {/* Customer portal routes */}
              <Route path="/customer/quotation" element={<ProtectedRoute customerOnly><CustomerQuotation /></ProtectedRoute>} />
              <Route path="/customer/messages" element={<ProtectedRoute customerOnly><CustomerMessages /></ProtectedRoute>} />
              <Route path="/customer/profile" element={<ProtectedRoute customerOnly><CustomerProfile /></ProtectedRoute>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  )
}

export default App

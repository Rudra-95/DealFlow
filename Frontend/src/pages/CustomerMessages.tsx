import { MessageSquare, Send, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { PageHeader } from '../components/shared'

interface Message {
  id: string
  from: 'customer' | 'rep'
  name: string
  text: string
  time: string
}

const INITIAL_MESSAGES: Message[] = [
  { id: 'm-1', from: 'rep', name: 'Maya Chen · DealFlow360', text: "Hi Olivia! I've put together Q-1048 for you. It includes the Edge Gateway Pro units and the Observability Suite you requested. Let me know if you'd like any changes.", time: 'Sep 3, 10:02 AM' },
  { id: 'm-2', from: 'customer', name: 'You', text: "Thanks Maya. Can the discount on the Observability Suite be bumped to 15%? We're committing to a 12-month contract.", time: 'Sep 3, 11:15 AM' },
  { id: 'm-3', from: 'rep', name: 'Maya Chen · DealFlow360', text: "Great point. I've flagged it for regional approval. That tier usually takes about a business day. I'll update you as soon as we have a decision.", time: 'Sep 3, 11:28 AM' },
  { id: 'm-4', from: 'customer', name: 'You', text: "Perfect. Also, is there any flexibility on the delivery date? We'd ideally need everything by Oct 1.", time: 'Sep 4, 9:40 AM' },
  { id: 'm-5', from: 'rep', name: 'Maya Chen · DealFlow360', text: "I've checked with our fulfillment team. Oct 1 is achievable — I'll add that note to the quotation now.", time: 'Sep 4, 10:05 AM' },
]

export function CustomerMessages() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    setSending(true)
    await new Promise((r) => setTimeout(r, 500))
    const now = new Date()
    const timeStr = now.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
    setMessages((prev) => [
      ...prev,
      { id: `m-${Date.now()}`, from: 'customer', name: user?.name ?? 'You', text: draft.trim(), time: timeStr },
    ])
    setDraft('')
    setSending(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  return (
    <>
      <PageHeader
        eyebrow="Customer portal / Messages"
        title="Messages"
        description="Communicate directly with your DealFlow360 sales representative."
        action={
          <div className="header-actions">
            <div className="rep-online-badge">
              <span className="live-dot" />
              Maya Chen · Online
            </div>
          </div>
        }
      />

      <div className="messages-shell">
        <div className="messages-thread">
          <div className="thread-header">
            <div className="thread-avatar">MC</div>
            <div>
              <strong>Maya Chen</strong>
              <span>Sales Manager · DealFlow360</span>
            </div>
            <div className="thread-ref">
              <MessageSquare size={13} />
              Re: Q-1048
            </div>
          </div>

          <div className="messages-list">
            {messages.map((msg) => (
              <div key={msg.id} className={`msg-bubble ${msg.from === 'customer' ? 'msg-mine' : 'msg-theirs'}`}>
                <div className="msg-meta">
                  <strong>{msg.name}</strong>
                  <time>{msg.time}</time>
                </div>
                <p>{msg.text}</p>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form className="msg-compose" onSubmit={handleSend}>
            <div className="compose-field">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message to your rep..."
                rows={2}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent) } }}
              />
            </div>
            <button className="button button-primary compose-send" type="submit" disabled={!draft.trim() || sending}>
              {sending ? <Sparkles size={14} className="spin" /> : <Send size={14} />}
              {sending ? 'Sending…' : 'Send'}
            </button>
          </form>
        </div>

        {/* Context panel */}
        <aside className="messages-context">
          <div className="context-panel">
            <div className="context-panel-title">Active quotation</div>
            <div className="context-quote-ref">Q-1048</div>
            <p className="context-desc">Northstar Labs · 3 line items · $42,860</p>
            <div className="context-status">
              <span className="status status-pending"><span className="status-dot" />Under review</span>
            </div>
          </div>
          <div className="context-panel">
            <div className="context-panel-title">Your rep</div>
            <div className="rep-card">
              <div className="rep-card-avatar">MC</div>
              <div>
                <strong>Maya Chen</strong>
                <span>Sales Manager</span>
                <span>maya@dealflow360.com</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}

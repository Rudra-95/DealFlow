import { UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, PageHeader } from '../components/shared';

export function CustomerStub({ title }: { title: string }) { const navigate = useNavigate(); return <><PageHeader eyebrow="Customer portal" title={title} description="A focused view of your DealFlow360 workspace." /><section className="panel empty-panel"><div className="empty-icon"><UserRound /></div><h2>{title} is ready</h2><p>Connect the backend service to populate this view for the customer.</p><Button variant="secondary" onClick={() => navigate('/customer/quotation')}>Back to quotation</Button></section></> }

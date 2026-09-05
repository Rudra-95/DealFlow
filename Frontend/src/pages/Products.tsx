import { ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, PageHeader, StatusBadge, Table, Toolbar } from '../components/shared'
import { products } from '../data'
import { money } from '../utils/format'

export function Products() { const [search, setSearch] = useState(''); const navigate = useNavigate(); const visible = products.filter((product) => product.name.toLowerCase().includes(search.toLowerCase())); return <><PageHeader eyebrow="Insights / Products" title="Product catalog" description="The building blocks behind every quote." action={<Button icon={<Plus size={17} />}>New product</Button>} /><Toolbar search={search} setSearch={setSearch} placeholder="Search products or SKU..." /><Table><thead><tr><th>Product</th><th>Category</th><th>SKU</th><th>Price</th><th>Unit</th><th>On hand</th><th>Status</th><th /></tr></thead><tbody>{visible.map((product) => <tr key={product.id} onClick={() => navigate(`/products/${product.id}`)}><td><strong>{product.name}</strong><span className="table-muted">{product.description}</span></td><td>{product.category}</td><td className="table-muted">{product.sku}</td><td><strong>{money(product.price)}</strong></td><td>{product.unit}</td><td>{product.stock}</td><td><StatusBadge status={product.status} /></td><td><ChevronRight size={17} /></td></tr>)}</tbody></Table></> }

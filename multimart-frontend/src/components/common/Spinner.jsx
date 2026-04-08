export default function Spinner({ size = 'md', center = false }) {
  const s = size === 'sm' ? '1.2rem' : size === 'lg' ? '3rem' : '2rem'
  const el = <div className="spinner" style={{ width: s, height: s }} />
  if (center) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>{el}</div>
  return el
}

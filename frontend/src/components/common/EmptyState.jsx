export default function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      {Icon && <Icon size={48} style={{ margin: '0 auto 1rem', color: '#d1d5db', display: 'block' }} />}
      <p style={{ fontWeight: 600, color: '#374151', marginBottom: '.4rem' }}>{title}</p>
      {subtitle && <p style={{ fontSize: '.9rem', color: '#6b7280', marginBottom: '1.5rem' }}>{subtitle}</p>}
      {action}
    </div>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button className={`button button--${variant} ${className}`} {...props}>{children}</button>;
}

export function PageHeader({ eyebrow, title, description, children }) {
  return <header className="page-header">
    {eyebrow && <p className="eyebrow">{eyebrow}</p>}
    <h1>{title}</h1>
    {description && <p className="page-header__description">{description}</p>}
    {children}
  </header>;
}

export function ModuleCard({ icon, title, description, action, onClick, disabled = false }) {
  return <article className={`module-card ${disabled ? 'module-card--disabled' : ''}`}>
    <span className="module-card__icon" aria-hidden="true">{icon}</span>
    <h2>{title}</h2>
    <p>{description}</p>
    <Button onClick={onClick} disabled={disabled} variant={disabled ? 'secondary' : 'primary'}>{action}</Button>
  </article>;
}

export function AlgorithmCard({ title, description, tag, onClick }) {
  return <article className="algorithm-card">
    <span className="algorithm-card__tag">{tag}</span>
    <h2>{title}</h2>
    <p>{description}</p>
    <Button variant="ghost" onClick={onClick}>Abrir laboratorio <span>→</span></Button>
  </article>;
}

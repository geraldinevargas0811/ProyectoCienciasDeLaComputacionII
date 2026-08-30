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

export function OptionCard({ icon, title, onClick, className = '', disabled = false }) {
  const activate = () => { if (!disabled) onClick?.(); };
  const onKeyDown = (event) => {
    if (disabled) return;
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick?.(); }
  };
  return <article className={`option-card ${className} ${disabled ? 'option-card--disabled' : ''}`} role="button" tabIndex={disabled ? -1 : 0} aria-disabled={disabled} onClick={activate} onKeyDown={onKeyDown}>
    {icon && <span className="option-card__icon" aria-hidden="true">{icon}</span>}
    <h2>{title}</h2>
    <span className="option-card__arrow" aria-hidden="true">→</span>
  </article>;
}

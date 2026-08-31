// Barra de pestañas para las secciones internas de una página.
export default function Tabs({ tabs, active, onChange }) {
  return <div className="tabs" role="tablist">
    {tabs.map(([value, label]) => (
      <button
        key={value}
        type="button"
        role="tab"
        aria-selected={active === value}
        className={`tabs__btn${active === value ? ' active' : ''}`}
        onClick={() => onChange(value)}
      >{label}</button>
    ))}
  </div>;
}
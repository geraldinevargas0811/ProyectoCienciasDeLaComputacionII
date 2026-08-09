export default function Navbar({ navigate, path }) {
  return <nav className="navbar" aria-label="Navegación principal">
    <button className="brand" onClick={() => navigate('/')} aria-label="Ir al inicio"><span>CC</span><small>II</small></button>
    <div className="navbar__links">
      <button className={path.startsWith('/busquedas') ? 'active' : ''} onClick={() => navigate('/busquedas')}>Búsquedas</button>
      <button className={path === '/grafos' ? 'active' : ''} onClick={() => navigate('/grafos')}>Grafos</button>
    </div>
  </nav>;
}

import { useState } from 'react';

const internalItems = [
  ['Secuencial', '/busquedas/interna/secuencial'],
  ['Binaria', '/busquedas/interna/binaria'],
  ['Transformación por claves', '/busquedas/interna/hash'],
  ['Búsqueda por residuos', '/busquedas/interna/residuos'],
];

export default function Sidebar({ navigate, path }) {
  const [internalOpen, setInternalOpen] = useState(true);
  const [externalOpen, setExternalOpen] = useState(false);
  const visit = (to) => navigate(to);
  return <aside className="sidebar" aria-label="Navegación de laboratorios">
    <p className="sidebar__title">Búsquedas</p>
    <button className="sidebar__group" onClick={() => setInternalOpen((open) => !open)} aria-expanded={internalOpen}>Búsquedas internas <span>{internalOpen ? '⌄' : '›'}</span></button>
    {internalOpen && <div className="sidebar__items">{internalItems.map(([label, to]) => <button key={to} className={path === to ? 'active' : ''} onClick={() => visit(to)}>{label}</button>)}<span className="sidebar__pending">Árboles de Huffman · próximamente</span></div>}
    <button className="sidebar__group" onClick={() => setExternalOpen((open) => !open)} aria-expanded={externalOpen}>Búsquedas externas <span>{externalOpen ? '⌄' : '›'}</span></button>
    {externalOpen && <div className="sidebar__items"><button className={path === '/busquedas/externa' ? 'active' : ''} onClick={() => visit('/busquedas/externa')}>En desarrollo</button></div>}
    <p className="sidebar__title sidebar__title--secondary">Grafos</p>
    <button className={path === '/grafos' ? 'sidebar__link active' : 'sidebar__link'} onClick={() => visit('/grafos')}>En desarrollo</button>
  </aside>;
}

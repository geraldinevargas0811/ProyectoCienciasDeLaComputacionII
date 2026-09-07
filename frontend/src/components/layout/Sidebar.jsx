import { useState } from 'react';

const internalItems = [
  ['Búsqueda secuencial', '/busquedas/interna/secuencial'],
  ['Búsqueda binaria', '/busquedas/interna/binaria'],
  ['Transformación por claves', '/busquedas/interna/hash'],
  ['Búsqueda por residuos', '/busquedas/interna/residuos'],
  ['Árboles de Huffman', '/busquedas/interna/huffman'],
];

// Árbol del módulo Búsquedas externas.
const sequentialItems = [
  ['Usando bloques', '/busquedas/externa/secuencial/bloques'],
  ['Con índices', '/busquedas/externa/secuencial/indices'],
];

export default function Sidebar({ navigate, path }) {
  const [internalOpen, setInternalOpen] = useState(true);
  const [externalOpen, setExternalOpen] = useState(false);
  const [sequentialOpen, setSequentialOpen] = useState(false);
  const [transformationOpen, setTransformationOpen] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);
  const visit = (to) => navigate(to);
  const isActive = (to) => path === to;
  const group = (open, setOpen, label) => (
    <button className="sidebar__group" onClick={() => setOpen(!open)} aria-expanded={open}>{label} <span>{open ? '⌄' : '›'}</span></button>
  );

  return <aside className="sidebar" aria-label="Navegación de laboratorios">
    <p className="sidebar__title">Búsquedas</p>
    <button className="sidebar__group" onClick={() => setInternalOpen((open) => !open)} aria-expanded={internalOpen}>Búsquedas internas <span>{internalOpen ? '⌄' : '›'}</span></button>
    {internalOpen && <div className="sidebar__items">{internalItems.map(([label, to]) => <button key={to} className={isActive(to) ? 'active' : ''} onClick={() => visit(to)}>{label}</button>)}</div>}

    <button className="sidebar__group sidebar__group--open" onClick={() => setExternalOpen((open) => !open)} aria-expanded={externalOpen}>Búsquedas externas <span>{externalOpen ? '⌄' : '›'}</span></button>
    {externalOpen && (
      <div className="sidebar__items">
        <button className="sidebar__group" onClick={() => setSequentialOpen((open) => !open)} aria-expanded={sequentialOpen}>Búsqueda secuencial <span>{sequentialOpen ? '⌄' : '›'}</span></button>
        {sequentialOpen && <div className="sidebar__items sidebar__items--nested">{sequentialItems.map(([label, to]) => <button key={to} className={isActive(to) ? 'active' : ''} onClick={() => visit(to)}>{label}</button>)}</div>}
        <button className={isActive('/busquedas/externa/binaria') ? 'sidebar__link active' : 'sidebar__link'} onClick={() => visit('/busquedas/externa/binaria')}>Búsqueda binaria</button>
        <button className="sidebar__group" onClick={() => setTransformationOpen((open) => !open)} aria-expanded={transformationOpen}>Búsqueda por transformación de claves <span>{transformationOpen ? '⌄' : '›'}</span></button>
        {transformationOpen && <div className="sidebar__items sidebar__items--nested"><button className={isActive('/busquedas/externa/hash') ? 'active' : ''} onClick={() => visit('/busquedas/externa/hash')}>Función hash</button></div>}
        <button className="sidebar__group" onClick={() => setOtherOpen((open) => !open)} aria-expanded={otherOpen}>Otras búsquedas externas <span>{otherOpen ? '⌄' : '›'}</span></button>
        {otherOpen && <div className="sidebar__items sidebar__items--nested"><button className={isActive('/busquedas/externa/dinamicas') ? 'active' : ''} onClick={() => visit('/busquedas/externa/dinamicas')}>Búsquedas dinámicas por transformación de claves</button></div>}
      </div>
    )}
    <p className="sidebar__title sidebar__title--secondary">Grafos</p>
    <button className={isActive('/grafos') ? 'sidebar__link active' : 'sidebar__link'} onClick={() => visit('/grafos')}>En desarrollo</button>
  </aside>;
}
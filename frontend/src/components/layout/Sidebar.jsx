import { useState } from 'react';

const internalItems = [
  ['Secuencial', '/busquedas/interna/secuencial'],
  ['Binaria', '/busquedas/interna/binaria'],
  ['Transformación por claves', '/busquedas/interna/hash'],
  ['Búsqueda por residuos', '/busquedas/interna/residuos'],
];

// Árbol del módulo BÚSQUEDAS EXTERNAS con los nombres exactos indicados por el profesor.
const sequentialItems = [
  ['USANDO BLOQUES', '/busquedas/externa/secuencial/bloques'],
  ['CON ÍNDICES', '/busquedas/externa/secuencial/indices'],
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
    {internalOpen && <div className="sidebar__items">{internalItems.map(([label, to]) => <button key={to} className={isActive(to) ? 'active' : ''} onClick={() => visit(to)}>{label}</button>)}<span className="sidebar__pending">Árboles de Huffman · próximamente</span></div>}

    <button className="sidebar__group sidebar__group--open" onClick={() => setExternalOpen((open) => !open)} aria-expanded={externalOpen}>Búsquedas externas <span>{externalOpen ? '⌄' : '›'}</span></button>
    {externalOpen && (
      <div className="sidebar__items">
        <button className="sidebar__group" onClick={() => setSequentialOpen((open) => !open)} aria-expanded={sequentialOpen}>BÚSQUEDA SECUENCIAL <span>{sequentialOpen ? '⌄' : '›'}</span></button>
        {sequentialOpen && <div className="sidebar__items sidebar__items--nested">{sequentialItems.map(([label, to]) => <button key={to} className={isActive(to) ? 'active' : ''} onClick={() => visit(to)}>{label}</button>)}</div>}
        <button className={isActive('/busquedas/externa/binaria') ? 'sidebar__link active' : 'sidebar__link'} onClick={() => visit('/busquedas/externa/binaria')}>BÚSQUEDA BINARIA</button>
        <button className="sidebar__group" onClick={() => setTransformationOpen((open) => !open)} aria-expanded={transformationOpen}>BÚSQUEDA POR TRANSFORMACIÓN DE CLAVES <span>{transformationOpen ? '⌄' : '›'}</span></button>
        {transformationOpen && <div className="sidebar__items sidebar__items--nested"><button className={isActive('/busquedas/externa/hash') ? 'active' : ''} onClick={() => visit('/busquedas/externa/hash')}>FUNC HASH</button></div>}
        <button className="sidebar__group" onClick={() => setOtherOpen((open) => !open)} aria-expanded={otherOpen}>OTRAS BÚSQUEDAS EXTERNAS <span>{otherOpen ? '⌄' : '›'}</span></button>
        {otherOpen && <div className="sidebar__items sidebar__items--nested"><button className={isActive('/busquedas/externa/dinamicas') ? 'active' : ''} onClick={() => visit('/busquedas/externa/dinamicas')}>BÚSQUEDAS DINÁMICAS POR TRANSFORMACIÓN DE CLAVES</button></div>}
        <button className={isActive('/busquedas/externa/comparacion') ? 'sidebar__link active' : 'sidebar__link'} onClick={() => visit('/busquedas/externa/comparacion')}>COMPARACIÓN DE MÉTODOS</button>
      </div>
    )}

    <p className="sidebar__title sidebar__title--secondary">Grafos</p>
    <button className={isActive('/grafos') ? 'sidebar__link active' : 'sidebar__link'} onClick={() => visit('/grafos')}>En desarrollo</button>
  </aside>;
}
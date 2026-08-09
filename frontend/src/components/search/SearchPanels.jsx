import { Button } from '../common/UI';

export function ConfigurationPanel({ binary = false, hash = false }) {
  return <section className="panel configuration-panel"><h2>{hash ? 'Configurar tabla' : 'Crear estructura'}</h2>
    <div className="form-grid">
      <label>{hash ? 'Tamaño de la tabla' : 'Número de celdas'}<input type="number" defaultValue={hash ? 7 : 5} min="1" /></label>
      <label>{hash ? 'Rango de claves' : 'Rango mínimo'}<input type="number" defaultValue={hash ? 10 : 1} /></label>
      <label>{hash ? 'Función hash' : 'Rango máximo'}{hash ? <select defaultValue="modulo"><option value="modulo">Módulo</option><option>Cuadrado</option><option>Truncamiento</option><option>Conversión de bases</option></select> : <input type="number" defaultValue="99" />}</label>
      {hash ? <label>Estrategia de colisiones<select defaultValue="Exploración lineal"><option>Exploración lineal</option><option>Exploración cuadrática</option><option>Doble hash</option><option>Arreglos anidados</option></select></label> : <label>Ingreso de datos<select defaultValue="automatico"><option value="automatico">Generación automática</option><option>Ingreso manual</option></select></label>}
    </div>
    {binary && <p className="notice">Esta búsqueda requiere una estructura ordenada.</p>}
    <Button type="button">{hash ? 'Crear tabla' : 'Crear estructura'}</Button>
  </section>;
}

export function SearchInput() { return <section className="panel search-input"><h2>Realizar búsqueda</h2><div><label>Clave a buscar<input type="number" placeholder="Ej. 47" /></label><Button type="button">Buscar</Button></div></section>; }

export function VisualizationPanel({ hash = false }) { return <section className="panel visualization"><h2>{hash ? 'Colisiones y resolución' : 'Visualización del algoritmo'}</h2><div className="visualization__placeholder"><span>◌</span><p>{hash ? 'Aquí se mostrarán las colisiones y sus pasos de resolución.' : 'Aquí se mostrarán la celda actual, comparaciones y pasos de ejecución.'}</p><small>Área preparada para la animación</small></div></section>; }

export function ResultPanel() { return <section className="panel result-panel"><h2>Resultado</h2><div className="result-grid"><p><span>Resultado</span><strong>Demostración</strong></p><p><span>Posición</span><strong>3</strong></p><p><span>Comparaciones</span><strong>4</strong></p><p><span>Complejidad</span><strong>O(n)</strong></p></div><small>Datos demostrativos; el algoritmo se integrará posteriormente.</small></section>; }

import { OptionCard, PageHeader } from '../../../../components/common/UI';

// Menú principal: BÚSQUEDAS EXTERNAS.
// Los nombres de las secciones son exactamente los indicados por el profesor.
export default function ExternalPage({ navigate }) {
  return (
    <>
      <PageHeader title="BÚSQUEDAS EXTERNAS" description="Aplicación que explica y permite visualizar los métodos de búsqueda sobre archivos almacenados externamente: registros, bloques, índices, cubetas, accesos a disco, comparaciones y desbordamientos." />
      <section className="option-grid option-grid--four">
        <OptionCard icon="▤" title="BÚSQUEDA SECUENCIAL" onClick={() => navigate('/busquedas/externa/secuencial')} />
        <OptionCard icon="⇆" title="BÚSQUEDA BINARIA" onClick={() => navigate('/busquedas/externa/binaria')} />
        <OptionCard icon="⌗" title="BÚSQUEDA POR TRANSFORMACIÓN DE CLAVES" onClick={() => navigate('/busquedas/externa/hash')} />
        <OptionCard icon="▦" title="OTRAS BÚSQUEDAS EXTERNAS" onClick={() => navigate('/busquedas/externa/dinamicas')} />
      </section>
      <section className="option-grid" style={{ marginTop: 22 }}>
        <OptionCard icon="⚖" title="COMPARACIÓN DE MÉTODOS" onClick={() => navigate('/busquedas/externa/comparacion')} />
      </section>
    </>
  );
}
import { OptionCard, PageHeader } from '../../../../components/common/UI';

// Menú principal: Búsquedas externas.
export default function ExternalPage({ navigate }) {
  return (
    <>
      <PageHeader title="Búsquedas externas" />
      <section className="option-grid option-grid--four">
        <OptionCard icon="▤" title="Búsqueda secuencial" onClick={() => navigate('/busquedas/externa/secuencial')} />
        <OptionCard icon="⇆" title="Búsqueda binaria" onClick={() => navigate('/busquedas/externa/binaria')} />
        <OptionCard icon="⌗" title="Búsqueda por transformación de claves" onClick={() => navigate('/busquedas/externa/hash')} />
        <OptionCard icon="▦" title="Otras búsquedas externas" onClick={() => navigate('/busquedas/externa/dinamicas')} />
      </section>
    </>
  );
}
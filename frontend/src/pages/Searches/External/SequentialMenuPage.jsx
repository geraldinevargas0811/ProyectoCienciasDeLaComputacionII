import { OptionCard, PageHeader } from '../../../components/common/UI';

// Submenú: Búsqueda secuencial → usando bloques / con índices.
export default function SequentialMenuPage({ navigate }) {
  return (
    <>
      <PageHeader title="Búsqueda secuencial" />
      <section className="option-grid option-grid--two">
        <OptionCard icon="▧" title="Usando bloques" onClick={() => navigate('/busquedas/externa/secuencial/bloques')} />
        <OptionCard icon="▥" title="Con índices" onClick={() => navigate('/busquedas/externa/secuencial/indices')} />
      </section>
    </>
  );
}
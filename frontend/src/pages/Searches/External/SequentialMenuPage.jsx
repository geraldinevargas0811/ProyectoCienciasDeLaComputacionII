import { OptionCard, PageHeader } from '../../../components/common/UI';

// Submenú: BÚSQUEDA SECUENCIAL → USANDO BLOQUES / CON ÍNDICES.
export default function SequentialMenuPage({ navigate }) {
  return (
    <>
      <PageHeader title="BÚSQUEDA SECUENCIAL" description="Búsqueda secuencial sobre un archivo almacenado externamente. Elige cómo se organiza el archivo para la búsqueda." />
      <section className="option-grid option-grid--two">
        <OptionCard icon="▧" title="USANDO BLOQUES" onClick={() => navigate('/busquedas/externa/secuencial/bloques')} />
        <OptionCard icon="▥" title="CON ÍNDICES" onClick={() => navigate('/busquedas/externa/secuencial/indices')} />
      </section>
    </>
  );
}
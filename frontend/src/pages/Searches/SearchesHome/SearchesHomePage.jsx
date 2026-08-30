import { OptionCard, PageHeader } from '../../../components/common/UI';

export default function SearchesHomePage({ navigate }) {
  return (
    <>
      <PageHeader title="Búsquedas" />
      <section className="option-grid">
        <OptionCard icon="▤" title="Búsquedas internas" onClick={() => navigate('/busquedas/interna')} />
        <OptionCard icon="▥" title="Búsquedas externas" onClick={() => navigate('/busquedas/externa')} />
      </section>
    </>
  );
}
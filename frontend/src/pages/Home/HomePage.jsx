import { OptionCard, PageHeader } from '../../components/common/UI';

export default function HomePage({ navigate }) {
  return (
    <div className="home-page">
      <PageHeader title="Ciencias de la Computación II" />
      <section className="option-grid">
        <OptionCard icon="⌕" title="Búsquedas" onClick={() => navigate('/busquedas')} />
        <OptionCard icon="◇" title="Grafos" onClick={() => navigate('/grafos')} />
      </section>
    </div>
  );
}
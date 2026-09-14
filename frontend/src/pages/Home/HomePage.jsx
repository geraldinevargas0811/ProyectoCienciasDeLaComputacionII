import { OptionCard, PageHeader } from '../../components/common/UI';

export default function HomePage({ navigate }) {
  return (
    <div className="home-page">
      <PageHeader title="Ciencias de la Computación II" />
      <section className="option-grid option-grid--home">
        <OptionCard className="option-card--home" icon="⌕" title="Búsquedas" onClick={() => navigate('/busquedas')} />
        <OptionCard className="option-card--home" icon="◇" title="Grafos" onClick={() => navigate('/grafos')} />
      </section>
    </div>
  );
}
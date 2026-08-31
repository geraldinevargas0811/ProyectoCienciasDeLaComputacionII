import { OptionCard, PageHeader } from '../../../components/common/UI';

const algorithms = [
  ['→', 'Búsqueda secuencial', '/busquedas/interna/secuencial'],
  ['⇆', 'Búsqueda binaria', '/busquedas/interna/binaria'],
  ['▦', 'Transformación por claves', '/busquedas/interna/hash'],
  ['⌗', 'Búsqueda por residuos', '/busquedas/interna/residuos'],
  ['⊞', 'Árboles de Huffman', '/busquedas/interna/huffman'],
];

export default function InternalPage({ navigate }) {
  return (
    <>
      <PageHeader title="Búsquedas internas" />
      <section className="option-grid option-grid--four">
        {algorithms.map(([icon, title, to]) => (
          <OptionCard key={to} icon={icon} title={title} onClick={() => navigate(to)} />
        ))}
      </section>
    </>
  );
}
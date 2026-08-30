import { useEffect, useState } from 'react';
import Layout from './components/layout/Layout';
import HomePage from './pages/Home/HomePage';
import SearchesHomePage from './pages/Searches/SearchesHome/SearchesHomePage';
import InternalPage from './pages/Searches/Internal/InternalPage';
import AlgorithmPage from './pages/Searches/Internal/AlgorithmPage';
import HashPage from './pages/Searches/Internal/HashPage';
import ResiduesPage from './pages/Searches/Internal/ResiduesPage';
import ExternalPage from './pages/Searches/SearchesHome/External/ExternalPage';
import GraphsPage from './pages/Graphs/GraphsPage';

// Cada algoritmo se envuelve en un componente propio para que React memte/desmonte
// instancias independientes al navegar. Esto evita que Secuencial y Binaria compartan
// estado (nunca deben ocupar el mismo slot del árbol). La lógica interna es la misma.
function SequentialAlgorithmPage() { return <AlgorithmPage type="sequential" />; }
function BinaryAlgorithmPage() { return <AlgorithmPage type="binary" />; }

function resolvePage(path, navigate) {
  if (path === '/') return <HomePage navigate={navigate} />;
  if (path === '/busquedas') return <SearchesHomePage navigate={navigate} />;
  if (path === '/busquedas/interna') return <InternalPage navigate={navigate} />;
  if (path === '/busquedas/interna/secuencial') return <SequentialAlgorithmPage />;
  if (path === '/busquedas/interna/binaria') return <BinaryAlgorithmPage />;
  if (path === '/busquedas/interna/hash') return <HashPage />;
  if (path === '/busquedas/interna/residuos') return <ResiduesPage />;
  if (path === '/busquedas/externa') return <ExternalPage />;
  if (path === '/grafos') return <GraphsPage />;
  return <HomePage navigate={navigate} />;
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const navigate = (to) => { window.history.pushState({}, '', to); setPath(to); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  useEffect(() => { const onPop = () => setPath(window.location.pathname); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop); }, []);
  return <Layout navigate={navigate} path={path}>{resolvePage(path, navigate)}</Layout>;
}

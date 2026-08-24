import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ children, navigate, path }) {
  return <><Navbar navigate={navigate} path={path} /><div className="app-shell"><Sidebar navigate={navigate} path={path} /><main className="main-content">{children}</main></div><footer>Laboratorio de algoritmos · Ciencias de la Computación II</footer></>;
}

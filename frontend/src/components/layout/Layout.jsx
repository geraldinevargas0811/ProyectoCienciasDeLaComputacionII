import Navbar from './Navbar';

export default function Layout({ children, navigate, path }) {
  return <><Navbar navigate={navigate} path={path} /><main className="main-content">{children}</main><footer>Laboratorio de algoritmos · Ciencias de la Computación II</footer></>;
}

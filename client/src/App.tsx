import { Landing } from './pages';
import './App.css';
import { Routes, Route } from "react-router-dom"

/**
 * Componente raiz da aplicação
 * Ponto de entrada principal para roteamento e providers globais
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
    </Routes>
  );
}

export default App;

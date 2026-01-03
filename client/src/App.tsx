import { Landing, GetStarted, Login, Register, ForgotPassword } from './pages';
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
      <Route path="/comecar" element={<GetStarted />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Register />} />
      <Route path="/esqueci-senha" element={<ForgotPassword />} />
    </Routes>
  );
}

export default App;

import {
  Landing,
  GetStarted,
  RepoAnalysis,
  Login,
  Register,
  ForgotPassword,
  Profile,
  Settings,
  SavedRepos,
} from "./pages";
import "./App.css";
import { Routes, Route } from "react-router-dom";

/**
 * Componente raiz da aplicação
 * Ponto de entrada principal para roteamento e providers globais
 */
function App() {
  return (
    <Routes>
      <Route path='/' element={<Landing />} />
      <Route path='/comecar' element={<GetStarted />} />
      <Route path='/analise' element={<RepoAnalysis />} />
      <Route path='/login' element={<Login />} />
      <Route path='/register' element={<Register />} />
      <Route path='/cadastro' element={<Register />} />
      <Route path='/esqueci-senha' element={<ForgotPassword />} />
      <Route path='/perfil' element={<Profile />} />
      <Route path='/configuracoes' element={<Settings />} />
      <Route path='/meus-repos' element={<SavedRepos />} />
    </Routes>
  );
}

export default App;

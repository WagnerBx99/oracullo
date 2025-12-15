import Dashboard from './pages/Dashboard';
import Integracoes from './pages/Integracoes';
import Configuracoes from './pages/Configuracoes';
import Relatorios from './pages/Relatorios';
import Formularios from './pages/Formularios';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Integracoes": Integracoes,
    "Configuracoes": Configuracoes,
    "Relatorios": Relatorios,
    "Formularios": Formularios,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
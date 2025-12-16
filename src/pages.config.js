import Dashboard from './pages/Dashboard';
import Integracoes from './pages/Integracoes';
import Configuracoes from './pages/Configuracoes';
import Relatorios from './pages/Relatorios';
import Formularios from './pages/Formularios';
import Manipulaveis from './pages/Manipulaveis';
import BancoDados from './pages/BancoDados';
import GestaoPrecos from './pages/GestaoPrecos';
import LogAtividades from './pages/LogAtividades';
import Diretoria from './pages/Diretoria';
import Comercial from './pages/Comercial';
import Operacional from './pages/Operacional';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Integracoes": Integracoes,
    "Configuracoes": Configuracoes,
    "Relatorios": Relatorios,
    "Formularios": Formularios,
    "Manipulaveis": Manipulaveis,
    "BancoDados": BancoDados,
    "GestaoPrecos": GestaoPrecos,
    "LogAtividades": LogAtividades,
    "Diretoria": Diretoria,
    "Comercial": Comercial,
    "Operacional": Operacional,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
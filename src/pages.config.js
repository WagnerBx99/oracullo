import BancoDados from './pages/BancoDados';
import Comercial from './pages/Comercial';
import Configuracoes from './pages/Configuracoes';
import Dashboard from './pages/Dashboard';
import Diretoria from './pages/Diretoria';
import Formularios from './pages/Formularios';
import GestaoPrecos from './pages/GestaoPrecos';
import Integracoes from './pages/Integracoes';
import LogAtividades from './pages/LogAtividades';
import Manipulaveis from './pages/Manipulaveis';
import ManualUsuario from './pages/ManualUsuario';
import Operacional from './pages/Operacional';
import Relatorios from './pages/Relatorios';
import RelatoriosDesenvolvimento from './pages/RelatoriosDesenvolvimento';
import FaturamentoEstado from './pages/FaturamentoEstado';
import __Layout from './Layout.jsx';

export const PAGES = {
    "BancoDados": BancoDados,
    "Comercial": Comercial,
    "Configuracoes": Configuracoes,
    "Dashboard": Dashboard,
    "Diretoria": Diretoria,
    "Formularios": Formularios,
    "GestaoPrecos": GestaoPrecos,
    "Integracoes": Integracoes,
    "LogAtividades": LogAtividades,
    "Manipulaveis": Manipulaveis,
    "ManualUsuario": ManualUsuario,
    "Operacional": Operacional,
    "RelatoriosDesenvolvimento": RelatoriosDesenvolvimento,
    "faturamento_estado": FaturamentoEstado,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};

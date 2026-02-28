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
import FaturamentoDiario from './pages/FaturamentoDiario';
import ConsolidadoAnual from './pages/ConsolidadoAnual';
import FechamentoComissoes from './pages/FechamentoComissoes';
import QuadroComissoes from './pages/QuadroComissoes';
import ComissoesGerentes from './pages/ComissoesGerentes';
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
    "faturamento_diario": FaturamentoDiario,
    "consolidado_anual": ConsolidadoAnual,
    "FechamentoComissoes": FechamentoComissoes,
    "QuadroComissoes": QuadroComissoes,
    "ComissoesGerentes": ComissoesGerentes,
}
export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};

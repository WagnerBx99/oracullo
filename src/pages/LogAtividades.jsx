import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Activity,
  Search,
  FileText,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  LogIn,
  Calendar
} from 'lucide-react';
import { motion } from "framer-motion";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const tipoIcons = {
  criacao: <FileText className="w-4 h-4" />,
  edicao: <Edit className="w-4 h-4" />,
  exclusao: <Trash2 className="w-4 h-4" />,
  visualizacao: <Eye className="w-4 h-4" />,
  exportacao: <Download className="w-4 h-4" />,
  sincronizacao: <RefreshCw className="w-4 h-4" />,
  login: <LogIn className="w-4 h-4" />
};

const tipoColors = {
  criacao: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  edicao: 'bg-blue-100 text-blue-700 border-blue-200',
  exclusao: 'bg-red-100 text-red-700 border-red-200',
  visualizacao: 'bg-purple-100 text-purple-700 border-purple-200',
  exportacao: 'bg-orange-100 text-orange-700 border-orange-200',
  sincronizacao: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  login: 'bg-slate-100 text-slate-700 border-slate-200'
};

export default function LogAtividades() {
  const [filtroModulo, setFiltroModulo] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");

  // Dados removidos (Base44 removido)
  const dados = [];
  const logs = [];
  /*
  const { data: logs = [] } = useQuery({
    queryKey: ['logs'],
    queryFn: async () => [],
    initialData: []
  });
  */

  const filteredLogs = logs.filter(log => {
    const matchModulo = filtroModulo === "todos" || log.modulo === filtroModulo;
    const matchTipo = filtroTipo === "todos" || log.tipo === filtroTipo;
    const matchSearch = !searchTerm || 
      log.usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.acao?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchModulo && matchTipo && matchSearch;
  });

  const getInitials = (email) => {
    return email?.split('@')[0].substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-slate-800">Log de Atividades</h1>
        <p className="text-slate-500 mt-1">Rastreabilidade completa das ações no sistema</p>
      </motion.div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total de Ações</p>
                <p className="text-2xl font-bold text-blue-600">{logs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Criações</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {logs.filter(l => l.tipo === 'criacao').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Edit className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Edições</p>
                <p className="text-2xl font-bold text-purple-600">
                  {logs.filter(l => l.tipo === 'edicao').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Hoje</p>
                <p className="text-2xl font-bold text-orange-600">
                  {logs.filter(l => {
                    const hoje = new Date().toDateString();
                    const logDate = new Date(l.created_date).toDateString();
                    return hoje === logDate;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Tabela */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Histórico de Atividades
            </CardTitle>
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar por usuário ou ação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filtroModulo} onValueChange={setFiltroModulo}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Módulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="integracoes">Integrações</SelectItem>
                  <SelectItem value="produtos">Produtos</SelectItem>
                  <SelectItem value="relatorios">Relatórios</SelectItem>
                  <SelectItem value="configuracoes">Configurações</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="criacao">Criação</SelectItem>
                  <SelectItem value="edicao">Edição</SelectItem>
                  <SelectItem value="exclusao">Exclusão</SelectItem>
                  <SelectItem value="exportacao">Exportação</SelectItem>
                  <SelectItem value="sincronizacao">Sincronização</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log, index) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="hover:bg-slate-50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                          {getInitials(log.usuario)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-slate-700">
                        {log.usuario?.split('@')[0]}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm text-slate-600 truncate">{log.acao}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-xs">
                      {log.modulo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${tipoColors[log.tipo]} flex items-center gap-1 w-fit`}
                    >
                      {tipoIcons[log.tipo]}
                      <span className="capitalize">{log.tipo}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {log.created_date && format(new Date(log.created_date), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-sm font-mono text-slate-500">
                    {log.ip_address || '-'}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              Nenhuma atividade encontrada com os filtros aplicados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Database, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  ArrowRight,
  Clock
} from 'lucide-react';
import { motion } from "framer-motion";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const sistemasConfig = {
  omie: { nome: 'OMIE', tipo: 'ERP', cor: 'emerald' },
  wk: { nome: 'WK Radar', tipo: 'ERP', cor: 'blue' },
  mercos: { nome: 'Mercos', tipo: 'CRM', cor: 'purple' },
  clic: { nome: 'Clic', tipo: 'CRM', cor: 'pink' }
};

export default function ConsolidacaoSistemas({ integracoes, onSincronizar }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'conectado': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'sincronizando': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'erro': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'conectado': return <CheckCircle2 className="w-4 h-4" />;
      case 'sincronizando': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'erro': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const totalConectados = integracoes.filter(i => i.status === 'conectado').length;
  const ultimaSincronizacao = integracoes
    .filter(i => i.ultima_sincronizacao)
    .sort((a, b) => new Date(b.ultima_sincronizacao) - new Date(a.ultima_sincronizacao))[0];

  return (
    <Card className="border-0 shadow-lg bg-card">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Consolidação de Dados</CardTitle>
              <p className="text-sm text-muted-foreground">
                {totalConectados} de {Object.keys(sistemasConfig).length} sistemas integrados
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={onSincronizar}
          >
            <RefreshCw className="w-4 h-4" />
            Sincronizar Todos
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Status Resumido */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <p className="text-2xl font-bold text-emerald-600">{totalConectados}</p>
            <p className="text-sm text-muted-foreground">Conectados</p>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-2xl font-bold text-blue-600">0</p>
            <p className="text-sm text-muted-foreground">Sincronizando</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold text-foreground">
              {Object.keys(sistemasConfig).length - totalConectados}
            </p>
            <p className="text-sm text-muted-foreground">Desconectados</p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <p className="text-sm font-medium text-foreground">Última Sinc.</p>
            <p className="text-xs text-muted-foreground">
              {ultimaSincronizacao?.ultima_sincronizacao 
                ? format(new Date(ultimaSincronizacao.ultima_sincronizacao), "dd/MM HH:mm", { locale: ptBR })
                : 'Nunca'
              }
            </p>
          </div>
        </div>

        {/* Fluxo de Integração */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground mb-4">Fluxo de Integração</h3>
          
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Sistemas Origem */}
            <div className="flex-1 space-y-3">
              {Object.entries(sistemasConfig).map(([key, config]) => {
                const integracao = integracoes.find(i => i.sistema === key);
                const isConectado = integracao?.status === 'conectado';

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      isConectado 
                        ? 'bg-card border-emerald-200 shadow-sm' 
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isConectado ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                      <div>
                        <p className="font-semibold text-foreground">{config.nome}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {config.tipo}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${getStatusColor(integracao?.status || 'desconectado')} flex items-center gap-1`}>
                      {getStatusIcon(integracao?.status || 'desconectado')}
                      <span className="capitalize text-xs">
                        {integracao?.status || 'Desconectado'}
                      </span>
                    </Badge>
                  </motion.div>
                );
              })}
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-2">
              <ArrowRight className="w-8 h-8 text-slate-300 rotate-90 md:rotate-0" />
              <span className="text-xs text-slate-400 font-medium">API REST</span>
            </div>

            {/* Oráculo Central */}
            <div className="flex-shrink-0">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-32 h-32 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center shadow-2xl"
              >
                <Database className="w-10 h-10 text-blue-400 mb-2" />
                <span className="text-white font-bold text-sm">ORÁCULO</span>
                <span className="text-slate-400 text-xs">Base Central</span>
              </motion.div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-2">
              <ArrowRight className="w-8 h-8 text-slate-300 rotate-90 md:rotate-0" />
              <span className="text-xs text-slate-400 font-medium">Dashboards</span>
            </div>

            {/* Saídas */}
            <div className="flex-1 space-y-2">
              {['Visão Diretoria', 'KPIs Comerciais', 'Indicadores Operacionais', 'Relatórios'].map((item, i) => (
                <div key={i} className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <p className="text-sm font-medium text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
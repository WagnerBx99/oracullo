import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, ArrowRight, Server, HardDrive } from 'lucide-react';
import { motion } from "framer-motion";

const databases = [
  {
    id: 1,
    nome: 'DB Transacional',
    descricao: 'Dados operacionais em tempo real',
    tabelas: ['Produtos', 'Vendas', 'Estoque', 'Pedidos'],
    cor: 'from-emerald-500 to-emerald-600',
    icon: Database
  },
  {
    id: 2,
    nome: 'DB Analítico',
    descricao: 'Métricas e indicadores consolidados',
    tabelas: ['KPIs', 'Relatórios', 'Dashboards', 'Tendências'],
    cor: 'from-[#135670] to-[#1a7a9e]',
    icon: HardDrive
  },
  {
    id: 3,
    nome: 'DB Gestão',
    descricao: 'Configurações e controle de acesso',
    tabelas: ['Usuários', 'Permissões', 'Logs', 'Configurações'],
    cor: 'from-[#ff5c00] to-orange-600',
    icon: Server
  }
];

export default function DatabaseArchitecture() {
  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-muted/20">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex items-center gap-3">
          <Database className="w-6 h-6 text-primary" />
          Arquitetura de Dados - 3 Bancos Especializados
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Estrutura otimizada com separação lógica para melhor desempenho e escalabilidade
        </p>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {databases.map((db, index) => {
            const Icon = db.icon;
            return (
              <motion.div
                key={db.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-2 border-border hover:border-primary transition-all h-full bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${db.cor} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        BD {db.id}
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {db.nome}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {db.descricao}
                    </p>
                    
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Principais Entidades:
                      </p>
                      {db.tabelas.map((tabela) => (
                        <div 
                          key={tabela}
                          className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                        >
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-sm text-foreground">{tabela}</span>
                        </div>
                      ))}
                    </div>

                    {/* Performance Indicator */}
                    <div className="mt-6 pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Status</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-emerald-600 font-medium">Operacional</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Integration Flow */}
        <div className="mt-8 p-6 bg-gradient-to-r from-muted/30 to-muted/10 rounded-2xl border border-border">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-xl border border-border">
              <Database className="w-5 h-5 text-emerald-600" />
              <span className="font-medium text-sm text-foreground">DB Transacional</span>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
            <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-xl border border-border">
              <HardDrive className="w-5 h-5 text-[#135670]" />
              <span className="font-medium text-sm text-foreground">DB Analítico</span>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
            <div className="flex items-center gap-3 bg-gradient-to-r from-[#135670] to-[#ff5c00] text-white px-4 py-2 rounded-xl shadow-lg">
              <Server className="w-5 h-5" />
              <span className="font-medium text-sm">Dashboards ORACULLO</span>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Sincronização automática e processamento em camadas para máxima performance
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
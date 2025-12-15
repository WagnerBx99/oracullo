import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Database, 
  Link2, 
  FileInput, 
  ArrowRight,
  Server,
  RefreshCw
} from 'lucide-react';
import { motion } from "framer-motion";

const modulos = [
  {
    id: 'integracoes',
    titulo: 'Integrações API',
    descricao: 'Conecte-se com CRMs, ERPs e outros sistemas externos',
    icon: Link2,
    pagina: 'Integracoes',
    cor: 'blue',
    itens: [
      { label: "CRM's", sub: ['Mercos', 'Clic'] },
      { label: "ERP's", sub: ['Omie', 'WK'] },
      { label: "OP", sub: ['Sults'] }
    ]
  },
  {
    id: 'formularios',
    titulo: 'Formulários',
    descricao: 'Cadastre produtos e dados manualmente no sistema',
    icon: FileInput,
    pagina: 'Formularios',
    cor: 'purple',
    itens: [
      { label: "Cadastro de Produtos" },
      { label: "Importação de Dados" },
      { label: "Entrada Manual" }
    ]
  }
];

export default function BancoDados() {
  const corClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-emerald-500 to-emerald-600'
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-slate-800">Banco de Dados</h1>
        <p className="text-slate-500 mt-1">Gerencie as fontes de dados do sistema</p>
      </motion.div>

      {/* Status Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                <Server className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Sistema Oráculo</h2>
                <p className="text-slate-300">Central de dados e integrações</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-400">3</p>
                <p className="text-sm text-slate-400">Integrações Ativas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-400">150</p>
                <p className="text-sm text-slate-400">Produtos Sincronizados</p>
              </div>
              <Button variant="secondary" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Sincronizar Tudo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modulos.map((modulo, index) => (
          <motion.div
            key={modulo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${corClasses[modulo.cor]} flex items-center justify-center`}>
                    <modulo.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <CardTitle className="mt-4 text-xl">{modulo.titulo}</CardTitle>
                <CardDescription>{modulo.descricao}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {modulo.itens.map((item, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg">
                      <p className="font-medium text-slate-700">{item.label}</p>
                      {item.sub && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.sub.map((s, j) => (
                            <span key={j} className="text-xs bg-white px-2 py-1 rounded-md text-slate-500 border">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Link to={createPageUrl(modulo.pagina)}>
                  <Button className="w-full gap-2 bg-slate-800 hover:bg-slate-700 mt-4">
                    Acessar
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Diagrama Simplificado */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-slate-50/50">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Fluxo de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            {/* Fontes */}
            <div className="flex flex-col gap-2 items-center">
              <div className="text-sm font-medium text-slate-500 mb-2">FONTES</div>
              <div className="flex flex-wrap justify-center gap-2">
                {['Mercos', 'Clic', 'Omie', 'WK', 'Sults'].map((fonte) => (
                  <div key={fonte} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                    {fonte}
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <ArrowRight className="w-8 h-8 text-slate-300 rotate-90 md:rotate-0" />

            {/* Central */}
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-xl">
              <div className="text-center text-white">
                <Database className="w-8 h-8 mx-auto mb-2" />
                <span className="text-sm font-bold">ORÁCULO</span>
              </div>
            </div>

            {/* Arrow */}
            <ArrowRight className="w-8 h-8 text-slate-300 rotate-90 md:rotate-0" />

            {/* Saídas */}
            <div className="flex flex-col gap-2 items-center">
              <div className="text-sm font-medium text-slate-500 mb-2">SAÍDAS</div>
              <div className="flex flex-wrap justify-center gap-2">
                {['Dashboard', 'Relatórios', 'Exportação'].map((saida) => (
                  <div key={saida} className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
                    {saida}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
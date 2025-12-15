import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Plus, 
  Download, 
  Star,
  StarOff,
  Trash2,
  Filter,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp
} from 'lucide-react';
import { motion } from "framer-motion";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const tiposRelatorio = {
  custo_venda: { icon: BarChart3, label: 'Custo x Venda', cor: 'blue' },
  margem: { icon: TrendingUp, label: 'Margem', cor: 'green' },
  produtos: { icon: PieChart, label: 'Produtos', cor: 'purple' },
  vendas: { icon: BarChart3, label: 'Vendas', cor: 'orange' },
  personalizado: { icon: FileText, label: 'Personalizado', cor: 'slate' }
};

export default function Relatorios() {
  const queryClient = useQueryClient();
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const { data: relatorios = [], isLoading } = useQuery({
    queryKey: ['relatorios'],
    queryFn: () => base44.entities.Relatorio.list('-created_date'),
    initialData: []
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Relatorio.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['relatorios'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Relatorio.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['relatorios'] })
  });

  const toggleFavorito = (relatorio) => {
    updateMutation.mutate({
      id: relatorio.id,
      data: { favorito: !relatorio.favorito }
    });
  };

  const filteredRelatorios = relatorios.filter(r => 
    filtroTipo === "todos" || r.tipo === filtroTipo
  );

  const favoritos = filteredRelatorios.filter(r => r.favorito);
  const outros = filteredRelatorios.filter(r => !r.favorito);

  const RelatorioCard = ({ relatorio, index }) => {
    const config = tiposRelatorio[relatorio.tipo] || tiposRelatorio.personalizado;
    const Icon = config.icon;
    const corClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-emerald-500 to-emerald-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      slate: 'from-slate-500 to-slate-600'
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${corClasses[config.cor]} flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => toggleFavorito(relatorio)}
                >
                  {relatorio.favorito ? (
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ) : (
                    <StarOff className="w-4 h-4 text-slate-400" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => deleteMutation.mutate(relatorio.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">{relatorio.titulo}</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">
              {relatorio.descricao || 'Sem descrição'}
            </p>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="capitalize">
                {config.label}
              </Badge>
              <span className="text-xs text-slate-400">
                {relatorio.created_date && format(new Date(relatorio.created_date), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
            <Button variant="outline" className="w-full mt-4 gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Relatórios</h1>
          <p className="text-slate-500 mt-1">Visualize e exporte relatórios do sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {Object.entries(tiposRelatorio).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Novo Relatório
          </Button>
        </div>
      </motion.div>

      {/* Favoritos */}
      {favoritos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            Favoritos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favoritos.map((relatorio, index) => (
              <RelatorioCard key={relatorio.id} relatorio={relatorio} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Outros Relatórios */}
      {outros.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            {favoritos.length > 0 ? 'Outros Relatórios' : 'Relatórios'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {outros.map((relatorio, index) => (
              <RelatorioCard key={relatorio.id} relatorio={relatorio} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredRelatorios.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center"
        >
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            Nenhum relatório encontrado
          </h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Crie relatórios personalizados para acompanhar métricas importantes do seu negócio.
          </p>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Criar Relatório
          </Button>
        </motion.div>
      )}
    </div>
  );
}
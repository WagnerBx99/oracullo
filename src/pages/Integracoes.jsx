import React, { useState } from 'react';
import api from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Link2, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Settings2,
  Trash2,
  Database
} from 'lucide-react';
import { motion } from "framer-motion";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const sistemasConfig = {
  erp: {
    label: 'ERP',
    sistemas: [
      { id: 'omie', nome: 'OMIE', cor: 'emerald', descricao: 'Sistema ERP integrado' },
      { id: 'wk', nome: 'WK Radar', cor: 'blue', descricao: 'Sistema ERP integrado' }
    ]
  },
  crm: {
    label: 'CRM',
    sistemas: [
      { id: 'mercos', nome: 'Mercos', cor: 'purple', descricao: 'CRM comercial' },
      { id: 'clic', nome: 'Clic', cor: 'pink', descricao: 'CRM comercial' }
    ]
  }
};

export default function Integracoes() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '',
    sistema: '',
    api_url: '',
    api_key: '',
    company_token: ''
  });

  const { data: integracoes = [], isLoading } = useQuery({
    queryKey: ['integracoes'],
    queryFn: () => api.integracoes.list(),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.integracoes.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integracoes'] });
      setDialogOpen(false);
      setFormData({ nome: '', tipo: '', sistema: '', api_url: '', api_key: '', company_token: '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.integracoes.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integracoes'] })
  });

  const syncMutation = useMutation({
    mutationFn: async (integracao) => {
      if (integracao.sistema === 'mercos') {
        // Sincroniza clientes
        const clientesResult = await api.mercos.sync(integracao.id, {
          api_url: integracao.api_url,
          api_key: integracao.api_key,
          company_token: integracao.company_token,
          tipo: 'clientes'
        });
        
        // Sincroniza produtos
        const produtosResult = await api.mercos.sync(integracao.id, {
          api_url: integracao.api_url,
          api_key: integracao.api_key,
          company_token: integracao.company_token,
          tipo: 'produtos'
        });
        
        return { 
          clientes: clientesResult.data || [],
          produtos: produtosResult.data || [],
          totalClientes: clientesResult.total || 0,
          totalProdutos: produtosResult.total || 0
        };
      }
      
      if (integracao.sistema === 'omie') {
        // Sincroniza clientes
        const clientesResult = await api.omie.sync(integracao.id, {
          api_url: integracao.api_url,
          api_key: integracao.api_key,
          app_secret: integracao.company_token,
          tipo: 'clientes'
        });
        
        // Sincroniza produtos
        const produtosResult = await api.omie.sync(integracao.id, {
          api_url: integracao.api_url,
          api_key: integracao.api_key,
          app_secret: integracao.company_token,
          tipo: 'produtos'
        });
        
        // Sincroniza pedidos
        const pedidosResult = await api.omie.sync(integracao.id, {
          api_url: integracao.api_url,
          api_key: integracao.api_key,
          app_secret: integracao.company_token,
          tipo: 'pedidos'
        });
        
        return { 
          clientes: clientesResult.data || [],
          produtos: produtosResult.data || [],
          pedidos: pedidosResult.data || [],
          totalClientes: clientesResult.total || 0,
          totalProdutos: produtosResult.total || 0,
          totalPedidos: pedidosResult.total || 0
        };
      }
      
      throw new Error('Sistema não suportado ainda');
    },
    onSuccess: (data, integracao) => {
      queryClient.invalidateQueries({ queryKey: ['integracoes'] });
      console.log('Sincronização concluída:', data);
    },
    onError: async (error, integracao) => {
      try {
        await api.integracoes.update(integracao.id, {
          status: 'erro'
        });
      } catch (updateError) {
        console.error('Erro ao atualizar status:', updateError);
      }
      console.error('Erro na sincronização:', error);
    }
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'conectado': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'erro': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'conectado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'erro': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const handleSubmit = () => {
    createMutation.mutate({
      ...formData,
      tipo: formData.tipo.toUpperCase(),
      status: 'desconectado'
    });
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
          <h1 className="text-3xl font-bold text-slate-800">Integrações API</h1>
          <p className="text-slate-500 mt-1">Conexões com OMIE, WK Radar, Mercos e Clic - Sincronização automática e periódica</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Nova Integração
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Integração</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da Integração</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Mercos Produção"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Sistema</Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(v) => setFormData({ ...formData, tipo: v, sistema: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="erp">ERP</SelectItem>
                    <SelectItem value="op">OP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.tipo && (
                <div className="space-y-2">
                  <Label>Sistema</Label>
                  <Select 
                    value={formData.sistema} 
                    onValueChange={(v) => setFormData({ ...formData, sistema: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o sistema" />
                    </SelectTrigger>
                    <SelectContent>
                      {sistemasConfig[formData.tipo]?.sistemas.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>URL da API</Label>
                <Input
                  value={formData.api_url}
                  onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                  placeholder="https://api.exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Chave de API</Label>
                <Input
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              {formData.sistema === 'mercos' && (
                <div className="space-y-2">
                  <Label>Company Token (MERCOS)</Label>
                  <Input
                    type="password"
                    value={formData.company_token}
                    onChange={(e) => setFormData({ ...formData, company_token: e.target.value })}
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-slate-500">Token específico da empresa no MERCOS</p>
                </div>
              )}
              {formData.sistema === 'omie' && (
                <div className="space-y-2">
                  <Label>App Secret (OMIE)</Label>
                  <Input
                    type="password"
                    value={formData.company_token}
                    onChange={(e) => setFormData({ ...formData, company_token: e.target.value })}
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-slate-500">App Secret fornecido pela OMIE</p>
                </div>
              )}
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleSubmit}
                disabled={!formData.nome || !formData.tipo || !formData.sistema}
              >
                Adicionar Integração
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Tabs por Tipo */}
      <Tabs defaultValue="todos" className="space-y-6">
        <TabsList className="bg-white shadow-sm border p-1">
          <TabsTrigger value="todos" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Todos
          </TabsTrigger>
          <TabsTrigger value="crm" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            CRM's
          </TabsTrigger>
          <TabsTrigger value="erp" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            ERP's
          </TabsTrigger>

        </TabsList>

        {['todos', 'erp', 'crm'].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integracoes
                .filter(i => tab === 'todos' || i.tipo === tab)
                .map((integracao, index) => (
                  <motion.div
                    key={integracao.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                              <Database className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{integracao.nome}</CardTitle>
                              <CardDescription className="capitalize">
                                {integracao.sistema}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${getStatusColor(integracao.status)} flex items-center gap-1`}
                          >
                            {getStatusIcon(integracao.status)}
                            <span className="capitalize">{integracao.status || 'Pendente'}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm text-slate-500">
                          <p className="font-medium text-slate-700">URL:</p>
                          <p className="truncate">{integracao.api_url || 'Não configurado'}</p>
                        </div>
                        {integracao.ultima_sincronizacao && (
                          <div className="text-sm text-slate-500">
                            <p className="font-medium text-slate-700">Última sincronização:</p>
                            <p>{format(new Date(integracao.ultima_sincronizacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 gap-2"
                            onClick={() => syncMutation.mutate(integracao)}
                            disabled={syncMutation.isPending}
                          >
                            <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                            {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar'}
                          </Button>
                          <Button variant="outline" size="icon" className="h-9 w-9">
                            <Settings2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => deleteMutation.mutate(integracao.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>

            {integracoes.filter(i => tab === 'todos' || i.tipo === tab).length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow-lg p-12 text-center"
              >
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Link2 className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  Nenhuma integração configurada
                </h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Adicione conexões com seus sistemas de CRM, ERP e outros para sincronizar dados automaticamente.
                </p>
                <Button 
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Integração
                </Button>
              </motion.div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
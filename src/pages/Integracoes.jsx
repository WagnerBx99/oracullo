import React, { useState, useEffect } from 'react';
import api from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Lock,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/ui/use-toast";

const sistemasInfo = [
  { id: 'omie', nome: 'OMIE', cor: 'emerald', descricao: 'ERP - Gestão Empresarial' },
  { id: 'wk', nome: 'WK Radar', cor: 'blue', descricao: 'ERP - Gestão Empresarial' },
  { id: 'mercos', nome: 'Mercos', cor: 'purple', descricao: 'CRM - Força de Vendas' },
  { id: 'clic', nome: 'Clic', cor: 'pink', descricao: 'CRM - Gestão Comercial' }
];

export default function Integracoes() {
  const queryClient = useQueryClient();
  const [selectedFiliais, setSelectedFiliais] = useState({}); // { sistemaId: [filialIds] }
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentSyncSistema, setCurrentSyncSistema] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState("");

  const { data: integracoes = [], isLoading } = useQuery({
    queryKey: ['integracoes'],
    queryFn: () => api.integracoes.list(),
    initialData: []
  });

  const toggleFilial = (sistemaId, filialId) => {
    setSelectedFiliais(prev => {
      const current = prev[sistemaId] || [];
      const isSelected = current.includes(filialId);
      
      if (isSelected) {
        return { ...prev, [sistemaId]: current.filter(id => id !== filialId) };
      } else {
        return { ...prev, [sistemaId]: [...current, filialId] };
      }
    });
  };

  const toggleAllFiliais = (sistemaId, filiais) => {
    const filialIds = filiais.map(f => f.id);
    setSelectedFiliais(prev => {
      const current = prev[sistemaId] || [];
      if (current.length === filialIds.length) {
        return { ...prev, [sistemaId]: [] };
      } else {
        return { ...prev, [sistemaId]: filialIds };
      }
    });
  };

  const handleStartSync = (sistemaId) => {
    const selecionadas = selectedFiliais[sistemaId] || [];
    if (selecionadas.length === 0) {
      toast({
        title: "Nenhuma filial selecionada",
        description: "Selecione ao menos uma filial para sincronizar.",
        variant: "destructive"
      });
      return;
    }
    setCurrentSyncSistema(sistemaId);
    setShowConfirmDialog(true);
  };

  const executeSync = async () => {
    setShowConfirmDialog(false);
    setIsSyncing(true);
    setSyncProgress(0);
    
    const sistemaId = currentSyncSistema;
    const filialIds = selectedFiliais[sistemaId] || [];
    const totalSteps = filialIds.length;
    let completedSteps = 0;

    try {
      for (const id of filialIds) {
        const integracao = integracoes.find(i => i.id === id);
        if (!integracao) continue;

        setSyncStatus(`Sincronizando ${integracao.nome}...`);
        
        if (sistemaId === 'omie') {
          await api.omie.sync(integracao.id, {
            api_url: integracao.api_url,
            api_key: integracao.api_key,
            app_secret: integracao.company_token,
            tipo: 'clientes'
          });
          await api.omie.sync(integracao.id, {
            api_url: integracao.api_url,
            api_key: integracao.api_key,
            app_secret: integracao.company_token,
            tipo: 'produtos'
          });
          await api.omie.sync(integracao.id, {
            api_url: integracao.api_url,
            api_key: integracao.api_key,
            app_secret: integracao.company_token,
            tipo: 'pedidos'
          });
        } else if (sistemaId === 'mercos') {
          await api.mercos.sync(integracao.id, {
            api_url: integracao.api_url,
            api_key: integracao.api_key,
            company_token: integracao.company_token,
            tipo: 'clientes'
          });
          await new Promise(r => setTimeout(r, 2000));
          await api.mercos.sync(integracao.id, {
            api_url: integracao.api_url,
            api_key: integracao.api_key,
            company_token: integracao.company_token,
            tipo: 'produtos'
          });
        } else {
          await new Promise(r => setTimeout(r, 2000));
        }

        completedSteps++;
        setSyncProgress(Math.round((completedSteps / totalSteps) * 100));
      }

      toast({
        title: "Sincronização concluída",
        description: `${completedSteps} filiais sincronizadas com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['integracoes'] });
    } catch (error) {
      console.error("Erro na sincronização:", error);
      toast({
        title: "Erro na sincronização",
        description: error.message || "Ocorreu um erro durante o processo.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
      setCurrentSyncSistema(null);
      setSyncStatus("");
    }
  };

  return (
    <div className="space-y-8 relative">
      <AnimatePresence>
        {isSyncing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <Card className="w-full max-w-md shadow-2xl border-primary/20">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                </div>
                <CardTitle className="text-2xl">Sincronização em Andamento</CardTitle>
                <CardDescription>
                  Por favor, aguarde. O sistema está processando os dados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{syncStatus}</span>
                    <span>{syncProgress}%</span>
                  </div>
                  <Progress value={syncProgress} className="h-3" />
                </div>
                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    O acesso às outras áreas do sistema está temporariamente restrito para garantir a integridade dos dados.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-3xl font-bold gradient-text">Painel de Integrações</h1>
        <p className="text-muted-foreground mt-1">Gerencie a sincronização de dados entre seus sistemas e filiais</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {sistemasInfo.map((sistema) => {
          const filiaisDoSistema = integracoes.filter(i => i.sistema === sistema.id);
          const selecionadas = selectedFiliais[sistema.id] || [];
          const isAllSelected = filiaisDoSistema.length > 0 && selecionadas.length === filiaisDoSistema.length;

          return (
            <Card key={sistema.id} className="border-0 shadow-lg overflow-hidden flex flex-col">
              <div className={`h-2 bg-${sistema.cor}-500`} />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-${sistema.cor}-100 dark:bg-${sistema.cor}-900/30 flex items-center justify-center`}>
                      <Database className={`w-7 h-7 text-${sistema.cor}-600`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{sistema.nome}</CardTitle>
                      <CardDescription>{sistema.descricao}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {filiaisDoSistema.length} Filiais
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Filiais Disponíveis
                    </span>
                    {filiaisDoSistema.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id={`all-${sistema.id}`}
                          checked={isAllSelected}
                          onCheckedChange={() => toggleAllFiliais(sistema.id, filiaisDoSistema)}
                        />
                        <label htmlFor={`all-${sistema.id}`} className="text-xs font-medium cursor-pointer">
                          Selecionar Todas
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {filiaisDoSistema.length > 0 ? (
                      filiaisDoSistema.map((filial) => (
                        <div 
                          key={filial.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            selecionadas.includes(filial.id) 
                              ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' 
                              : 'hover:bg-muted/50 border-transparent'
                          }`}
                          onClick={() => toggleFilial(sistema.id, filial.id)}
                        >
                          <Checkbox 
                            checked={selecionadas.includes(filial.id)}
                            onCheckedChange={() => toggleFilial(sistema.id, filial.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{filial.nome}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">
                              {filial.status === 'conectado' ? (
                                <span className="text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 className="w-2 h-2" /> Conectado
                                </span>
                              ) : (
                                <span className="text-amber-600 flex items-center gap-1">
                                  <AlertCircle className="w-2 h-2" /> Pendente
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-8 text-center text-muted-foreground italic text-sm">
                        Nenhuma filial cadastrada para este sistema.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-muted/30 border-t p-4">
                <Button 
                  className="w-full gap-2 shadow-md"
                  disabled={selecionadas.length === 0 || isSyncing}
                  onClick={() => handleStartSync(sistema.id)}
                >
                  <RefreshCw className="w-4 h-4" />
                  Sincronizar Selecionadas ({selecionadas.length})
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Confirmar Sincronização
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-4">
              <p className="text-foreground font-medium">
                Você está prestes a iniciar a sincronização de {(selectedFiliais[currentSyncSistema] || []).length} filiais do sistema {sistemasInfo.find(s => s.id === currentSyncSistema)?.nome}.
              </p>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-semibold mb-1">Aviso Importante:</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Ao sincronizar, você não poderá acessar as outras partes do sistema até que o processo esteja finalizado.
                </p>
              </div>
              <p className="text-sm">Deseja continuar com a operação?</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>Cancelar</Button>
            <Button onClick={executeSync}>Sim, Sincronizar Agora</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

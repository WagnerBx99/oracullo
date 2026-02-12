import React, { useState } from 'react';
import api from '../api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  SlidersHorizontal, 
  Save, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

export default function Manipulaveis() {
  const queryClient = useQueryClient();
  const [margemMinima, setMargemMinima] = useState(25);
  const [margemIdeal, setMargemIdeal] = useState(40);
  const [aplicarAutomatico, setAplicarAutomatico] = useState(false);
  const [produtosAlterados, setProdutosAlterados] = useState({});

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: api.produtos.list,
    initialData: []
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {}, // Base44 removido
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] })
  });

  const calcularMargem = (custo, venda) => {
    if (!custo || !venda) return 0;
    return ((venda - custo) / venda * 100);
  };

  const calcularNovoPreco = (custo, margemDesejada) => {
    if (!custo) return 0;
    return custo / (1 - margemDesejada / 100);
  };

  const produtosAbaixoMargem = produtos.filter(p => {
    const margem = calcularMargem(p.custo, p.preco_venda);
    return margem < margemMinima && p.custo && p.preco_venda;
  });

  const handleAjustarPreco = (produto) => {
    const novoPreco = calcularNovoPreco(produto.custo, margemIdeal);
    setProdutosAlterados(prev => ({
      ...prev,
      [produto.id]: novoPreco
    }));
  };

  const handleSalvarAlteracoes = async () => {
    for (const [id, novoPreco] of Object.entries(produtosAlterados)) {
      await updateMutation.mutateAsync({ id, data: { novo_preco: novoPreco } });
    }
    setProdutosAlterados({});
  };

  const handleAjustarTodos = () => {
    const novosPrecos = {};
    produtosAbaixoMargem.forEach(p => {
      novosPrecos[p.id] = calcularNovoPreco(p.custo, margemIdeal);
    });
    setProdutosAlterados(novosPrecos);
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
          <h1 className="text-3xl font-bold text-slate-800">Dados Manipuláveis</h1>
          <p className="text-slate-500 mt-1">Ajuste preços e margens dos produtos</p>
        </div>
        <div className="flex items-center gap-3">
          {Object.keys(produtosAlterados).length > 0 && (
            <Button 
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSalvarAlteracoes}
            >
              <Save className="w-4 h-4" />
              Salvar ({Object.keys(produtosAlterados).length})
            </Button>
          )}
        </div>
      </motion.div>

      {/* Configurações de Margem */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-slate-50/50">
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5" />
            Configurações de Margem
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Margem Mínima Aceitável</Label>
                <span className="text-2xl font-bold text-slate-800">{margemMinima}%</span>
              </div>
              <Slider
                value={[margemMinima]}
                onValueChange={(v) => setMargemMinima(v[0])}
                max={60}
                min={5}
                step={1}
                className="py-4"
              />
              <p className="text-sm text-slate-500">
                Produtos abaixo desta margem serão destacados
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Margem Ideal para Ajuste</Label>
                <span className="text-2xl font-bold text-blue-600">{margemIdeal}%</span>
              </div>
              <Slider
                value={[margemIdeal]}
                onValueChange={(v) => setMargemIdeal(v[0])}
                max={80}
                min={10}
                step={1}
                className="py-4"
              />
              <p className="text-sm text-slate-500">
                Margem utilizada ao ajustar preços automaticamente
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Aplicar Automaticamente</Label>
                <Switch
                  checked={aplicarAutomatico}
                  onCheckedChange={setAplicarAutomatico}
                />
              </div>
              <p className="text-sm text-slate-500">
                Quando ativo, novos produtos com margem baixa serão ajustados automaticamente
              </p>
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={handleAjustarTodos}
                disabled={produtosAbaixoMargem.length === 0}
              >
                <Calculator className="w-4 h-4" />
                Ajustar Todos ({produtosAbaixoMargem.length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Margem OK</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {produtos.filter(p => calcularMargem(p.custo, p.preco_venda) >= margemMinima).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Margem Baixa</p>
                <p className="text-2xl font-bold text-amber-600">
                  {produtosAbaixoMargem.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Para Ajustar</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Object.keys(produtosAlterados).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Produtos com Margem Baixa */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-slate-50/50">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Produtos com Margem Abaixo de {margemMinima}%
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            <AnimatePresence>
              {produtosAbaixoMargem.map((produto, index) => {
                const margemAtual = calcularMargem(produto.custo, produto.preco_venda);
                const novoPrecoCalculado = produtosAlterados[produto.id] || calcularNovoPreco(produto.custo, margemIdeal);
                const isAlterado = produtosAlterados[produto.id] !== undefined;

                return (
                  <motion.div
                    key={produto.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 hover:bg-slate-50 transition-colors ${isAlterado ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-slate-500">{produto.codigo}</span>
                          <span className="font-semibold text-slate-800 truncate">{produto.nome}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-slate-500">
                            Custo: <span className="font-medium text-slate-700">R$ {Number(produto.custo || 0).toFixed(2)}</span>
                          </span>
                          <span className="text-slate-500">
                            Venda: <span className="font-medium text-slate-700">R$ {Number(produto.preco_venda || 0).toFixed(2)}</span>
                          </span>
                          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            {Number(margemAtual || 0).toFixed(1)}%
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-slate-500">Novo preço sugerido</p>
                          <p className="text-lg font-bold text-blue-600">
                            R$ {Number(novoPrecoCalculado || 0).toFixed(2)}
                          </p>
                          <p className="text-xs text-emerald-600">
                            Margem: {margemIdeal}%
                          </p>
                        </div>
                        <Button
                          variant={isAlterado ? "default" : "outline"}
                          size="sm"
                          className={isAlterado ? "bg-blue-600" : ""}
                          onClick={() => {
                            if (isAlterado) {
                              const newAlterados = { ...produtosAlterados };
                              delete newAlterados[produto.id];
                              setProdutosAlterados(newAlterados);
                            } else {
                              handleAjustarPreco(produto);
                            }
                          }}
                        >
                          {isAlterado ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Selecionado
                            </>
                          ) : (
                            'Ajustar'
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          {produtosAbaixoMargem.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
              <p className="font-medium">Todos os produtos estão com margem adequada!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Save,
  Package,
  DollarSign,
  Tag,
  FileText,
  Upload,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

export default function Formularios() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("produto");
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [produtoForm, setProdutoForm] = useState({
    nome: '',
    codigo: '',
    custo: '',
    preco_venda: '',
    novo_preco: '',
    categoria: '',
    fonte: 'manual',
    status: 'ativo'
  });

  const createProdutoMutation = useMutation({
    mutationFn: (data) => base44.entities.Produto.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      setProdutoForm({
        nome: '',
        codigo: '',
        custo: '',
        preco_venda: '',
        novo_preco: '',
        categoria: '',
        fonte: 'manual',
        status: 'ativo'
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  });

  const handleProdutoSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...produtoForm,
      custo: parseFloat(produtoForm.custo) || 0,
      preco_venda: parseFloat(produtoForm.preco_venda) || 0,
      novo_preco: produtoForm.novo_preco ? parseFloat(produtoForm.novo_preco) : null
    };
    createProdutoMutation.mutate(data);
  };

  const calcularMargem = () => {
    const custo = parseFloat(produtoForm.custo) || 0;
    const venda = parseFloat(produtoForm.preco_venda) || 0;
    if (custo && venda) {
      return ((venda - custo) / venda * 100).toFixed(1);
    }
    return '0.0';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-slate-800">Formulários</h1>
        <p className="text-slate-500 mt-1">Cadastre produtos e dados manualmente</p>
      </motion.div>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-700 font-medium">Cadastro realizado com sucesso!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white shadow-sm border p-1">
          <TabsTrigger value="produto" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Package className="w-4 h-4" />
            Novo Produto
          </TabsTrigger>
          <TabsTrigger value="importar" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Upload className="w-4 h-4" />
            Importar
          </TabsTrigger>
        </TabsList>

        {/* Formulário de Produto */}
        <TabsContent value="produto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-slate-50/50">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Cadastrar Produto
                  </CardTitle>
                  <CardDescription>Preencha os dados do produto</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleProdutoSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="codigo">Código *</Label>
                        <Input
                          id="codigo"
                          value={produtoForm.codigo}
                          onChange={(e) => setProdutoForm({ ...produtoForm, codigo: e.target.value })}
                          placeholder="SKU-001"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome do Produto *</Label>
                        <Input
                          id="nome"
                          value={produtoForm.nome}
                          onChange={(e) => setProdutoForm({ ...produtoForm, nome: e.target.value })}
                          placeholder="Nome do produto"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="custo">Custo (R$)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            id="custo"
                            type="number"
                            step="0.01"
                            value={produtoForm.custo}
                            onChange={(e) => setProdutoForm({ ...produtoForm, custo: e.target.value })}
                            placeholder="0.00"
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="preco_venda">Preço de Venda (R$)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            id="preco_venda"
                            type="number"
                            step="0.01"
                            value={produtoForm.preco_venda}
                            onChange={(e) => setProdutoForm({ ...produtoForm, preco_venda: e.target.value })}
                            placeholder="0.00"
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="novo_preco">Novo Preço (R$)</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            id="novo_preco"
                            type="number"
                            step="0.01"
                            value={produtoForm.novo_preco}
                            onChange={(e) => setProdutoForm({ ...produtoForm, novo_preco: e.target.value })}
                            placeholder="0.00"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="categoria">Categoria</Label>
                        <Input
                          id="categoria"
                          value={produtoForm.categoria}
                          onChange={(e) => setProdutoForm({ ...produtoForm, categoria: e.target.value })}
                          placeholder="Ex: Eletrônicos"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select 
                          value={produtoForm.status} 
                          onValueChange={(v) => setProdutoForm({ ...produtoForm, status: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <Button 
                        type="submit" 
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                        disabled={createProdutoMutation.isPending}
                      >
                        <Save className="w-4 h-4" />
                        {createProdutoMutation.isPending ? 'Salvando...' : 'Salvar Produto'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Preview Card */}
            <div>
              <Card className="border-0 shadow-lg sticky top-6">
                <CardHeader className="border-b bg-slate-50/50">
                  <CardTitle className="text-lg">Preview</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-500">Código</p>
                      <p className="font-mono font-medium text-slate-800">
                        {produtoForm.codigo || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Produto</p>
                      <p className="font-semibold text-slate-800">
                        {produtoForm.nome || '-'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Custo</p>
                        <p className="font-medium text-slate-800">
                          R$ {parseFloat(produtoForm.custo || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Venda</p>
                        <p className="font-medium text-slate-800">
                          R$ {parseFloat(produtoForm.preco_venda || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-sm text-slate-500 mb-1">Margem Calculada</p>
                      <p className={`text-2xl font-bold ${
                        parseFloat(calcularMargem()) >= 30 ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {calcularMargem()}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Importar */}
        <TabsContent value="importar">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Importar Dados
              </h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                Arraste um arquivo CSV ou clique para selecionar. O sistema irá processar e importar os dados automaticamente.
              </p>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 hover:border-blue-400 transition-colors cursor-pointer">
                <input type="file" className="hidden" accept=".csv,.xlsx" />
                <Button variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Selecionar Arquivo
                </Button>
                <p className="text-sm text-slate-400 mt-4">CSV, XLSX até 10MB</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ArrowUpDown, TrendingUp, TrendingDown, Edit2, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustoVendaTable({ produtos, onUpdateProduto }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const filteredProdutos = produtos.filter(p =>
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProdutos = [...filteredProdutos].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key] || 0;
    const bVal = b[sortConfig.key] || 0;
    return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const calcularMargem = (custo, venda) => {
    if (!custo || !venda) return 0;
    return ((venda - custo) / venda * 100).toFixed(1);
  };

  const handleStartEdit = (produto) => {
    setEditingId(produto.id);
    setEditValue(produto.novo_preco || produto.preco_venda || "");
  };

  const handleSaveEdit = async (produto) => {
    if (onUpdateProduto) {
      await onUpdateProduto(produto.id, { novo_preco: parseFloat(editValue) });
    }
    setEditingId(null);
    setEditValue("");
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-slate-50/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-xl font-bold text-slate-800">
            Custo x Venda
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-64 border-slate-200"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-semibold text-slate-600">Código</TableHead>
                <TableHead className="font-semibold text-slate-600">Produto</TableHead>
                <TableHead 
                  className="font-semibold text-slate-600 cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort('custo')}
                >
                  <div className="flex items-center gap-1">
                    Custo
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="font-semibold text-slate-600 cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort('preco_venda')}
                >
                  <div className="flex items-center gap-1">
                    Venda
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-slate-600">Margem</TableHead>
                <TableHead className="font-semibold text-slate-600">Novo Preço</TableHead>
                <TableHead className="font-semibold text-slate-600">Fonte</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {sortedProdutos.map((produto, index) => {
                  const margem = calcularMargem(produto.custo, produto.preco_venda);
                  return (
                    <motion.tr
                      key={produto.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <TableCell className="font-mono text-sm text-slate-600">
                        {produto.codigo}
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">
                        {produto.nome}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        R$ {produto.custo?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        R$ {produto.preco_venda?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {margem >= 30 ? (
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                          )}
                          <span className={margem >= 30 ? 'text-emerald-600' : 'text-red-500'}>
                            {margem}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingId === produto.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-24 h-8"
                            />
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSaveEdit(produto)}>
                              <Save className="w-4 h-4 text-emerald-600" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600">
                              {produto.novo_preco ? `R$ ${produto.novo_preco.toFixed(2)}` : '-'}
                            </span>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleStartEdit(produto)}>
                              <Edit2 className="w-4 h-4 text-slate-400" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {produto.fonte || 'manual'}
                        </Badge>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
        {sortedProdutos.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            Nenhum produto encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
}
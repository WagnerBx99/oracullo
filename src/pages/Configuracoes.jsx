import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  Shield, 
  Settings, 
  Save,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion } from "framer-motion";

const permissoes = [
  { id: 'dashboard_leitura', label: 'Dashboard - Leitura', modulo: 'Dashboard' },
  { id: 'dashboard_manipular', label: 'Dashboard - Manipular', modulo: 'Dashboard' },
  { id: 'relatorios', label: 'Relatórios', modulo: 'Dashboard' },
  { id: 'integracoes', label: 'Integrações', modulo: 'Banco de Dados' },
  { id: 'formularios', label: 'Formulários', modulo: 'Banco de Dados' },
  { id: 'usuarios', label: 'Gerenciar Usuários', modulo: 'Configurações' },
  { id: 'permissoes', label: 'Gerenciar Permissões', modulo: 'Configurações' }
];

const perfisDefault = [
  { 
    id: 'admin', 
    nome: 'Administrador', 
    descricao: 'Acesso total ao sistema',
    permissoes: permissoes.map(p => p.id),
    cor: 'purple'
  },
  { 
    id: 'gerente', 
    nome: 'Gerente', 
    descricao: 'Acesso a relatórios e configurações básicas',
    permissoes: ['dashboard_leitura', 'dashboard_manipular', 'relatorios', 'integracoes'],
    cor: 'blue'
  },
  { 
    id: 'operador', 
    nome: 'Operador', 
    descricao: 'Acesso apenas a leitura',
    permissoes: ['dashboard_leitura'],
    cor: 'green'
  }
];

export default function Configuracoes() {
  const queryClient = useQueryClient();
  const [perfis, setPerfis] = useState(perfisDefault);
  const [selectedPerfil, setSelectedPerfil] = useState(perfis[0]);

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => base44.entities.User.list(),
    initialData: []
  });

  const togglePermissao = (perfilId, permissaoId) => {
    setPerfis(prev => prev.map(p => {
      if (p.id === perfilId) {
        const hasPermissao = p.permissoes.includes(permissaoId);
        return {
          ...p,
          permissoes: hasPermissao 
            ? p.permissoes.filter(perm => perm !== permissaoId)
            : [...p.permissoes, permissaoId]
        };
      }
      return p;
    }));
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      user: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return colors[role] || colors.user;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-slate-800">Configurações</h1>
        <p className="text-slate-500 mt-1">Gerencie usuários e permissões do sistema</p>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="usuarios" className="space-y-6">
        <TabsList className="bg-white shadow-sm border p-1">
          <TabsTrigger value="usuarios" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="perfis" className="gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Shield className="w-4 h-4" />
            Perfis de Permissão
          </TabsTrigger>
        </TabsList>

        {/* Usuários Tab */}
        <TabsContent value="usuarios">
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Usuários do Sistema</CardTitle>
                  <CardDescription>Gerencie os usuários e seus níveis de acesso</CardDescription>
                </div>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="w-4 h-4" />
                  Convidar Usuário
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((usuario, index) => (
                    <motion.tr
                      key={usuario.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                              {usuario.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-slate-800">
                            {usuario.full_name || 'Sem nome'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{usuario.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRoleBadge(usuario.role)}>
                          {usuario.role === 'admin' ? 'Administrador' : 'Usuário'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-emerald-600 text-sm">Ativo</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
              {usuarios.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  Nenhum usuário encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Perfis Tab */}
        <TabsContent value="perfis">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Perfis */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700">Perfis</h3>
              {perfis.map((perfil) => {
                const corClasses = {
                  purple: 'from-purple-500 to-purple-600',
                  blue: 'from-blue-500 to-blue-600',
                  green: 'from-emerald-500 to-emerald-600'
                };
                return (
                  <motion.div
                    key={perfil.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer border-2 transition-all ${
                        selectedPerfil?.id === perfil.id 
                          ? 'border-blue-500 shadow-lg' 
                          : 'border-transparent shadow hover:shadow-md'
                      }`}
                      onClick={() => setSelectedPerfil(perfil)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${corClasses[perfil.cor]} flex items-center justify-center`}>
                            <Shield className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{perfil.nome}</p>
                            <p className="text-sm text-slate-500">{perfil.permissoes.length} permissões</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Configuração de Permissões */}
            <div className="lg:col-span-2">
              {selectedPerfil && (
                <Card className="border-0 shadow-lg">
                  <CardHeader className="border-b bg-slate-50/50">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Permissões - {selectedPerfil.nome}
                    </CardTitle>
                    <CardDescription>{selectedPerfil.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {['Dashboard', 'Banco de Dados', 'Configurações'].map((modulo) => (
                        <div key={modulo}>
                          <h4 className="font-semibold text-slate-700 mb-3">{modulo}</h4>
                          <div className="space-y-3">
                            {permissoes
                              .filter(p => p.modulo === modulo)
                              .map((perm) => (
                                <div 
                                  key={perm.id}
                                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                >
                                  <span className="text-slate-700">{perm.label}</span>
                                  <Switch
                                    checked={selectedPerfil.permissoes.includes(perm.id)}
                                    onCheckedChange={() => togglePermissao(selectedPerfil.id, perm.id)}
                                  />
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-6 border-t">
                      <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4" />
                        Salvar Alterações
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
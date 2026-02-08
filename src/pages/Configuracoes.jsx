import { useState } from 'react';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, 
  Shield, 
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { motion } from "framer-motion";
import { api } from '@/api/apiClient';
import { toast } from 'sonner';

export default function Configuracoes() {
  const queryClient = useQueryClient();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil_id: '',
    ativo: true
  });

  // Buscar usuários
  const { data: usuarios = [], isLoading: loadingUsuarios } = useQuery({
    queryKey: ['usuarios'],
    queryFn: api.usuarios.list,
  });

  // Buscar perfis
  const { data: perfis = [], isLoading: loadingPerfis } = useQuery({
    queryKey: ['perfis'],
    queryFn: api.perfis.list,
  });

  // Criar usuário
  const criarUsuarioMutation = useMutation({
    mutationFn: api.usuarios.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['usuarios']);
      setDialogAberto(false);
      resetForm();
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar usuário');
    },
  });

  // Atualizar usuário
  const atualizarUsuarioMutation = useMutation({
    mutationFn: ({ id, data }) => api.usuarios.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['usuarios']);
      setDialogAberto(false);
      resetForm();
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar usuário');
    },
  });

  // Deletar usuário
  const deletarUsuarioMutation = useMutation({
    mutationFn: api.usuarios.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['usuarios']);
      toast.success('Usuário deletado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao deletar usuário');
    },
  });

  // Convidar usuário
  const convidarUsuarioMutation = useMutation({
    mutationFn: api.usuarios.convidar,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['usuarios']);
      setDialogAberto(false);
      resetForm();
      toast.success('Convite enviado com sucesso!');
      if (data.senhaTemporaria) {
        toast.info(`Senha temporária: ${data.senhaTemporaria}`, { duration: 10000 });
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao enviar convite');
    },
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      perfil_id: '',
      ativo: true
    });
    setUsuarioEditando(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (usuarioEditando) {
      // Atualizar usuário existente
      const dataToUpdate = { ...formData };
      if (!dataToUpdate.senha) {
        delete dataToUpdate.senha; // Não atualizar senha se vazio
      }
      atualizarUsuarioMutation.mutate({ id: usuarioEditando.id, data: dataToUpdate });
    } else {
      // Criar novo usuário
      criarUsuarioMutation.mutate(formData);
    }
  };

  const handleEditar = (usuario) => {
    setUsuarioEditando(usuario);
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      perfil_id: usuario.perfil_id,
      ativo: usuario.ativo
    });
    setDialogAberto(true);
  };

  const handleDeletar = (id) => {
    if (confirm('Tem certeza que deseja deletar este usuário?')) {
      deletarUsuarioMutation.mutate(id);
    }
  };

  const handleConvidar = () => {
    setUsuarioEditando(null);
    resetForm();
    setDialogAberto(true);
  };

  const getInitials = (nome) => {
    return nome
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPerfilColor = (perfilNome) => {
    const colors = {
      'Administrador': 'bg-purple-100 text-purple-700 border-purple-200',
      'Gerente': 'bg-blue-100 text-blue-700 border-blue-200',
      'Operador': 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[perfilNome] || 'bg-gray-100 text-gray-700 border-gray-200';
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
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="perfis" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Perfis de Permissão
          </TabsTrigger>
        </TabsList>

        {/* Tab Usuários */}
        <TabsContent value="usuarios" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Usuários do Sistema</CardTitle>
                  <CardDescription>Gerencie os usuários e seus níveis de acesso</CardDescription>
                </div>
                <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
                  <DialogTrigger asChild>
                    <Button onClick={handleConvidar} className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Convidar Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {usuarioEditando ? 'Editar Usuário' : 'Convidar Novo Usuário'}
                      </DialogTitle>
                      <DialogDescription>
                        {usuarioEditando 
                          ? 'Atualize as informações do usuário' 
                          : 'Preencha os dados para enviar um convite'}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="nome">Nome</Label>
                        <Input
                          id="nome"
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="senha">
                          Senha {usuarioEditando && '(deixe em branco para não alterar)'}
                        </Label>
                        <Input
                          id="senha"
                          type="password"
                          value={formData.senha}
                          onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                          required={!usuarioEditando}
                        />
                      </div>
                      <div>
                        <Label htmlFor="perfil">Perfil</Label>
                        <Select
                          value={formData.perfil_id.toString()}
                          onValueChange={(value) => setFormData({ ...formData, perfil_id: parseInt(value) })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um perfil" />
                          </SelectTrigger>
                          <SelectContent>
                            {perfis.map((perfil) => (
                              <SelectItem key={perfil.id} value={perfil.id.toString()}>
                                {perfil.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="ativo"
                          checked={formData.ativo}
                          onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                        />
                        <Label htmlFor="ativo">Usuário ativo</Label>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setDialogAberto(false);
                            resetForm();
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={criarUsuarioMutation.isPending || atualizarUsuarioMutation.isPending}
                        >
                          {(criarUsuarioMutation.isPending || atualizarUsuarioMutation.isPending) && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          )}
                          {usuarioEditando ? 'Salvar' : 'Convidar'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsuarios ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : usuarios.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Nenhum usuário encontrado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {getInitials(usuario.nome)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{usuario.nome}</span>
                          </div>
                        </TableCell>
                        <TableCell>{usuario.email}</TableCell>
                        <TableCell>
                          <Badge className={getPerfilColor(usuario.perfil_nome)}>
                            {usuario.perfil_nome}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {usuario.ativo ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-red-200">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditar(usuario)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletar(usuario.id)}
                              disabled={deletarUsuarioMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Perfis */}
        <TabsContent value="perfis">
          <Card>
            <CardHeader>
              <CardTitle>Perfis de Permissão</CardTitle>
              <CardDescription>
                Gerencie os perfis e suas permissões (em desenvolvimento)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPerfis ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="grid gap-4">
                  {perfis.map((perfil) => (
                    <div key={perfil.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{perfil.nome}</h3>
                          <p className="text-sm text-slate-500">{perfil.descricao}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {perfil.total_usuarios} usuário(s)
                          </p>
                        </div>
                        <Badge className={getPerfilColor(perfil.nome)}>
                          {perfil.nome}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

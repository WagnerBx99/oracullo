import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Edit3, 
  Save, 
  X,
  GripVertical,
  Settings2,
  BarChart3,
  TrendingUp,
  DollarSign,
  Package
} from 'lucide-react';
import { motion, Reorder } from "framer-motion";

const widgetTypes = [
  { id: 'kpi', nome: 'KPI Card', icon: TrendingUp, cor: 'blue' },
  { id: 'chart', nome: 'Gráfico', icon: BarChart3, cor: 'purple' },
  { id: 'table', nome: 'Tabela', icon: Package, cor: 'green' },
  { id: 'metric', nome: 'Métrica', icon: DollarSign, cor: 'orange' }
];

export default function EditableDashboard({ 
  widgets = [], 
  onSave, 
  onAddWidget,
  onRemoveWidget,
  isEditMode = false,
  onToggleEditMode
}) {
  const [items, setItems] = useState(widgets);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const handleSave = () => {
    onSave(items);
    onToggleEditMode();
  };

  const handleAddWidget = (type) => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      tipo: type.id,
      titulo: `Novo ${type.nome}`,
      config: {}
    };
    const updated = [...items, newWidget];
    setItems(updated);
    if (onAddWidget) onAddWidget(newWidget);
    setDialogOpen(false);
  };

  const handleRemove = (id) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    if (onRemoveWidget) onRemoveWidget(id);
  };

  return (
    <div className="space-y-6">
      {/* Edit Mode Header */}
      <div className="flex items-center justify-between p-4 bg-card rounded-xl border-2 border-dashed border-primary/30">
        <div className="flex items-center gap-3">
          {isEditMode ? (
            <>
              <Edit3 className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Modo de Edição Ativo</p>
                <p className="text-sm text-muted-foreground">Arraste os cards para reorganizar</p>
              </div>
            </>
          ) : (
            <>
              <Settings2 className="w-5 h-5 text-muted-foreground" />
              <p className="text-muted-foreground">Dashboard personalizado</p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Adicionar Widget
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Escolha um tipo de widget</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    {widgetTypes.map((type) => {
                      const Icon = type.icon;
                      const colorClasses = {
                        blue: 'from-blue-500 to-blue-600',
                        purple: 'from-purple-500 to-purple-600',
                        green: 'from-emerald-500 to-emerald-600',
                        orange: 'from-[#ff5c00] to-orange-600'
                      };
                      return (
                        <motion.button
                          key={type.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAddWidget(type)}
                          className="p-6 rounded-xl border-2 border-border hover:border-primary transition-all bg-card"
                        >
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[type.cor]} flex items-center justify-center mx-auto mb-3`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <p className="font-medium text-foreground">{type.nome}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
              <Button size="sm" className="gap-2 bg-gradient-to-r from-[#135670] to-[#ff5c00]" onClick={handleSave}>
                <Save className="w-4 h-4" />
                Salvar Layout
              </Button>
            </>
          )}
          <Button 
            variant={isEditMode ? "outline" : "default"}
            size="sm" 
            onClick={onToggleEditMode}
            className={isEditMode ? "" : "bg-gradient-to-r from-[#135670] to-[#ff5c00]"}
          >
            {isEditMode ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4 mr-2" />
                Editar Dashboard
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Widgets Grid */}
      {isEditMode ? (
        <Reorder.Group 
          axis="y" 
          values={items} 
          onReorder={setItems}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {items.map((widget) => (
            <Reorder.Item 
              key={widget.id} 
              value={widget}
              className="cursor-move"
            >
              <Card className="border-2 border-dashed border-primary/50 hover:border-primary transition-all group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-5 h-5 text-muted-foreground" />
                      <CardTitle className="text-base">{widget.titulo}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemove(widget.id)}
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <Badge variant="outline" className="w-fit capitalize">
                    {widget.tipo}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Preview do {widget.tipo}</p>
                  </div>
                </CardContent>
              </Card>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((widget, index) => (
            <motion.div
              key={widget.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-card">
                <CardHeader>
                  <CardTitle className="text-base">{widget.titulo}</CardTitle>
                  <Badge variant="outline" className="w-fit capitalize">
                    {widget.tipo}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="h-40 bg-gradient-to-br from-[#135670]/10 to-[#ff5c00]/10 rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Conteúdo do {widget.tipo}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Dashboard vazio
          </h3>
          <p className="text-muted-foreground mb-4">
            Adicione widgets para começar a personalizar seu dashboard
          </p>
          {isEditMode && (
            <Button onClick={() => setDialogOpen(true)} className="bg-gradient-to-r from-[#135670] to-[#ff5c00]">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Widget
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
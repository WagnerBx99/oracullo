import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Search, Loader2 } from 'lucide-react';





const MONTHS = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
];

export default function SalesReportFilters({
    filters,
    setFilters,
    options,
    onApply,
    onExport,
    isLoading,
    isExporting,
    statesList, // nova prop
    activeTab, // prop para esconder dimensões
    multiState = false, // nova prop para habilitar seleção múltipla no estado
    multiMonth = false, // nova prop para habilitar seleção múltipla no mês
    showDayRange = false // nova prop para dias no Faturamento Diário
}) {
    const handleChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleMultiStateChange = (uf) => {
        setFilters(prev => {
            const currentStates = Array.isArray(prev.state) ? prev.state : [];
            if (currentStates.includes(uf)) {
                return { ...prev, state: currentStates.filter(s => s !== uf) };
            } else {
                return { ...prev, state: [...currentStates, uf] };
            }
        });
    };

    const handleSelectAllStates = () => {
        setFilters(prev => ({
            ...prev,
            state: statesList && statesList.length > 0 ? [...statesList] : []
        }));
    };

    const handleClearStates = () => {
        setFilters(prev => ({
            ...prev,
            state: []
        }));
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 font-sans">
            <div className="flex flex-col md:flex-row gap-4 items-end">

                                {/* Filtro Unidade (Seleção Múltipla) */}
                <div className="w-full md:w-64 space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Unidades
                    </label>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 justify-between"
                            >
                                <span className="truncate">
                                    {Array.isArray(filters.state) && filters.state.length > 0
                                        ? (filters.state.length === statesList.length ? 'Todas as Unidades' : `${filters.state.length} selecionadas`)
                                        : 'Selecione Unidades'}
                                </span>
                                <Loader2 className={`w-4 h-4 animate-spin ${isLoading ? 'opacity-100' : 'opacity-0'}`} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 max-h-80 overflow-y-auto">
                            <DropdownMenuCheckboxItem
                                checked={Array.isArray(filters.state) && statesList && filters.state.length === statesList.length}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        handleSelectAllStates();
                                    } else {
                                        handleClearStates();
                                    }
                                }}
                                className="font-bold border-b border-slate-100 mb-1"
                            >
                                SELECIONAR TODAS
                            </DropdownMenuCheckboxItem>
                            {statesList?.map(unit => (
                                <DropdownMenuCheckboxItem
                                    key={unit}
                                    checked={Array.isArray(filters.state) && filters.state.includes(unit)}
                                    onCheckedChange={() => handleMultiStateChange(unit)}
                                >
                                    {unit}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                {/* Filtro Mês */}
                <div className="w-full md:w-48 space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {multiMonth ? 'Meses' : 'Mês'}
                    </label>
                    {multiMonth ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 justify-start"
                                >
                                    {Array.isArray(filters.month) && filters.month.length > 0
                                        ? `${filters.month.length} selecionado(s)`
                                        : 'Selecione'}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48 max-h-64 overflow-y-auto">
                                {MONTHS.map(m => (
                                    <DropdownMenuCheckboxItem
                                        key={m.value}
                                        checked={Array.isArray(filters.month) && filters.month.includes(Number(m.value))}
                                        onCheckedChange={() => {
                                            const num = Number(m.value);
                                            setFilters(prev => {
                                                const currentMonths = Array.isArray(prev.month) ? prev.month : [];
                                                if (currentMonths.includes(num)) {
                                                    return { ...prev, month: currentMonths.filter(x => x !== num) };
                                                } else {
                                                    return { ...prev, month: [...currentMonths, num].sort((a, b) => a - b) };
                                                }
                                            });
                                        }}
                                    >
                                        {m.label}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Select
                            value={filters.month?.toString()}
                            onValueChange={(val) => handleChange('month', Number(val))}
                        >
                            <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                <SelectValue placeholder="Selecione o mês" />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Filtro Range de Dias (Tabela Diária) */}
                {showDayRange && (
                    <>
                        <div className="w-full md:w-28 space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Dia Inicial</label>
                            <Input
                                type="number"
                                value={filters.startDay}
                                onChange={(e) => handleChange('startDay', Number(e.target.value))}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                min={1}
                                max={31}
                            />
                        </div>
                        <div className="w-full md:w-28 space-y-1.5">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Dia Final</label>
                            <Input
                                type="number"
                                value={filters.endDay}
                                onChange={(e) => handleChange('endDay', Number(e.target.value))}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                min={1}
                                max={31}
                            />
                        </div>
                    </>
                )}

                {/* Filtro Ano */}
                <div className="w-full md:w-32 space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ano</label>
                    <Input
                        type="number"
                        value={filters.year}
                        onChange={(e) => handleChange('year', Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                        min={2000}
                        max={2100}
                    />
                </div>

                {/* Filtro Vendedor */}
                <div className={`w-full md:w-64 space-y-1.5 ${activeTab === 'consolidado' ? 'hidden' : ''}`}>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Vendedor</label>
                    <Select
                        value={filters.salesperson || "Todos"}
                        onValueChange={(val) => handleChange('salesperson', val === "Todos" ? "" : val)}
                    >
                        <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                            <SelectValue placeholder="Todos os Vendedores" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Todos">Todos os Vendedores</SelectItem>
                            {options.salespersons?.map(sp => (
                                <SelectItem key={sp} value={sp}>{sp}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-2 w-full md:w-auto">
                    <Button
                        onClick={onApply}
                        disabled={
                            isLoading
                            || (multiMonth ? (!filters.month || filters.month.length === 0) : !filters.month)
                            || !filters.year
                            || (showDayRange && (!filters.startDay || !filters.endDay || filters.startDay > filters.endDay))
                        }
                        className="flex-1 md:flex-none bg-gradient-to-r from-[#135670] to-[#ff5c00] text-white hover:opacity-90 shadow-md font-medium"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                        Aplicar Filtros
                    </Button>

                    <Button
                        onClick={onExport}
                        disabled={isLoading || isExporting || (multiMonth ? (!filters.month || filters.month.length === 0) : !filters.month) || !filters.year}
                        variant="outline"
                        className="flex-1 md:flex-none border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2 text-green-600" />}
                        Exportar Excel
                    </Button>
                </div>

            </div>
        </div>
    );
}

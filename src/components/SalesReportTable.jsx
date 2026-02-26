import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { api } from '../api/apiClient';

const formatCurrency = (val) => {
    if (val == null) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const formatPct = (val) => {
    if (val == null) return '-';
    // Esperado um valor fracionário como 0.60 para 60%
    return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
};

const formatDate = (val) => {
    if (!val) return '-';
    try {
        const d = new Date(val);
        return new Intl.DateTimeFormat('pt-BR').format(d);
    } catch {
        return val;
    }
}

const getMarginColorClass = (val) => {
    if (val == null) return '';
    if (val > 0.30) return 'text-emerald-600 dark:text-emerald-400 font-semibold';
    if (val >= 0.10) return 'text-amber-600 dark:text-amber-400 font-semibold';
    return 'text-red-600 dark:text-red-400 font-semibold';
}

const InlineEditCommission = ({ transactionId, initialPct, initialRs, baseAmount, onUpdate }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [pctValue, setPctValue] = React.useState(initialPct != null ? (initialPct * 100).toFixed(2) : '0.00');
    const [isSaving, setIsSaving] = React.useState(false);
    const inputRef = React.useRef(null);

    // Snapshot do original da linha "limpa" para não perder a referência durante o live preview
    const originalPctRef = React.useRef(initialPct);
    const originalRsRef = React.useRef(initialRs);

    // Quando o DB salva e propaga pra baixo de verdade depois de um f5/reload da grid, a prop "mãe" (initialPct) virá atualizada.
    // Mas não devemos forçar o reset do state do Input se ele estiver aberto ou se acabou de fechar.
    React.useEffect(() => {
        if (!isEditing && !isSaving) {
            setPctValue(initialPct != null ? (initialPct * 100).toFixed(2) : '0.00');
            originalPctRef.current = initialPct;
            originalRsRef.current = initialRs;
        }
    }, [initialPct, initialRs]); // Removemos isEditing daqui para o blur nao trigar o reset da prop "velha"

    const startEditing = () => {
        if (isSaving) return;
        originalPctRef.current = initialPct;
        originalRsRef.current = initialRs;
        setIsEditing(true);
    };

    const handlePercentageChange = (e) => {
        let val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
        setPctValue(val);

        const numVal = parseFloat(val);
        if (!isNaN(numVal) && baseAmount) {
            const newDecP = numVal / 100;
            const calculatedRs = baseAmount * newDecP;
            // OTIMISTA: Avisa o pai p/ atualizar visual do Row (Coluna R$)
            if (onUpdate) onUpdate(newDecP, calculatedRs);
        }
    };

    const saveChanges = async () => {
        setIsEditing(false); // input morre, vira <div> com a prop atualizada da Row
        const floatPct = parseFloat(pctValue);

        if (isNaN(floatPct)) {
            // Restaura
            if (onUpdate) onUpdate(originalPctRef.current, originalRsRef.current);
            setPctValue(originalPctRef.current != null ? (originalPctRef.current * 100).toFixed(2) : '0.00');
            return;
        }

        const newDecimalPct = floatPct / 100;
        const calculatedRs = baseAmount * newDecimalPct;

        // Verifica contra o original REAL salvo antes da edição. Se bater igual o prévio da sessão, cancela REST.
        if (Math.abs(newDecimalPct - (originalPctRef.current || 0)) < 0.0001) {
            if (onUpdate) onUpdate(originalPctRef.current, originalRsRef.current);
            setPctValue(originalPctRef.current != null ? (originalPctRef.current * 100).toFixed(2) : '0.00');
            return;
        }

        setIsSaving(true);
        // Props no pai já estão certas por causa do handlePercentageChange live

        try {
            await api.relatorios.updateSaleCommission(transactionId, { salesperson_comm_pct: newDecimalPct });
            originalPctRef.current = newDecimalPct; // Novo estado de referẽncia original pos-DB commit.
            originalRsRef.current = calculatedRs;
            // Sucesso preserva visual otimizado nas props do pai.
        } catch (err) {
            console.error('Failed to save commission:', err);
            // Voltar atrás o preview no erro
            if (onUpdate) onUpdate(originalPctRef.current, originalRsRef.current);
            setPctValue(originalPctRef.current != null ? (originalPctRef.current * 100).toFixed(2) : '0.00');
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            saveChanges();
            inputRef.current?.blur();
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
            if (onUpdate) onUpdate(originalPctRef.current, originalRsRef.current);
            setPctValue(originalPctRef.current != null ? (originalPctRef.current * 100).toFixed(2) : '0.00');
        }
    };

    return (
        <div className="flex flex-row items-center justify-end w-full gap-2">
            <div className="flex-1 text-right">
                {isEditing ? (
                    <div className="relative inline-flex items-center">
                        <input
                            ref={inputRef}
                            className={`w-16 px-1 py-0.5 text-right bg-white dark:bg-slate-800 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isSaving ? 'opacity-50' : ''}`}
                            value={pctValue}
                            onChange={handlePercentageChange}
                            onBlur={saveChanges}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                        <span className="ml-1 text-xs text-muted-foreground">%</span>
                    </div>
                ) : (
                    <div
                        className={`cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 px-1 rounded transition-colors ${isSaving ? 'animate-pulse opacity-50' : ''}`}
                        onClick={startEditing}
                        title="Clique duplo ou clique para editar"
                    >
                        {formatPct(parseFloat(pctValue) / 100)}
                    </div>
                )}
            </div>
        </div>
    );
};

const InlineEditCost = ({ transactionId, initialCost, onUpdate }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [costValue, setCostValue] = React.useState(initialCost != null ? Number(initialCost).toFixed(2) : '0.00');
    const [isSaving, setIsSaving] = React.useState(false);
    const inputRef = React.useRef(null);

    // Snapshot
    const originalCostRef = React.useRef(initialCost);

    React.useEffect(() => {
        if (!isEditing && !isSaving) {
            setCostValue(initialCost != null ? Number(initialCost).toFixed(2) : '0.00');
            originalCostRef.current = initialCost;
        }
    }, [initialCost]);

    const startEditing = () => {
        if (isSaving) return;
        originalCostRef.current = initialCost;
        setIsEditing(true);
    };

    const handleCostChange = (e) => {
        let val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
        setCostValue(val);

        const numVal = parseFloat(val);
        if (!isNaN(numVal)) {
            if (onUpdate) onUpdate(numVal);
        }
    };

    const saveChanges = async () => {
        setIsEditing(false); // input morre, vira <div>
        const floatCost = parseFloat(costValue);

        if (isNaN(floatCost)) {
            if (onUpdate) onUpdate(originalCostRef.current);
            setCostValue(originalCostRef.current != null ? Number(originalCostRef.current).toFixed(2) : '0.00');
            return;
        }

        if (Math.abs(floatCost - (Number(originalCostRef.current) || 0)) < 0.0001) {
            if (onUpdate) onUpdate(originalCostRef.current);
            setCostValue(originalCostRef.current != null ? Number(originalCostRef.current).toFixed(2) : '0.00');
            return;
        }

        setIsSaving(true);
        try {
            await api.relatorios.updateUnitCost(transactionId, { unit_cost: floatCost });
            originalCostRef.current = floatCost;
        } catch (err) {
            console.error('Failed to save cost:', err);
            if (onUpdate) onUpdate(originalCostRef.current);
            setCostValue(originalCostRef.current != null ? Number(originalCostRef.current).toFixed(2) : '0.00');
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            saveChanges();
            inputRef.current?.blur();
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
            if (onUpdate) onUpdate(originalCostRef.current);
            setCostValue(originalCostRef.current != null ? Number(originalCostRef.current).toFixed(2) : '0.00');
        }
    };

    return (
        <div className="flex flex-row items-center justify-end w-full gap-2 text-foreground font-medium">
            <div className="flex-1 text-right">
                {isEditing ? (
                    <div className="relative inline-flex items-center">
                        <span className="mr-1 text-xs text-muted-foreground mr-1">R$</span>
                        <input
                            ref={inputRef}
                            className={`w-20 px-1 py-0.5 text-right bg-white dark:bg-slate-800 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 ${isSaving ? 'opacity-50' : ''}`}
                            value={costValue}
                            onChange={handleCostChange}
                            onBlur={saveChanges}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </div>
                ) : (
                    <div
                        className={`cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-1 rounded transition-colors ${isSaving ? 'animate-pulse opacity-50' : ''}`}
                        onClick={startEditing}
                        title="Clique duplo ou clique para editar"
                    >
                        {formatCurrency(costValue !== '' && !isNaN(parseFloat(costValue)) ? parseFloat(costValue) : 0)}
                    </div>
                )}
            </div>
        </div>
    );
};

const InlineEditCheck = ({ transactionId, initialCheck, onUpdate }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [checkValue, setCheckValue] = React.useState(initialCheck != null ? Number(initialCheck).toFixed(2) : '0.00');
    const [isSaving, setIsSaving] = React.useState(false);
    const inputRef = React.useRef(null);

    const originalCheckRef = React.useRef(initialCheck);

    React.useEffect(() => {
        if (!isEditing && !isSaving) {
            setCheckValue(initialCheck != null ? Number(initialCheck).toFixed(2) : '0.00');
            originalCheckRef.current = initialCheck;
        }
    }, [initialCheck]);

    const startEditing = () => {
        if (isSaving) return;
        originalCheckRef.current = initialCheck;
        setIsEditing(true);
    };

    const handleCheckChange = (e) => {
        let val = e.target.value.replace(/[^0-9.,-]/g, '').replace(',', '.');
        setCheckValue(val);

        const numVal = parseFloat(val);
        if (!isNaN(numVal)) {
            if (onUpdate) onUpdate(numVal);
        }
    };

    const saveChanges = async () => {
        setIsEditing(false);
        const floatCheck = parseFloat(checkValue);

        if (isNaN(floatCheck)) {
            if (onUpdate) onUpdate(originalCheckRef.current);
            setCheckValue(originalCheckRef.current != null ? Number(originalCheckRef.current).toFixed(2) : '0.00');
            return;
        }

        if (Math.abs(floatCheck - (Number(originalCheckRef.current) || 0)) < 0.0001) {
            if (onUpdate) onUpdate(originalCheckRef.current);
            setCheckValue(originalCheckRef.current != null ? Number(originalCheckRef.current).toFixed(2) : '0.00');
            return;
        }

        setIsSaving(true);
        try {
            await api.relatorios.updateCheckColumn(transactionId, { check_column: floatCheck });
            originalCheckRef.current = floatCheck;
        } catch (err) {
            console.error('Failed to save check column:', err);
            if (onUpdate) onUpdate(originalCheckRef.current);
            setCheckValue(originalCheckRef.current != null ? Number(originalCheckRef.current).toFixed(2) : '0.00');
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            saveChanges();
            inputRef.current?.blur();
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
            if (onUpdate) onUpdate(originalCheckRef.current);
            setCheckValue(originalCheckRef.current != null ? Number(originalCheckRef.current).toFixed(2) : '0.00');
        }
    };

    return (
        <div className="flex flex-row items-center justify-end w-full gap-2 text-foreground font-medium">
            <div className="flex-1 text-right">
                {isEditing ? (
                    <div className="relative inline-flex items-center">
                        <span className="mr-1 text-xs text-muted-foreground mr-1">R$</span>
                        <input
                            ref={inputRef}
                            className={`w-20 px-1 py-0.5 text-right bg-white dark:bg-slate-800 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 ${isSaving ? 'opacity-50' : ''}`}
                            value={checkValue}
                            onChange={handleCheckChange}
                            onBlur={saveChanges}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </div>
                ) : (
                    <div
                        className={`cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40 px-1 rounded transition-colors ${isSaving ? 'animate-pulse opacity-50' : ''}`}
                        onClick={startEditing}
                        title="Clique duplo ou clique para editar"
                    >
                        {formatCurrency(checkValue !== '' && !isNaN(parseFloat(checkValue)) ? parseFloat(checkValue) : 0)}
                    </div>
                )}
            </div>
        </div>
    );
};

const EditableSaleRow = ({ row, index }) => {
    // Usamos state duplicado da row para que ela possa reagir sem remount agressivo da tabela pai
    const [localRow, setLocalRow] = React.useState(row);

    // Permite ao pai resetar ou forçar render novo se row data for atualizada via refresh
    React.useEffect(() => {
        setLocalRow(row);
    }, [row]);

    // Quando o InlineComponent salva, deixamos onUpdate syncar o R$ calculado no state local
    const handleCommissionUpdate = (newPct, newRs) => {
        setLocalRow(prev => ({
            ...prev,
            salesperson_comm_pct: newPct,
            salesperson_comm_rs: newRs
        }));
    };

    // Quando o InlineCost salva, tudo é afetado:
    const handleCostUpdate = (newUnitCost) => {
        setLocalRow(prev => {
            const quantity = Number(prev.quantity) || 0;
            const operationalCostPct = Number(prev.operational_cost_pct) || 0;
            const totalSale = Number(prev.total_sale) || 0;

            const newTotalCost = newUnitCost * quantity;

            // Margem Bruta
            const newGrossMargin = totalSale > 0 ? (totalSale - newTotalCost) / totalSale : 0;

            // Margem Liquida
            const newNetMarginPct = newGrossMargin - operationalCostPct;

            // Rentabilidade Liquida
            const newNetProfitability = totalSale * newNetMarginPct;

            return {
                ...prev,
                unit_cost: newUnitCost,
                total_cost: newTotalCost,
                gross_margin: newGrossMargin,
                net_margin_pct: newNetMarginPct,
                net_profitability: newNetProfitability,
                check_column: newUnitCost // Espelho de Custo Unitário
            };
        });
    };

    const handleCheckUpdate = (newCheck) => {
        setLocalRow(prev => ({
            ...prev,
            check_column: newCheck
        }));
    };

    return (
        <motion.tr
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index < 20 ? index * 0.02 : 0 }}
            className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
        >
            <TableCell className="font-mono text-muted-foreground">{localRow.product_code}</TableCell>
            <TableCell className="text-muted-foreground">{formatDate(localRow.sale_date)}</TableCell>
            <TableCell className="text-muted-foreground">{localRow.brand}</TableCell>
            <TableCell className="text-muted-foreground">{localRow.subgroup}</TableCell>
            <TableCell className="font-mono text-muted-foreground">{localRow.invoice_number}</TableCell>
            <TableCell className="truncate max-w-[200px] text-foreground font-medium" title={localRow.client_name}>{localRow.client_name}</TableCell>
            <TableCell className="text-muted-foreground">{localRow.branch}</TableCell>
            <TableCell className="text-muted-foreground">{localRow.salesperson}</TableCell>
            <TableCell className="text-muted-foreground">{localRow.payment_term}</TableCell>
            <TableCell className="truncate max-w-[250px] text-foreground" title={localRow.product}>{localRow.product}</TableCell>
            <TableCell className="text-right text-muted-foreground">{formatCurrency(localRow.unit_price)}</TableCell>
            <TableCell className="text-right text-muted-foreground">{localRow.quantity}</TableCell>
            <TableCell className="text-right font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10 p-1">
                <InlineEditCost
                    transactionId={localRow.id}
                    initialCost={row.unit_cost}
                    onUpdate={handleCostUpdate}
                />
            </TableCell>
            <TableCell className="text-right font-medium text-foreground">{formatCurrency(localRow.total_cost)}</TableCell>
            <TableCell className="text-right font-medium text-foreground">{formatCurrency(localRow.total_sale)}</TableCell>
            <TableCell className="text-right text-muted-foreground">{localRow.liters_qty}</TableCell>
            <TableCell className="text-right text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 p-1">
                <InlineEditCommission
                    transactionId={localRow.id}
                    initialPct={row.salesperson_comm_pct}
                    initialRs={row.salesperson_comm_rs}
                    baseAmount={localRow.total_sale}
                    onUpdate={handleCommissionUpdate}
                />
            </TableCell>
            <TableCell className="text-right font-medium text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                {formatCurrency(localRow.salesperson_comm_rs)}
            </TableCell>
            <TableCell className="text-right text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10">{formatPct(localRow.internal_comm_pct)}</TableCell>
            <TableCell className="text-right font-medium text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10">{formatCurrency(localRow.internal_comm_rs)}</TableCell>
            <TableCell className={`text-right ${getMarginColorClass(localRow.gross_margin)}`}>{formatPct(localRow.gross_margin)}</TableCell>
            <TableCell className="text-right text-muted-foreground p-1 bg-amber-50/30 dark:bg-amber-900/10">
                <InlineEditCheck
                    transactionId={localRow.id}
                    initialCheck={row.check_column}
                    onUpdate={handleCheckUpdate}
                />
            </TableCell>
            <TableCell className="text-right text-muted-foreground">{formatPct(localRow.operational_cost_pct)}</TableCell>
            <TableCell className="text-right text-orange-600 dark:text-orange-400">{formatCurrency(localRow.operational_cost_rs)}</TableCell>
            <TableCell className={`text-right ${getMarginColorClass(localRow.net_margin_pct)}`}>{formatPct(localRow.net_margin_pct)}</TableCell>
            <TableCell className="text-right font-bold text-foreground">{formatCurrency(localRow.net_profitability)}</TableCell>
            <TableCell className="text-muted-foreground">{localRow.ref_month}</TableCell>
            <TableCell className="text-muted-foreground">{localRow.ref_year}</TableCell>
            <TableCell className="text-muted-foreground">{localRow.packaging_type}</TableCell>
        </motion.tr>
    );
};

export default function SalesReportTable({
    data,
    pagination,
    summary,
    onPageChange,
    isLoading
}) {

    return (
        <Card className="flex flex-col border-0 shadow-lg bg-card">
            {/* Wrapper for horizontal/vertical scrolling */}
            <CardContent className="p-0 overflow-x-auto flex-1 relative">
                <Table className="relative w-full whitespace-nowrap text-sm">
                    <TableHeader className="sticky top-0 bg-card shadow-sm z-10">
                        <TableRow className="bg-muted/30 hover:bg-muted/30 border-b-0">
                            <TableHead className="font-semibold text-muted-foreground w-16">Cód</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-24">Data</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-32">Marca</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-32">Subgrupo</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-24">NF</TableHead>
                            <TableHead className="font-semibold text-muted-foreground min-w-[200px]">Cliente</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-32">Filial</TableHead>
                            <TableHead className="font-semibold text-muted-foreground min-w-[150px]">Vendedor</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-24">Prazo</TableHead>
                            <TableHead className="font-semibold text-muted-foreground min-w-[250px]">Produto</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-24 text-right">Venda Unit.</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-16 text-right">Qtd.</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-24 text-right">Custo Unit.</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-28 text-right">Custo Total</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-28 text-right">Venda Total</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-24 text-right">Litragem</TableHead>
                            <TableHead className="font-semibold text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 w-28 text-right">Com. Vend. %</TableHead>
                            <TableHead className="font-semibold text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 w-28 text-right">Com. Vend. R$</TableHead>
                            <TableHead className="font-semibold text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10 w-28 text-right">Com. Int. %</TableHead>
                            <TableHead className="font-semibold text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10 w-28 text-right">Com. Int. R$</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-24 text-right">M. Bruta</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-28 text-right">Conferência</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-28 text-right">Custo Oper. %</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-28 text-right">Custo Oper. R$</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-24 text-right">M. Líq. %</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-32 text-right">Rentab. Líq.</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-16">Mês</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-16">Ano</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-24">Embalagem</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={29} className="h-48 text-center text-muted-foreground">
                                        Carregando relatório...
                                    </TableCell>
                                </TableRow>
                            ) : data?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={29} className="h-48 text-center text-muted-foreground">
                                        Nenhuma venda encontrada para os filtros selecionados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data?.map((row, index) => (
                                    <EditableSaleRow key={row.id || index} row={row} index={index} />
                                ))
                            )}
                        </AnimatePresence>
                    </TableBody>
                    {!isLoading && data?.length > 0 && summary && (
                        <TableFooter className="sticky bottom-0 bg-card border-t shadow-[0_-1px_3px_rgba(0,0,0,0.05)] font-semibold z-10 w-full hover:bg-card">
                            <TableRow className="bg-muted/30 hover:bg-muted/30 border-none">
                                <TableCell colSpan={13} className="text-right pr-4 text-foreground uppercase font-bold text-xs">Totais da Página (Resumo de Filtros):</TableCell>
                                <TableCell className="text-right font-bold text-foreground">{formatCurrency(summary.total_cost)}</TableCell>
                                <TableCell className="text-right font-bold text-foreground">{formatCurrency(summary.total_sale)}</TableCell>
                                <TableCell className="text-right font-bold text-foreground">{summary.total_liters}</TableCell>
                                <TableCell colSpan={4}></TableCell>
                                <TableCell className={`text-right ${getMarginColorClass(summary.avg_gross_margin)}`}>{formatPct(summary.avg_gross_margin)}</TableCell>
                                <TableCell colSpan={3}></TableCell>
                                <TableCell className={`text-right ${getMarginColorClass(summary.avg_net_margin)}`}>{formatPct(summary.avg_net_margin)}</TableCell>
                                <TableCell colSpan={4}></TableCell>
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </CardContent>

            {/* Pagination Controls */}
            {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10 text-sm text-muted-foreground shrink-0 mt-auto">
                    <div>
                        Mostrando {data?.length || 0} de {pagination.total} registros
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page <= 1 || isLoading}
                            onClick={() => onPageChange(pagination.page - 1)}
                            className="h-8 w-8 p-0 border-muted-foreground/20 text-muted-foreground hover:bg-muted/50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="px-2 font-medium text-foreground">
                            Página {pagination.page} de {pagination.total_pages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page >= pagination.total_pages || isLoading}
                            onClick={() => onPageChange(pagination.page + 1)}
                            className="h-8 w-8 p-0 border-muted-foreground/20 text-muted-foreground hover:bg-muted/50"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
}

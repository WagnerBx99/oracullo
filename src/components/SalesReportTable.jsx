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
                            <TableHead className="font-semibold text-muted-foreground w-28 text-right">Com. Vend. %</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-28 text-right">Com. Vend. R$</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-28 text-right">Com. Int. %</TableHead>
                            <TableHead className="font-semibold text-muted-foreground w-28 text-right">Com. Int. R$</TableHead>
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
                                    <motion.tr
                                        key={row.id || index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index < 20 ? index * 0.02 : 0 }}
                                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                    >
                                        <TableCell className="font-mono text-muted-foreground">{row.product_code}</TableCell>
                                        <TableCell className="text-muted-foreground">{formatDate(row.sale_date)}</TableCell>
                                        <TableCell className="text-muted-foreground">{row.brand}</TableCell>
                                        <TableCell className="text-muted-foreground">{row.subgroup}</TableCell>
                                        <TableCell className="font-mono text-muted-foreground">{row.invoice_number}</TableCell>
                                        <TableCell className="truncate max-w-[200px] text-foreground font-medium" title={row.client_name}>{row.client_name}</TableCell>
                                        <TableCell className="text-muted-foreground">{row.branch}</TableCell>
                                        <TableCell className="text-muted-foreground">{row.salesperson}</TableCell>
                                        <TableCell className="text-muted-foreground">{row.payment_term}</TableCell>
                                        <TableCell className="truncate max-w-[250px] text-foreground" title={row.product}>{row.product}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{formatCurrency(row.unit_price)}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{row.quantity}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{formatCurrency(row.unit_cost)}</TableCell>
                                        <TableCell className="text-right font-medium text-foreground">{formatCurrency(row.total_cost)}</TableCell>
                                        <TableCell className="text-right font-medium text-foreground">{formatCurrency(row.total_sale)}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{row.liters_qty}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{formatPct(row.salesperson_comm_pct)}</TableCell>
                                        <TableCell className="text-right font-medium text-blue-600 dark:text-blue-400">{formatCurrency(row.salesperson_comm_rs)}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{formatPct(row.internal_comm_pct)}</TableCell>
                                        <TableCell className="text-right font-medium text-purple-600 dark:text-purple-400">{formatCurrency(row.internal_comm_rs)}</TableCell>
                                        <TableCell className={`text-right ${getMarginColorClass(row.gross_margin)}`}>{formatPct(row.gross_margin)}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{formatCurrency(row.check_column)}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{formatPct(row.operational_cost_pct)}</TableCell>
                                        <TableCell className="text-right text-orange-600 dark:text-orange-400">{formatCurrency(row.operational_cost_rs)}</TableCell>
                                        <TableCell className={`text-right ${getMarginColorClass(row.net_margin_pct)}`}>{formatPct(row.net_margin_pct)}</TableCell>
                                        <TableCell className="text-right font-bold text-foreground">{formatCurrency(row.net_profitability)}</TableCell>
                                        <TableCell className="text-muted-foreground">{row.ref_month}</TableCell>
                                        <TableCell className="text-muted-foreground">{row.ref_year}</TableCell>
                                        <TableCell className="text-muted-foreground">{row.packaging_type}</TableCell>
                                    </motion.tr>
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

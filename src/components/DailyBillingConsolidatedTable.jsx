import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight } from 'lucide-react';

const formatCurrency = (val) => {
    if (val == null) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export default function DailyBillingConsolidatedTable({ data, summary, isLoading, days, month }) {
    // Keep track of which branches are expanded
    // null or empty array means none, but let's default to all collapsed for neatness, or all expanded?
    const [expandedBranches, setExpandedBranches] = useState({});

    const toggleBranch = (branchName) => {
        setExpandedBranches(prev => ({
            ...prev,
            [branchName]: !prev[branchName]
        }));
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64 border rounded-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm mt-4">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
                    <p className="mt-4 text-slate-500 dark:text-slate-400">Carregando relatório consolidado...</p>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex justify-center items-center h-64 border rounded-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm mt-4">
                <p className="text-slate-500 dark:text-slate-400">Nenhum dado encontrado para os filtros selecionados.</p>
            </div>
        );
    }

    const dArray = days && days.length > 0 ? days : [new Date().getDate()];
    const getDayLabel = (d) => {
        if (!month) return 'Dia';
        return `${d.toString().padStart(2, '0')}/${Number(month).toString().padStart(2, '0')}`;
    };

    return (
        <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm mt-4 overflow-hidden flex flex-col h-full">
            <div className="relative w-full overflow-auto max-h-[800px]">
                <Table className="w-full caption-bottom text-sm relative">
                    <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
                        <TableRow className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <TableHead className="text-slate-900 dark:text-slate-200 font-semibold sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 whitespace-nowrap min-w-[300px] border-r">Filial / Marca</TableHead>
                            {dArray.map(d => (
                                <TableHead key={`th_cd_${d}`} className="text-slate-900 dark:text-slate-200 font-semibold text-right whitespace-nowrap min-w-[120px]">
                                    {getDayLabel(d)}
                                </TableHead>
                            ))}
                            <TableHead className="text-slate-900 dark:text-slate-200 font-semibold text-right bg-blue-50 dark:bg-blue-900/20 whitespace-nowrap min-w-[120px]">
                                Total Mensal
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((branchRow, index) => {
                            const isExpanded = expandedBranches[branchRow.branch];

                            return (
                                <React.Fragment key={index}>
                                    {/* Branch Header Row */}
                                    <TableRow
                                        className="border-b transition-colors hover:bg-muted/50 bg-slate-50/50 dark:bg-slate-800/50 cursor-pointer group"
                                        onClick={() => toggleBranch(branchRow.branch)}
                                    >
                                        <TableCell className="font-bold sticky left-0 z-10 bg-slate-50/90 dark:bg-slate-800/90 whitespace-nowrap border-r flex items-center gap-2">
                                            {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                                            {branchRow.branch}
                                        </TableCell>
                                        {dArray.map(d => (
                                            <TableCell key={`td_cb_${d}`} className="text-right font-semibold text-slate-700 dark:text-slate-300">
                                                {branchRow[`day_${d}`] > 0 ? formatCurrency(branchRow[`day_${d}`]) : '-'}
                                            </TableCell>
                                        ))}
                                        <TableCell className="text-right font-bold text-blue-800 dark:text-blue-300 bg-blue-100/30 dark:bg-blue-900/40">
                                            {formatCurrency(branchRow.total)}
                                        </TableCell>
                                    </TableRow>

                                    {/* Brand Detail Rows */}
                                    {isExpanded && branchRow.brands && branchRow.brands.map((brandRow, bIdx) => (
                                        <TableRow
                                            key={`${index}-${bIdx}`}
                                            className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted group"
                                        >
                                            <TableCell className="sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-muted/50 whitespace-nowrap border-r pl-8 text-slate-600 dark:text-slate-400">
                                                {brandRow.brand}
                                            </TableCell>
                                            {dArray.map(d => (
                                                <TableCell key={`td_cb2_${d}`} className="text-right text-slate-500 font-medium">
                                                    {brandRow[`day_${d}`] > 0 ? formatCurrency(brandRow[`day_${d}`]) : '-'}
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-right font-medium text-blue-700 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-900/10">
                                                {formatCurrency(brandRow.total)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </React.Fragment>
                            );
                        })}

                        {summary && (
                            <TableRow className="bg-slate-100 dark:bg-slate-800 font-bold sticky bottom-0 z-10 shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
                                <TableCell className="sticky left-0 z-20 bg-slate-100 dark:bg-slate-800 border-r border-t">TOTAL GLOBAL</TableCell>
                                {dArray.map(d => (
                                    <TableCell key={`td_cs_${d}`} className="text-right font-bold border-t">
                                        {summary[`day_${d}`] > 0 ? formatCurrency(summary[`day_${d}`]) : '-'}
                                    </TableCell>
                                ))}
                                <TableCell className="text-right text-blue-700 dark:text-blue-400 border-t">
                                    {formatCurrency(summary.total)}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

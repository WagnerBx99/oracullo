import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const formatCurrency = (val) => {
    if (val == null) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export default function DailyBillingTable({ data, summary, isLoading, daysInMonth = 31 }) {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64 border rounded-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm mt-4">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
                    <p className="mt-4 text-slate-500 dark:text-slate-400">Carregando relatório diário...</p>
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

    // Gerar array de dias dinâmico
    const daysArray = Array.from({ length: daysInMonth }, (_, index) => index + 1);

    return (
        <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm mt-4 overflow-hidden flex flex-col h-full">
            <div className="relative w-full overflow-auto max-h-[800px]">
                <Table className="w-full caption-bottom text-sm relative">
                    <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
                        <TableRow className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <TableHead className="text-slate-900 dark:text-slate-200 font-semibold sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 whitespace-nowrap min-w-[150px]">Filial</TableHead>
                            <TableHead className="text-slate-900 dark:text-slate-200 font-semibold sticky left-[150px] z-20 bg-slate-50 dark:bg-slate-900 whitespace-nowrap min-w-[200px] border-r">Vendedor</TableHead>
                            <TableHead className="text-slate-900 dark:text-slate-200 font-semibold text-right bg-blue-50 dark:bg-blue-900/20 whitespace-nowrap min-w-[120px]">Total Mensal</TableHead>
                            {daysArray.map(day => (
                                <TableHead key={day} className="text-slate-900 dark:text-slate-200 font-semibold text-right whitespace-nowrap min-w-[100px]">
                                    Dia {day.toString().padStart(2, '0')}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, index) => (
                            <TableRow
                                key={index}
                                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted group"
                            >
                                <TableCell className="font-medium sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-muted/50 whitespace-nowrap">{row.branch}</TableCell>
                                <TableCell className="text-slate-500 sticky left-[150px] z-10 bg-white dark:bg-slate-900 group-hover:bg-muted/50 whitespace-nowrap border-r">{row.salesperson}</TableCell>
                                <TableCell className="text-right font-bold text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                                    {formatCurrency(row.total)}
                                </TableCell>
                                {daysArray.map(day => (
                                    <TableCell key={day} className="text-right text-slate-500">
                                        {row[`day_${day}`] > 0 ? formatCurrency(row[`day_${day}`]) : '-'}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                        {summary && (
                            <TableRow className="bg-slate-100 dark:bg-slate-800 font-bold sticky bottom-0 z-10 shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
                                <TableCell className="sticky left-0 z-20 bg-slate-100 dark:bg-slate-800 border-t">TOTAL</TableCell>
                                <TableCell className="sticky left-[150px] z-20 bg-slate-100 dark:bg-slate-800 border-r border-t">-</TableCell>
                                <TableCell className="text-right text-blue-700 dark:text-blue-400 border-t">{formatCurrency(summary.total)}</TableCell>
                                {daysArray.map(day => (
                                    <TableCell key={day} className="text-right border-t">
                                        {summary[`day_${day}`] > 0 ? formatCurrency(summary[`day_${day}`]) : '-'}
                                    </TableCell>
                                ))}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronRight, ChevronDown } from 'lucide-react';

const formatCurrency = (val) => {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const formatNumber = (val) => {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('pt-BR').format(val);
};

const formatPct = (val) => {
    if (val === null || val === undefined) return '-';
    return (val * 100).toFixed(2) + '%';
};

export default function AnnualConsolidatedTable({ data, summary, isLoading, year, selectedMonths = [] }) {
    // Keep track of which branches are expanded
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
                <div className="flex flex-col items-center text-slate-500 dark:text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100 mb-4"></div>
                    Carregando tabela consolidada...
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex justify-center items-center h-64 border rounded-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm mt-4">
                <p className="text-slate-500 dark:text-slate-400">Nenhum dado encontrado para o período selecionado.</p>
            </div>
        );
    }

    const monthsArray = selectedMonths && selectedMonths.length > 0
        ? [...selectedMonths].sort((a, b) => a - b)
        : [new Date().getMonth() + 1];

    // Calculate the divisor for the YTD average.
    // If the selected year is in the past, divide by 12. If it's the current year, divide by the current month (or max 1).
    const getMonthsDivisor = (reportYear) => {
        const currentYear = new Date().getFullYear();
        if (reportYear < currentYear) return 12;
        if (reportYear > currentYear) return 1;
        return Math.max(1, new Date().getMonth() + 1);
    };
    const divisor = getMonthsDivisor(year);

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    return (
        <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950 shadow-sm relative w-full h-[600px] overflow-scroll">
            <Table className="w-max min-w-full text-xs">
                <TableHeader className="sticky top-0 z-20 bg-slate-50 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
                    <TableRow className="hover:bg-transparent">
                        {/* FIRST ROW OF HEADERS - MONTHS */}
                        <TableHead className="w-56 bg-slate-100 dark:bg-slate-900 sticky left-0 z-30 font-bold text-slate-800 dark:text-slate-100 uppercase py-2 px-3 align-bottom border-r border-slate-200 dark:border-slate-800" rowSpan={2}>
                            Marca
                        </TableHead>

                        {monthsArray.map((m) => (
                            <TableHead
                                key={`header_m_${m}`}
                                colSpan={4}
                                className="text-center font-bold text-slate-800 dark:text-slate-200 py-1 bg-slate-50 dark:bg-slate-900 border-x border-slate-200 dark:border-slate-800"
                            >
                                {monthNames[m - 1]} / {year}
                            </TableHead>
                        ))}

                        <TableHead colSpan={4} className="text-center font-bold bg-slate-800 text-white dark:bg-slate-800 dark:text-white py-1 uppercase tracking-wider">
                            Total Geral
                        </TableHead>

                        <TableHead colSpan={4} className="text-center font-bold bg-indigo-700 text-white dark:bg-indigo-900 dark:text-white py-1 uppercase tracking-wider">
                            Média Mensal
                        </TableHead>
                    </TableRow>

                    <TableRow className="hover:bg-transparent">
                        {/* SECOND ROW OF HEADERS - SUBMETRICS */}
                        {monthsArray.map((m) => (
                            <React.Fragment key={`subheader_m_${m}`}>
                                <TableHead className="text-right py-2 px-2 font-semibold text-slate-600 dark:text-slate-300 min-w-[100px] bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
                                    Fat. Líquido
                                </TableHead>
                                <TableHead className="text-right py-2 px-2 font-semibold text-slate-600 dark:text-slate-300 min-w-[100px] bg-slate-50 dark:bg-slate-900">
                                    Custo Reposição
                                </TableHead>
                                <TableHead className="text-right py-2 px-2 font-semibold text-slate-600 dark:text-slate-300 min-w-[70px] bg-slate-50 dark:bg-slate-900">
                                    Qtdd.
                                </TableHead>
                                <TableHead className="text-right py-2 px-2 font-semibold text-slate-600 dark:text-slate-300 min-w-[70px] bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
                                    % MG
                                </TableHead>
                            </React.Fragment>
                        ))}

                        <TableHead className="text-right py-2 px-2 font-bold text-slate-100 bg-slate-700 dark:bg-slate-800/80 min-w-[100px]">Fat. Líquido</TableHead>
                        <TableHead className="text-right py-2 px-2 font-bold text-slate-100 bg-slate-700 dark:bg-slate-800/80 min-w-[100px]">Custo Reposição</TableHead>
                        <TableHead className="text-right py-2 px-2 font-bold text-slate-100 bg-slate-700 dark:bg-slate-800/80 min-w-[70px]">Qtdd.</TableHead>
                        <TableHead className="text-right py-2 px-2 font-bold text-slate-100 bg-slate-700 dark:bg-slate-800/80 min-w-[70px] border-r border-slate-800">% MG</TableHead>

                        <TableHead className="text-right py-2 px-2 font-bold text-slate-100 bg-indigo-600 dark:bg-indigo-800/80 min-w-[100px]">Fat. Líquido</TableHead>
                        <TableHead className="text-right py-2 px-2 font-bold text-slate-100 bg-indigo-600 dark:bg-indigo-800/80 min-w-[100px]">Custo Reposição</TableHead>
                        <TableHead className="text-right py-2 px-2 font-bold text-slate-100 bg-indigo-600 dark:bg-indigo-800/80 min-w-[70px]">Qtdd.</TableHead>
                        <TableHead className="text-right py-2 px-2 font-bold text-slate-100 bg-indigo-600 dark:bg-indigo-800/80 min-w-[70px]">% MG</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {data.map((branchRow, index) => {
                        const isExpanded = expandedBranches[branchRow.branch] || false;
                        const isEvenBranch = index % 2 === 0;

                        return (
                            <React.Fragment key={`branch_${branchRow.branch}`}>
                                {/* PARENT ROW: BRANCH */}
                                <TableRow
                                    className={`cursor-pointer transition-colors hover:bg-slate-200 dark:hover:bg-slate-800/80 ${isEvenBranch ? 'bg-slate-100 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-950'}`}
                                    onClick={() => toggleBranch(branchRow.branch)}
                                >
                                    {/* Locked Branch Column */}
                                    <TableCell className="font-bold text-slate-800 dark:text-slate-200 sticky left-0 z-10 whitespace-nowrap px-3 py-3 border-r border-slate-300 dark:border-slate-700"
                                        style={{ backgroundColor: isEvenBranch ? 'rgb(241 245 249)' : 'white' }}
                                    >
                                        <div className="flex items-center dark:bg-transparent" style={{ backgroundColor: 'inherit' }}>
                                            {isExpanded ? (
                                                <ChevronDown className="w-4 h-4 mr-1.5 text-slate-500" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 mr-1.5 text-slate-500" />
                                            )}
                                            {branchRow.branch}
                                        </div>
                                    </TableCell>

                                    {/* Monthly Metrics (Branch Level) */}
                                    {monthsArray.map((m) => {
                                        const metrics = branchRow[`month_${m}`];
                                        return (
                                            <React.Fragment key={`branch_${branchRow.branch}_m_${m}`}>
                                                <TableCell className="text-right px-2 py-3 font-semibold text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-800">
                                                    {formatCurrency(metrics.revenue)}
                                                </TableCell>
                                                <TableCell className="text-right px-2 py-3 text-slate-500 dark:text-slate-400">
                                                    {formatCurrency(metrics.cost)}
                                                </TableCell>
                                                <TableCell className="text-right px-2 py-3 text-slate-500 dark:text-slate-400">
                                                    {formatNumber(metrics.qty)}
                                                </TableCell>
                                                <TableCell className="text-right px-2 py-3 font-medium text-emerald-600 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-900/10">
                                                    {formatPct(metrics.margin)}
                                                </TableCell>
                                            </React.Fragment>
                                        );
                                    })}

                                    {/* Total Metrics (Branch Level) */}
                                    <TableCell className="text-right px-2 py-3 font-bold text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 shadow-[inset_1px_0_0_0_rgb(226,232,240)] dark:shadow-[inset_1px_0_0_0_rgb(30,41,59)]">
                                        {formatCurrency(branchRow.total.revenue)}
                                    </TableCell>
                                    <TableCell className="text-right px-2 py-3 font-semibold text-rose-600 dark:text-rose-400 bg-blue-50/50 dark:bg-blue-900/20">
                                        {formatCurrency(branchRow.total.cost)}
                                    </TableCell>
                                    <TableCell className="text-right px-2 py-3 font-semibold text-slate-700 dark:text-slate-300 bg-blue-50/50 dark:bg-blue-900/20">
                                        {formatNumber(branchRow.total.qty)}
                                    </TableCell>
                                    <TableCell className="text-right px-2 py-3 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30 border-r border-slate-200 dark:border-slate-800 shadow-[inset_1px_0_0_0_rgb(209,250,229)] dark:shadow-[inset_1px_0_0_0_rgb(6,78,59)]">
                                        {formatPct(branchRow.total.margin)}
                                    </TableCell>

                                    {/* Average Metrics (Branch Level) */}
                                    <TableCell className="text-right px-2 py-3 font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-900/10 shadow-[inset_1px_0_0_0_rgb(224,231,255)] dark:shadow-[inset_1px_0_0_0_rgb(49,46,129)]">
                                        {formatCurrency(branchRow.total.revenue / divisor)}
                                    </TableCell>
                                    <TableCell className="text-right px-2 py-3 font-semibold text-rose-500 dark:text-rose-400 bg-indigo-50/30 dark:bg-indigo-900/10">
                                        {formatCurrency(branchRow.total.cost / divisor)}
                                    </TableCell>
                                    <TableCell className="text-right px-2 py-3 font-semibold text-slate-600 dark:text-slate-400 bg-indigo-50/30 dark:bg-indigo-900/10">
                                        {formatNumber(branchRow.total.qty / divisor)}
                                    </TableCell>
                                    <TableCell className="text-right px-2 py-3 font-bold text-emerald-600 dark:text-emerald-400 bg-indigo-50/30 dark:bg-indigo-900/10">
                                        {formatPct(branchRow.total.margin)}
                                    </TableCell>
                                </TableRow>

                                {/* CHILD ROWS: BRANDS */}
                                {isExpanded && branchRow.brands && branchRow.brands.map((brandRow, bIndex) => {
                                    const isEvenBrandRow = bIndex % 2 === 0;
                                    const childBg = isEvenBrandRow ? 'bg-white dark:bg-slate-900/30' : 'bg-slate-50/50 dark:bg-slate-900/50';
                                    const stickyChildBg = isEvenBrandRow ? 'white' : 'rgb(248 250 252)';

                                    return (
                                        <TableRow
                                            key={`branch_${branchRow.branch}_brand_${brandRow.brand}`}
                                            className={`${childBg} hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800/50`}
                                        >
                                            {/* Locked Brand Column */}
                                            <TableCell className="text-slate-600 dark:text-slate-400 pl-8 pr-3 py-2 border-r border-slate-200 dark:border-slate-800 sticky left-0 z-10 whitespace-nowrap"
                                                style={{ backgroundColor: stickyChildBg }}
                                            >
                                                {brandRow.brand}
                                            </TableCell>

                                            {/* Monthly Metrics (Brand Level) */}
                                            {monthsArray.map((m) => {
                                                const metrics = brandRow[`month_${m}`];
                                                return (
                                                    <React.Fragment key={`brand_${brandRow.brand}_m_${m}`}>
                                                        <TableCell className="text-right px-2 py-2 text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-transparent">
                                                            {formatCurrency(metrics.revenue)}
                                                        </TableCell>
                                                        <TableCell className="text-right px-2 py-2 text-slate-500 dark:text-slate-500">
                                                            {formatCurrency(metrics.cost)}
                                                        </TableCell>
                                                        <TableCell className="text-right px-2 py-2 text-slate-500 dark:text-slate-500">
                                                            {formatNumber(metrics.qty)}
                                                        </TableCell>
                                                        <TableCell className="text-right px-2 py-2 font-medium text-emerald-600/80 dark:text-emerald-500/80 border-r border-slate-200 dark:border-slate-800 bg-emerald-50/20 dark:bg-transparent">
                                                            {formatPct(metrics.margin)}
                                                        </TableCell>
                                                    </React.Fragment>
                                                );
                                            })}

                                            {/* Total Metrics (Brand Level) */}
                                            <TableCell className="text-right px-2 py-2 font-semibold text-blue-700/90 dark:text-blue-400/90 bg-blue-50/30 dark:bg-blue-900/10 shadow-[inset_1px_0_0_0_rgb(226,232,240)] dark:shadow-[inset_1px_0_0_0_rgb(30,41,59)]">
                                                {formatCurrency(brandRow.total.revenue)}
                                            </TableCell>
                                            <TableCell className="text-right px-2 py-2 text-rose-600/90 dark:text-rose-400/90 bg-blue-50/30 dark:bg-blue-900/10">
                                                {formatCurrency(brandRow.total.cost)}
                                            </TableCell>
                                            <TableCell className="text-right px-2 py-2 text-slate-600 dark:text-slate-400 bg-blue-50/30 dark:bg-blue-900/10">
                                                {formatNumber(brandRow.total.qty)}
                                            </TableCell>
                                            <TableCell className="text-right px-2 py-2 font-semibold text-emerald-600/90 dark:text-emerald-400/90 bg-emerald-50/50 dark:bg-emerald-900/20 border-r border-slate-200 dark:border-slate-800 shadow-[inset_1px_0_0_0_rgb(209,250,229)] dark:shadow-[inset_1px_0_0_0_rgb(6,78,59)]">
                                                {formatPct(brandRow.total.margin)}
                                            </TableCell>

                                            {/* Average Metrics (Brand Level) */}
                                            <TableCell className="text-right px-2 py-2 font-semibold text-indigo-700/90 dark:text-indigo-400/90 bg-indigo-50/20 dark:bg-indigo-900/5 shadow-[inset_1px_0_0_0_rgb(224,231,255)] dark:shadow-[inset_1px_0_0_0_rgb(49,46,129)]">
                                                {formatCurrency(brandRow.total.revenue / divisor)}
                                            </TableCell>
                                            <TableCell className="text-right px-2 py-2 text-rose-500/90 dark:text-rose-400/90 bg-indigo-50/20 dark:bg-indigo-900/5">
                                                {formatCurrency(brandRow.total.cost / divisor)}
                                            </TableCell>
                                            <TableCell className="text-right px-2 py-2 text-slate-500 dark:text-slate-400 bg-indigo-50/20 dark:bg-indigo-900/5">
                                                {formatNumber(brandRow.total.qty / divisor)}
                                            </TableCell>
                                            <TableCell className="text-right px-2 py-2 font-semibold text-emerald-600/90 dark:text-emerald-400/90 bg-indigo-50/20 dark:bg-indigo-900/5 text-[11px]">
                                                {formatPct(brandRow.total.margin)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </React.Fragment>
                        );
                    })}

                    {/* GRAND SUMMARY ROW */}
                    {summary && (
                        <TableRow className="bg-slate-800 hover:bg-slate-800 dark:bg-slate-900 dark:hover:bg-slate-900">
                            <TableCell className="font-bold text-white uppercase sticky left-0 z-10 whitespace-nowrap px-3 py-4 border-r border-slate-700 bg-slate-800 dark:bg-slate-900 shadow-[inset_0_1px_0_0_rgb(51,65,85)]">
                                Faturamento Total
                            </TableCell>

                            {monthsArray.map((m) => {
                                const metrics = summary[`month_${m}`];
                                return (
                                    <React.Fragment key={`summary_m_${m}`}>
                                        <TableCell className="text-right px-2 py-4 font-bold text-white border-l border-slate-700 shadow-[inset_0_1px_0_0_rgb(51,65,85)]">
                                            {formatCurrency(metrics.revenue)}
                                        </TableCell>
                                        <TableCell className="text-right px-2 py-4 font-semibold text-rose-300 shadow-[inset_0_1px_0_0_rgb(51,65,85)]">
                                            {formatCurrency(metrics.cost)}
                                        </TableCell>
                                        <TableCell className="text-right px-2 py-4 font-semibold text-slate-300 shadow-[inset_0_1px_0_0_rgb(51,65,85)]">
                                            {formatNumber(metrics.qty)}
                                        </TableCell>
                                        <TableCell className="text-right px-2 py-4 font-bold text-emerald-400 border-r border-slate-700 shadow-[inset_0_1px_0_0_rgb(51,65,85)]">
                                            {formatPct(metrics.margin)}
                                        </TableCell>
                                    </React.Fragment>
                                );
                            })}

                            <TableCell className="text-right px-2 py-4 font-bold text-blue-300 bg-slate-950/50 shadow-[inset_1px_0_0_0_rgb(51,65,85),inset_0_1px_0_0_rgb(51,65,85)]">
                                {formatCurrency(summary.total.revenue)}
                            </TableCell>
                            <TableCell className="text-right px-2 py-4 font-bold text-rose-400 bg-slate-950/50 shadow-[inset_0_1px_0_0_rgb(51,65,85)]">
                                {formatCurrency(summary.total.cost)}
                            </TableCell>
                            <TableCell className="text-right px-2 py-4 font-bold text-slate-200 bg-slate-950/50 shadow-[inset_0_1px_0_0_rgb(51,65,85)]">
                                {formatNumber(summary.total.qty)}
                            </TableCell>
                            <TableCell className="text-right px-2 py-4 font-bold text-emerald-400 bg-slate-950/50 border-r border-slate-700 shadow-[inset_1px_0_0_0_rgb(16,185,129),inset_0_1px_0_0_rgb(51,65,85)] text-[13px]">
                                {formatPct(summary.total.margin)}
                            </TableCell>

                            <TableCell className="text-right px-2 py-4 font-bold text-indigo-300 bg-slate-900/80 shadow-[inset_1px_0_0_0_rgb(51,65,85),inset_0_1px_0_0_rgb(51,65,85)]">
                                {formatCurrency(summary.total.revenue / divisor)}
                            </TableCell>
                            <TableCell className="text-right px-2 py-4 font-bold text-rose-300 bg-slate-900/80 shadow-[inset_0_1px_0_0_rgb(51,65,85)]">
                                {formatCurrency(summary.total.cost / divisor)}
                            </TableCell>
                            <TableCell className="text-right px-2 py-4 font-bold text-slate-300 bg-slate-900/80 shadow-[inset_0_1px_0_0_rgb(51,65,85)]">
                                {formatNumber(summary.total.qty / divisor)}
                            </TableCell>
                            <TableCell className="text-right px-2 py-4 font-bold text-emerald-400 bg-slate-900/80 shadow-[inset_1px_0_0_0_rgb(16,185,129),inset_0_1px_0_0_rgb(51,65,85)] text-[13px]">
                                {formatPct(summary.total.margin)}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

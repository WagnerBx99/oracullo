import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPercentage as formatPercent } from "@/utils/formatters";

export default function BrandTable({ brands, title, showManagerComm = false }) {
    if (!brands || brands.length === 0) return null;

    return (
        <Card className="shadow-md mb-6 border border-slate-200 dark:border-slate-800 border-x-0 w-full">
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 sticky left-0 z-10 w-full">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
            </div>
            <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/50 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3 font-medium border-b sticky left-0 bg-slate-50 dark:bg-slate-900/50 z-10 shadow-[1px_0_0_0_#e2e8f0] dark:shadow-[1px_0_0_0_#1e293b]">Marca</th>
                            <th className="px-4 py-3 font-medium border-b shrink-0 text-right">Rank.</th>
                            <th className="px-4 py-3 font-medium border-b shrink-0 text-right">Faturamento</th>
                            <th className="px-4 py-3 font-medium border-b shrink-0 text-right">Custo</th>
                            <th className="px-4 py-3 font-medium border-b shrink-0 text-right">Litros / Qtd.</th>
                            <th className="px-4 py-3 font-medium border-b shrink-0 text-right">Ticket Médio</th>
                            <th className="px-4 py-3 font-medium border-b shrink-0 text-right">M. Bruta</th>
                            <th className="px-4 py-3 font-medium border-b shrink-0 text-right">Custo Oper. %</th>
                            <th className="px-4 py-3 font-medium border-b shrink-0 text-right">Custo Oper. R$</th>
                            <th className="px-4 py-3 font-medium border-b shrink-0 text-right">M. Líquida %</th>
                            <th className="px-4 py-3 font-medium border-b shrink-0 text-right">Rentab. Líquida</th>
                            <th className="px-4 py-3 font-medium border-b shrink-0 text-right">Com. Vendedor %</th>
                            <th className="px-4 py-3 font-medium border-b shrink-0 text-right">Com. Vendedor R$</th>
                            <th className="px-4 py-3 font-medium border-b shrink-0 text-right">Com. Interna %</th>
                            <th className="px-4 py-3 font-medium border-b shrink-0 text-right">Com. Interna R$</th>
                            {showManagerComm && <th className="px-4 py-3 font-medium border-b shrink-0 text-right text-orange-600 dark:text-orange-500">Com. Gerente %</th>}
                            {showManagerComm && <th className="px-4 py-3 font-medium border-b shrink-0 text-right text-orange-600 dark:text-orange-500">Com. Gerente R$</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {brands.map((b, i) => {
                            const isTotal = b.brand === 'TOTAL';
                            const rowClass = isTotal ? 'bg-slate-50/80 dark:bg-slate-800/80 font-semibold' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors';

                            // Conditional Colors
                            const grossCol = b.gross_margin > 0.3 ? 'text-green-600' : (b.gross_margin < 0.1 ? 'text-red-600' : 'text-yellow-600');
                            const netCol = b.net_margin_pct > 0.3 ? 'text-green-600' : (b.net_margin_pct < 0.1 ? 'text-red-600' : 'text-yellow-600');

                            // Cell Style Helper
                            const cx = (val, FormatterFunc, customCol) => (
                                <td className={`px-4 py-3 text-right ${customCol || 'text-slate-600 dark:text-slate-300'}`}>
                                    {val == null ? '-' : FormatterFunc(val)}
                                </td>
                            );

                            return (
                                <tr key={i} className={rowClass}>
                                    <td className={`px-4 py-3 sticky left-0 z-10 shadow-[1px_0_0_0_#e2e8f0] dark:shadow-[1px_0_0_0_#1e293b] ${isTotal ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold' : 'bg-white dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 font-medium'}`}>
                                        {b.brand}
                                    </td>
                                    {cx(b.rank, formatPercent)}
                                    {cx(b.revenue, formatCurrency)}
                                    {cx(b.cost, formatCurrency)}
                                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{b.liters_qty}</td>
                                    {cx(b.avg_ticket, formatCurrency)}
                                    <td className={`px-4 py-3 text-right font-medium ${grossCol}`}>{formatPercent(b.gross_margin)}</td>
                                    {cx(b.operational_cost_pct, formatPercent)}
                                    {cx(b.operational_cost_rs, formatCurrency)}
                                    <td className={`px-4 py-3 text-right font-medium ${netCol}`}>{formatPercent(b.net_margin_pct)}</td>
                                    {cx(b.net_profitability, formatCurrency, b.net_profitability < 0 ? 'text-red-600' : 'text-green-600 font-medium')}
                                    {cx(b.salesperson_comm_pct, formatPercent)}
                                    {cx(b.salesperson_comm_rs, formatCurrency)}
                                    {cx(b.internal_comm_pct, formatPercent)}
                                    {cx(b.internal_comm_rs, formatCurrency)}
                                    {showManagerComm && cx(b.manager_comm_pct, formatPercent, 'text-orange-600 dark:text-orange-400 font-medium')}
                                    {showManagerComm && cx(b.manager_comm_rs, formatCurrency, 'text-orange-600 dark:text-orange-400 font-medium')}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
}

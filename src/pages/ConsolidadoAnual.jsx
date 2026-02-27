import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';
import SalesReportFilters from '@/components/SalesReportFilters';
import AnnualConsolidatedTable from '@/components/AnnualConsolidatedTable';

export default function ConsolidadoAnual() {
    const { toast } = useToast();

    const [statesList, setStatesList] = useState([]);

    const [appliedFilters, setAppliedFilters] = useState({
        year: new Date().getFullYear(),
        month: [new Date().getMonth() + 1],
        state: []
    });

    const [reportsData, setReportsData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch available states on mount
    useEffect(() => {
        const fetchStates = async () => {
            try {
                const states = await api.reports.states();
                setStatesList(states);
            } catch (error) {
                console.error('Failed to load states:', error);
                toast({
                    title: "Erro",
                    description: "Não foi possível carregar a lista de estados.",
                    variant: "destructive"
                });
            }
        };
        fetchStates();
    }, [toast]);

    const handleApplyFilters = async (newFilters) => {
        if (!newFilters.state || newFilters.state.length === 0) {
            toast({
                title: "Atenção",
                description: "Selecione pelo menos um estado.",
                variant: "warning"
            });
            return;
        }

        if (!newFilters.year) {
            toast({
                title: "Atenção",
                description: "Selecione o ano.",
                variant: "warning"
            });
            return;
        }

        setAppliedFilters(newFilters);
        setIsLoading(true);

        try {
            const promises = newFilters.state.map(state =>
                api.reports.annualConsolidated(state, { year: newFilters.year })
                    .then(res => ({ state, ...res }))
            );

            const results = await Promise.all(promises);
            setReportsData(results);

            if (results.length === 0) {
                toast({
                    title: "Aviso",
                    description: "Nenhum dado encontrado para os filtros selecionados.",
                    variant: "info"
                });
            }
        } catch (error) {
            console.error('Error fetching annual consolidated data:', error);
            toast({
                title: "Erro",
                description: "Ocorreu um erro ao buscar os dados do relatório.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate Global Summary across all active states
    const globalSummary = {
        total: { revenue: 0, cost: 0, qty: 0 }
    };
    for (let i = 1; i <= 12; i++) globalSummary[`month_${i}`] = { revenue: 0, cost: 0, qty: 0 };

    reportsData.forEach(st => {
        if (st.summary) {
            globalSummary.total.revenue += st.summary.total.revenue;
            globalSummary.total.cost += st.summary.total.cost;
            globalSummary.total.qty += st.summary.total.qty;

            for (let i = 1; i <= 12; i++) {
                globalSummary[`month_${i}`].revenue += st.summary[`month_${i}`].revenue;
                globalSummary[`month_${i}`].cost += st.summary[`month_${i}`].cost;
                globalSummary[`month_${i}`].qty += st.summary[`month_${i}`].qty;
            }
        }
    });

    const calculateMargin = (metrics) => {
        if (metrics.revenue === 0) return 0;
        return ((metrics.revenue - metrics.cost) / metrics.revenue);
    };

    globalSummary.total.margin = calculateMargin(globalSummary.total);
    for (let i = 1; i <= 12; i++) {
        globalSummary[`month_${i}`].margin = calculateMargin(globalSummary[`month_${i}`]);
    }

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Fechamento Consolidado Anual</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Visualização anual do faturamento cruzando Filiais, Marcas e Meses.
                </p>
            </div>

            <SalesReportFilters
                filters={appliedFilters}
                setFilters={setAppliedFilters}
                onApply={() => handleApplyFilters(appliedFilters)}
                onExport={() => { }}
                statesList={statesList}
                options={{ salespersons: [], branches: [] }}
                isLoading={isLoading}
                isExporting={false}
                multiState={true}
                multiMonth={true}
                activeTab="consolidado"
            />

            {isLoading && (
                <div className="flex justify-center items-center h-64 border rounded-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm mt-4">
                    <div className="flex flex-col items-center text-slate-500 dark:text-slate-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-slate-100 mb-4"></div>
                        Carregando relatório consolidado anual...
                    </div>
                </div>
            )}

            {!isLoading && reportsData.map(({ state, data, summary }) => (
                <div key={state} className="bg-white dark:bg-slate-900 rounded-lg shadow border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{state} - Consolidado {appliedFilters.year}</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <AnnualConsolidatedTable
                            data={data}
                            summary={summary}
                            year={appliedFilters.year}
                            selectedMonths={appliedFilters.month}
                        />
                    </div>
                </div>
            ))}

            {!isLoading && reportsData.length > 0 && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-950 rounded-xl shadow-xl overflow-hidden border border-slate-700">
                    <div className="p-6 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                Resumo Global - Todos os Estados
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">Consolidação total do ano de {appliedFilters.year}</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
                                <p className="text-slate-400 text-sm font-medium mb-1">Faturamento Bruto Anual</p>
                                <p className="text-3xl font-bold text-emerald-400">{formatCurrency(globalSummary.total.revenue)}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
                                <p className="text-slate-400 text-sm font-medium mb-1">Custo de Reposição Anual</p>
                                <p className="text-3xl font-bold text-rose-400">{formatCurrency(globalSummary.total.cost)}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
                                <p className="text-slate-400 text-sm font-medium mb-1">Quantidade Total Vendida</p>
                                <p className="text-3xl font-bold text-blue-400">{new Intl.NumberFormat('pt-BR').format(globalSummary.total.qty)} un/L</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
                                <p className="text-slate-400 text-sm font-medium mb-1">Margem Global</p>
                                <p className="text-3xl font-bold text-white">{(globalSummary.total.margin * 100).toFixed(2)}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

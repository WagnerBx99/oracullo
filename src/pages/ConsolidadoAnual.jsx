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

    const handleExport = () => {
        if (!appliedFilters.state || appliedFilters.state.length === 0 || !appliedFilters.year || !appliedFilters.month || appliedFilters.month.length === 0) {
            toast({
                title: "Atenção",
                description: "Selecione ao menos um estado, um ano e um mês para exportar.",
                variant: "warning"
            });
            return;
        }

        const params = {
            states: appliedFilters.state.join(','),
            year: appliedFilters.year,
            months: appliedFilters.month.join(',')
        };

        const exportUrl = api.reports.exportAnnualConsolidatedUrl(params);
        window.open(exportUrl, '_blank');
    };

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
                onExport={handleExport}
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
                <div key={state} className="mt-8 space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{state} - Consolidado {appliedFilters.year}</h2>
                    <AnnualConsolidatedTable
                        data={data}
                        summary={summary}
                        year={appliedFilters.year}
                        selectedMonths={appliedFilters.month}
                    />
                </div>
            ))}


        </div>
    );
}

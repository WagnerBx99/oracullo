import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SalesReportFilters from '@/components/SalesReportFilters';
import DailyBillingTable from '@/components/DailyBillingTable';
import DailyBillingConsolidatedTable from '@/components/DailyBillingConsolidatedTable';

export default function FaturamentoDiario() {
    const { toast } = useToast();

    // In multi-state mode, 'state' is an array
    const [filters, setFilters] = useState({
        state: [],
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        salesperson: '',
        branch: ''
    });

    const [reportType, setReportType] = useState('vendedores'); // 'vendedores' or 'consolidado'

    const [statesList, setStatesList] = useState([]);
    const [filterOptions, setFilterOptions] = useState({ salespersons: [], branches: [] });

    // State to hold the filters that were actually applied and used to fetch the current data
    const [appliedFilters, setAppliedFilters] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    // Store responses mapped by state name: [{ state: 'PR', data: [...], summary: {...}, metadata: {...} }]
    const [reportsData, setReportsData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const fetchStates = async () => {
            try {
                const states = await api.reports.states();
                setStatesList(states);
                if (states.length > 0) {
                    setFilters(prev => ({ ...prev, state: [states[0]] })); // initialize with the first state (in an array)
                }
            } catch (err) {
                toast({
                    title: "Erro ao buscar estados",
                    description: err.message || "Tente novamente mais tarde.",
                    variant: "destructive",
                });
            }
        };
        fetchStates();
    }, [toast]);

    useEffect(() => {
        const fetchFilterOptions = async () => {
            const currentStates = filters.state;
            if (!currentStates || currentStates.length === 0) return;

            // To be safe, we fetch filters for the first selected state, or ideally we'd combine them
            // In a real scenario, salespeople and branches might differ per state. Assuming we check the first for now.
            const primaryState = currentStates[0];

            try {
                const res = await api.reports.filters(primaryState);
                setFilterOptions(res || { salespersons: [], branches: [] });
            } catch (err) {
                toast({
                    title: "Erro ao buscar filtros globais",
                    variant: "destructive",
                });
            }
        };

        setFilters(prev => ({ ...prev, salesperson: '', branch: '' }));
        setReportsData([]); // clear reports dataset when state selection changes

        fetchFilterOptions();
    }, [filters.state, toast]);

    const fetchReportData = async () => {
        const currentStates = filters.state;
        if (!currentStates || currentStates.length === 0 || !filters.month || !filters.year) return;

        setIsLoading(true);
        try {
            // Concurrent fetching for all selected states
            const promises = currentStates.map(async (uf) => {
                let res;
                if (reportType === 'consolidado') {
                    res = await api.reports.dailyBillingConsolidated(uf, {
                        month: filters.month,
                        year: filters.year,
                        branch: filters.branch || ''
                    });
                } else {
                    res = await api.reports.dailyBilling(uf, {
                        month: filters.month,
                        year: filters.year,
                        salesperson: filters.salesperson || '',
                        branch: filters.branch || ''
                    });
                }

                return {
                    stateCode: uf,
                    ...res
                };
            });

            const results = await Promise.all(promises);
            setReportsData(results);
            setAppliedFilters({ month: filters.month, year: filters.year });

        } catch (err) {
            toast({
                title: "Erro ao buscar relatório diário",
                description: err.message || "Verifique sua conexão ou filtros.",
                variant: "destructive",
            });
            setReportsData([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (filters.state && filters.state.length > 0) {
            fetchReportData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.state, reportType]);

    const handleApplyFilters = () => {
        fetchReportData();
    };

    const handleExport = async () => {
        toast({ title: "Aviso", description: "A exportação para o faturamento diário ainda está em desenvolvimento." });
        // Future export logic goes here
    };

    // Calculate the target day to show dynamically using the applied filters
    const now = new Date();
    const isCurrentMonth = Number(appliedFilters.year) === now.getFullYear() && Number(appliedFilters.month) === (now.getMonth() + 1);
    const targetDay = isCurrentMonth ? now.getDate() : new Date(appliedFilters.year, appliedFilters.month, 0).getDate();

    // Calculate global summary across all active states
    const globalSummary = reportsData.reduce((acc, report) => {
        if (report.summary) {
            acc.total += report.summary.total || 0;
            acc.dayTotal += report.summary[`day_${targetDay}`] || 0;
        }
        return acc;
    }, { total: 0, dayTotal: 0 });

    return (
        <div className="flex flex-col space-y-4 h-[calc(100vh-80px)]">
            <div className="flex flex-col gap-1 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Faturamento Diário Resumido
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Acompanhamento dia a dia do faturamento por vendedor e filial.
                        </p>
                    </div>
                    <Tabs value={reportType} onValueChange={setReportType} className="w-full sm:w-auto">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="vendedores">Visão Vendedores</TabsTrigger>
                            <TabsTrigger value="consolidado">Visão Consolidada</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            <div className="shrink-0 mb-4">
                <SalesReportFilters
                    filters={filters}
                    setFilters={setFilters}
                    options={filterOptions}
                    onApply={handleApplyFilters}
                    onExport={handleExport}
                    isLoading={isLoading}
                    isExporting={isExporting}
                    statesList={statesList}
                    activeTab={reportType}
                    multiState={true}
                />
            </div>

            <div className="flex-1 overflow-auto flex flex-col gap-8 pb-8">
                {reportsData.map((report) => (
                    <div key={report.stateCode} className="flex flex-col gap-2 min-h-0">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 pl-1 border-l-4 border-blue-500">
                            Faturamento - {report.stateCode.toUpperCase()}
                        </h2>
                        <div className="flex-1 shrink-0 overflow-hidden">
                            {reportType === 'consolidado' ? (
                                <DailyBillingConsolidatedTable
                                    data={report.data}
                                    summary={report.summary}
                                    isLoading={isLoading}
                                    targetDay={targetDay}
                                    month={appliedFilters.month}
                                />
                            ) : (
                                <DailyBillingTable
                                    data={report.data}
                                    summary={report.summary}
                                    isLoading={isLoading}
                                    targetDay={targetDay}
                                    month={appliedFilters.month}
                                />
                            )}
                        </div>
                    </div>
                ))}

                {!isLoading && reportsData.length === 0 && (
                    <div className="flex justify-center items-center h-64 border rounded-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm mt-4">
                        <p className="text-slate-500 dark:text-slate-400">Nenhum estado selecionado ou dados não encontrados.</p>
                    </div>
                )}

                {/* Global Summary Segment */}
                {reportsData.length > 0 && !isLoading && (
                    <div className="mt-8 bg-blue-50 dark:bg-slate-800 rounded-lg p-6 border border-blue-100 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                            Resumo Consolidado (Todas as Filiais Visíveis)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                    Vendas em {targetDay.toString().padStart(2, '0')}/{Number(appliedFilters.month).toString().padStart(2, '0')}
                                </span>
                                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(globalSummary.dayTotal)}
                                </span>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
                                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total do Mês</span>
                                <span className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(globalSummary.total)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

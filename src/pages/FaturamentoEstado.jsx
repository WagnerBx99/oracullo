import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { api } from '@/api/apiClient';
import { useToast } from '@/components/ui/use-toast';
import SalesReportFilters from '@/components/SalesReportFilters';
import SalesReportTable from '@/components/SalesReportTable';
import ConsolidatedReportView from '@/components/ConsolidatedReportView';

export default function FaturamentoEstado() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('vendas');

    // Estado global de filtros que cruza as abas
    const [filters, setFilters] = useState({
        state: [], // seleção múltipla de unidades
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        salesperson: '',
        branch: ''
    });

    const [statesList, setStatesList] = useState([]);
    const [filterOptions, setFilterOptions] = useState({ salespersons: [], branches: [] });

    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total_pages: 1, total: 0 });
    const [summary, setSummary] = useState(null);
    const [consolidatedData, setConsolidatedData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // 1. Carrega a lista de estados inicialmente
    useEffect(() => {
        const fetchStates = async () => {
            try {
                // Rota nova do backend
                const states = await api.reports.states();
                setStatesList(states);
                if (states.length > 0) {
                    setFilters(prev => ({ ...prev, state: states })); // autoseleciona todas por padrão
                }
            } catch (err) {
                toast({
                    title: "Erro ao buscar unidades",
                    description: err.message || "Tente novamente mais tarde.",
                    variant: "destructive",
                });
            }
        };
        fetchStates();
    }, [toast]);

    // 2. Sempre que mudar de Estado, carrega os filtros Dependentes (vendedor, filial)
    useEffect(() => {
        const fetchFilterOptions = async () => {
            if (!filters.state) return;
            try {
                const res = await api.reports.filters(filters.state);
                setFilterOptions(res || { salespersons: [], branches: [] });
            } catch (err) {
                toast({
                    title: "Erro ao buscar filtros para " + filters.state,
                    variant: "destructive",
                });
            }
        };

        // Zera os filtros de vendedor/filial na troca de estado
        setFilters(prev => ({ ...prev, salesperson: '', branch: '' }));
        // Zera a listagem atual pra não mostrar dados de outro estado incoerentemente
        setData([]);
        setSummary(null);

        fetchFilterOptions();
    }, [filters.state, toast]);

    // 3. Função Global de Buscar os Dados (Aba Atual dita a rota, no momento só Vendas tá implementada mas suportará Consolidado)
    const fetchReportData = async (page = 1) => {
        if (!filters.state || !filters.month || !filters.year) return;

        setIsLoading(true);
        try {
            if (activeTab === 'vendas') {
                const res = await api.reports.sales(filters.state, {
                    month: filters.month,
                    year: filters.year,
                    salesperson: filters.salesperson || '',
                    branch: filters.branch || '',
                    page,
                    page_size: 50
                });
                setData(res.data);
                setPagination(res.pagination);
                setSummary(res.summary);
            } else if (activeTab === 'consolidado') {
                const res = await api.reports.consolidated(filters.state, {
                    month: filters.month,
                    year: filters.year
                });
                setConsolidatedData(res);
                setPagination({ page: 1, total_pages: 1, total: 0 });
            }
        } catch (err) {
            toast({
                title: "Erro ao buscar relatório",
                description: err.message || "Verifique sua conexão ou filtros.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-carrega dados ao selecionar inicialmente o Estado apenas se já tiver Month e Year (vem por padrao)
    // Para simplificar, deixamos o usuário clicar em Mostrar ou usar um trigger.
    useEffect(() => {
        if (filters.state) {
            fetchReportData(1);
        }

    }, [filters.state, activeTab]); // Dispara também ao mudar de aba

    const handleApplyFilters = () => {
        fetchReportData(1);
    };

    const handlePageChange = (newPage) => {
        fetchReportData(newPage);
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            let exportUrl = '';

            const params = {
                month: filters.month,
                year: filters.year,
                // Passing state as part of the query payload now!
                state: filters.state
            };

            if (activeTab === 'vendas') {
                if (filters.salesperson) params.salesperson = filters.salesperson;
                if (filters.branch) params.branch = filters.branch;
                exportUrl = api.reports.exportSalesStateUrl(params);
            } else {
                exportUrl = api.reports.exportConsolidatedStateUrl(params);
            }

            window.open(exportUrl, '_blank');

        } catch (err) {
            toast({
                title: "Erro na Exportação",
                description: err.message || "Tente novamente mais tarde.",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col space-y-4">
            <div className="flex flex-col gap-1 shrink-0">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Faturamento por Unidade
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Transações gerenciais, custos e lucratividade filtrados por unidade e regras de negócio.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
                <TabsList className="shrink-0 max-w-sm mb-2">
                    <TabsTrigger value="vendas" className="flex-1">Listagem de Vendas</TabsTrigger>
                    <TabsTrigger value="consolidado" className="flex-1">Visão Consolidada</TabsTrigger>
                </TabsList>

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
                        activeTab={activeTab}
                    />
                </div>

                <TabsContent value="vendas" className="flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                    <SalesReportTable
                        data={data}
                        pagination={pagination}
                        summary={summary}
                        onPageChange={handlePageChange}
                        isLoading={isLoading}
                    />
                </TabsContent>

                <TabsContent value="consolidado" className="flex-1 overflow-hidden mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                    <ConsolidatedReportView
                        data={consolidatedData}
                        isLoading={isLoading}
                    />
                </TabsContent>
            </Tabs>

        </div>
    );
}

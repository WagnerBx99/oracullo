import React from 'react';
import BrandTable from './BrandTable';
import { Loader2 } from 'lucide-react';

export default function ConsolidatedReportView({ data, isLoading }) {
    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-4" />
                <p className="text-slate-500">Agregando transações do período...</p>
            </div>
        );
    }

    if (!data || (!data.by_salesperson?.length && !data.by_branch?.length)) {
        return (
            <div className="flex-1 p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-500 text-center min-h-[400px]">
                <h2 className="text-lg font-medium text-slate-700 dark:text-slate-300">Nenhum dado encontrado</h2>
                <p className="max-w-md mt-2">Nenhum faturamento registrado para o estado e período selecionados.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-12 pb-12 w-full animate-in fade-in duration-300">
            {/* Secao Vendedores */}
            {data.by_salesperson && data.by_salesperson.length > 0 && (
                <div className="w-full">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 bg-blue-500 rounded-sm inline-block"></span>
                        Por Vendedor
                    </h2>
                    <div className="space-y-6 max-w-[100vw] overflow-hidden -mx-6 px-6 sm:mx-0 sm:px-0">
                        {data.by_salesperson.map((spData, idx) => (
                            <BrandTable
                                key={`sp-${idx}`}
                                title={`Vendedor: ${spData.salesperson}`}
                                brands={spData.brands}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Secao Filiais */}
            {data.by_branch && data.by_branch.length > 0 && (
                <div className="w-full">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                        <span className="w-2 h-6 bg-purple-500 rounded-sm inline-block"></span>
                        Por Filial
                    </h2>
                    <div className="space-y-6 max-w-[100vw] overflow-hidden -mx-6 px-6 sm:mx-0 sm:px-0">
                        {data.by_branch.map((brData, idx) => (
                            <BrandTable
                                key={`br-${idx}`}
                                title={`Filial: ${brData.branch}`}
                                brands={brData.brands}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Secao Consolidado Geral */}
            {data.consolidated && data.consolidated.brands && (
                <div className="w-full">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                        <span className="w-2 h-6 bg-orange-500 rounded-sm inline-block"></span>
                        Consolidado
                    </h2>
                    <div className="max-w-[100vw] overflow-hidden -mx-6 px-6 sm:mx-0 sm:px-0">
                        <div className="relative group rounded-xl p-[2px] bg-gradient-to-r from-orange-400 to-red-500 shadow-lg mb-6 w-full">
                            <div className="bg-white dark:bg-slate-950 rounded-[10px] overflow-hidden">
                                <BrandTable
                                    title="Resumo do Estado"
                                    brands={data.consolidated.brands}
                                    showManagerComm={true}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

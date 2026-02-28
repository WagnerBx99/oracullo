import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Info, ChevronDown, ChevronUp } from 'lucide-react';

// ============================================================
// DADOS EXTRAÍDOS DO EXCEL: 2.8 Quadro de Comissões Rev Jan 2026
// ============================================================

const CUSTO_OPERACIONAL = {
  banco: 0.04,
  frete: 0.03,
  imposto: 0.08,
};

// Quadro 1: Comissões 2026 - Vendedores Internos CLT
const QUADRO_CLT = {
  titulo: 'Quadro de Comissões Pecmotors 2026',
  subtitulo: 'Vendedores Internos CLT',
  colunas: {
    consultorExterno: 'Consultor Externo (PJ)',
    vendedorInterno: 'Vendedor Interno (CLT)',
    assistenteComercial: 'Assistente Comercial (CLT)',
  },
  marcas: [
    {
      marca: 'Mannol Motor',
      ce: { comissao: 0.01, p50: 0.00, p80: 0.01, p100: 0.02, p110: 0.02 },
      vi: { comissao: 0.003, p50: 0.001, p80: 0.002, p100: 0.0035, p110: 0.006 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'Mannol Transmissão',
      ce: { comissao: 0.01, p50: 0.00, p80: 0.00, p100: 0.04, p110: 0.00 },
      vi: { comissao: 0.003, p50: 0.001, p80: 0.002, p100: 0.0035, p110: 0.006 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'Mannol Especialidade',
      ce: { comissao: 0.01, p50: 0.00, p80: 0.00, p100: 0.04, p110: 0.00 },
      vi: { comissao: 0.003, p50: 0.001, p80: 0.002, p100: 0.0035, p110: 0.006 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'Mannol Aditivo',
      ce: { comissao: 0.01, p50: 0.00, p80: 0.00, p100: 0.04, p110: 0.00 },
      vi: { comissao: 0.003, p50: 0.001, p80: 0.002, p100: 0.0035, p110: 0.006 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'Mannol Arrefecimento',
      ce: { comissao: 0.01, p50: 0.00, p80: 0.00, p100: 0.04, p110: 0.00 },
      vi: { comissao: 0.003, p50: 0.001, p80: 0.002, p100: 0.0035, p110: 0.006 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'RAVENOL',
      ce: { comissao: 0.01, p50: 0.00, p80: 0.00, p100: 0.02, p110: 0.02 },
      vi: { comissao: 0.003, p50: 0.001, p80: 0.002, p100: 0.0035, p110: 0.006 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'LUBEGARD',
      ce: { comissao: 0.01, p50: 0.00, p80: 0.00, p100: 0.04, p110: 0.00 },
      vi: { comissao: 0.003, p50: 0.001, p80: 0.002, p100: 0.0035, p110: 0.006 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'THE EAGLE FILTROS',
      ce: { comissao: 0.01, p50: 0.00, p80: 0.00, p100: 0.04, p110: 0.00 },
      vi: { comissao: 0.003, p50: 0.001, p80: 0.002, p100: 0.0035, p110: 0.006 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'THE EAGLE PEÇAS E FERRAMENTAS',
      ce: { comissao: 0.01, p50: 0.00, p80: 0.00, p100: 0.04, p110: 0.00 },
      vi: { comissao: 0.003, p50: 0.001, p80: 0.002, p100: 0.0035, p110: 0.006 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'OUTROS',
      ce: { comissao: 0.01, p50: 0.00, p80: 0.00, p100: 0.00, p110: 0.00 },
      vi: { comissao: 0.003, p50: 0.00, p80: 0.00, p100: 0.00, p110: 0.00 },
      ac: { comissao: 0.0015, p50: 0.00, p80: 0.00, p100: 0.00, p110: 0.00 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'ATF 6000 PRO 5° GEN',
      ce: { comissao: 0.02, p50: 0.025, p80: 0.035, p100: 0.05, p110: 0.05 },
      vi: { comissao: 0.01, p50: 0.005, p80: 0.0075, p100: 0.01, p110: 0.01 },
      ac: { comissao: 0.005, p50: 0.0025, p80: 0.004, p100: 0.005, p110: 0.005 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'ATF 6000 PRO GTS',
      ce: { comissao: 0.02, p50: 0.025, p80: 0.035, p100: 0.05, p110: 0.05 },
      vi: { comissao: 0.01, p50: 0.005, p80: 0.0075, p100: 0.01, p110: 0.01 },
      ac: { comissao: 0.005, p50: 0.0025, p80: 0.004, p100: 0.005, p110: 0.005 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'ATF 6000 PRO - 6 GEN',
      ce: { comissao: 0.02, p50: 0.025, p80: 0.035, p100: 0.05, p110: 0.05 },
      vi: { comissao: 0.01, p50: 0.005, p80: 0.0075, p100: 0.01, p110: 0.01 },
      ac: { comissao: 0.005, p50: 0.0025, p80: 0.004, p100: 0.005, p110: 0.005 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'ATC 1000',
      ce: { comissao: 0.02, p50: 0.025, p80: 0.035, p100: 0.05, p110: 0.05 },
      vi: { comissao: 0.01, p50: 0.005, p80: 0.0075, p100: 0.01, p110: 0.01 },
      ac: { comissao: 0.005, p50: 0.0025, p80: 0.004, p100: 0.005, p110: 0.005 },
      supervisor: 0.00,
      gerente: 0.01,
    },
  ],
};

// Quadro 2: Pejotização Vendedor Interno
const QUADRO_PJ = {
  titulo: 'Quadro de Comissões Pecmotors 2026 - PEJOTIZAÇÃO VENDEDOR INTERNO',
  subtitulo: 'Vendedor Interno PJ',
  colunas: {
    consultorExterno: 'Consultor Externo (PJ)',
    vendedorInterno: 'Vendedor Interno (PJ)',
    assistenteComercial: 'Assistente Comercial (CLT)',
  },
  marcas: [
    {
      marca: 'Mannol Motor',
      ce: { comissao: 0.01, p50: 0.005, p80: 0.01, p100: 0.02, p110: 0.02 },
      vi: { comissao: 0.005, p50: 0.005, p80: 0.008, p100: 0.01, p110: 0.0125 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'Mannol Transmissão',
      ce: { comissao: 0.01, p50: 0.02, p80: 0.03, p100: 0.04, p110: 0.05 },
      vi: { comissao: 0.005, p50: 0.005, p80: 0.008, p100: 0.01, p110: 0.0125 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'Mannol Especialidade',
      ce: { comissao: 0.01, p50: 0.02, p80: 0.03, p100: 0.04, p110: 0.05 },
      vi: { comissao: 0.005, p50: 0.005, p80: 0.008, p100: 0.01, p110: 0.0125 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'Mannol Aditivo',
      ce: { comissao: 0.01, p50: 0.02, p80: 0.03, p100: 0.04, p110: 0.05 },
      vi: { comissao: 0.005, p50: 0.005, p80: 0.008, p100: 0.01, p110: 0.0125 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'Mannol Arrefecimento',
      ce: { comissao: 0.01, p50: 0.02, p80: 0.03, p100: 0.04, p110: 0.05 },
      vi: { comissao: 0.005, p50: 0.005, p80: 0.008, p100: 0.01, p110: 0.0125 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'RAVENOL',
      ce: { comissao: 0.01, p50: 0.00, p80: 0.00, p100: 0.02, p110: 0.02 },
      vi: { comissao: 0.005, p50: 0.00, p80: 0.00, p100: 0.00, p110: 0.00 },
      ac: { comissao: 0.0015, p50: 0.00, p80: 0.00, p100: 0.00, p110: 0.00 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'LUBEGARD',
      ce: { comissao: 0.01, p50: 0.02, p80: 0.03, p100: 0.04, p110: 0.05 },
      vi: { comissao: 0.005, p50: 0.005, p80: 0.008, p100: 0.01, p110: 0.0125 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'THE EAGLE FILTROS',
      ce: { comissao: 0.01, p50: 0.02, p80: 0.03, p100: 0.04, p110: 0.05 },
      vi: { comissao: 0.005, p50: 0.005, p80: 0.008, p100: 0.01, p110: 0.0125 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'THE EAGLE PEÇAS E FERRAMENTAS',
      ce: { comissao: 0.01, p50: 0.02, p80: 0.03, p100: 0.04, p110: 0.05 },
      vi: { comissao: 0.005, p50: 0.005, p80: 0.008, p100: 0.01, p110: 0.0125 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'OUTROS',
      ce: { comissao: 0.01, p50: 0.00, p80: 0.00, p100: 0.00, p110: 0.00 },
      vi: { comissao: 0.005, p50: 0.005, p80: 0.008, p100: 0.01, p110: 0.0125 },
      ac: { comissao: 0.0015, p50: 0.00, p80: 0.00, p100: 0.00, p110: 0.00 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'ATF 6000 PRO 5° GEN',
      ce: { comissao: 0.02, p50: 0.025, p80: 0.035, p100: 0.05, p110: 0.05 },
      vi: { comissao: 0.01, p50: 0.005, p80: 0.0075, p100: 0.01, p110: 0.01 },
      ac: { comissao: 0.005, p50: 0.0025, p80: 0.004, p100: 0.005, p110: 0.005 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'ATF 6000 PRO GTS',
      ce: { comissao: 0.02, p50: 0.025, p80: 0.035, p100: 0.05, p110: 0.05 },
      vi: { comissao: 0.01, p50: 0.005, p80: 0.0075, p100: 0.01, p110: 0.01 },
      ac: { comissao: 0.005, p50: 0.0025, p80: 0.004, p100: 0.005, p110: 0.005 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'ATF 6000 PRO - 6 GEN',
      ce: { comissao: 0.02, p50: 0.025, p80: 0.035, p100: 0.05, p110: 0.05 },
      vi: { comissao: 0.01, p50: 0.005, p80: 0.0075, p100: 0.01, p110: 0.01 },
      ac: { comissao: 0.005, p50: 0.0025, p80: 0.004, p100: 0.005, p110: 0.005 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'ATC 1000',
      ce: { comissao: 0.02, p50: 0.025, p80: 0.035, p100: 0.05, p110: 0.05 },
      vi: { comissao: 0.01, p50: 0.005, p80: 0.0075, p100: 0.01, p110: 0.01 },
      ac: { comissao: 0.005, p50: 0.0025, p80: 0.004, p100: 0.005, p110: 0.005 },
      supervisor: 0.00,
      gerente: 0.01,
    },
  ],
};

// Quadro 3: Atendimento Interno Regiões Sem Consultor Externo
const QUADRO_SEM_CE = {
  titulo: 'Quadro de Comissões Pecmotors 2026 - ATENDIMENTO INTERNO REGIÕES SEM CONSULTOR EXTERNO',
  subtitulo: 'Regiões sem Consultor Externo',
  colunas: {
    vendedorInterno: 'Vendedor Interno (PJ)',
    assistenteComercial: 'Assistente Comercial',
  },
  marcas: [
    {
      marca: 'Mannol Motor',
      vi: { comissao: 0.01, p50: 0.01, p80: 0.015, p100: 0.01, p110: 0.015 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'Mannol Transmissão',
      vi: { comissao: 0.01, p50: 0.01, p80: 0.015, p100: 0.02, p110: 0.025 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'Mannol Especialidade',
      vi: { comissao: 0.01, p50: 0.01, p80: 0.015, p100: 0.02, p110: 0.025 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'Mannol Aditivo',
      vi: { comissao: 0.01, p50: 0.01, p80: 0.015, p100: 0.02, p110: 0.025 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'Mannol Arrefecimento',
      vi: { comissao: 0.01, p50: 0.01, p80: 0.015, p100: 0.02, p110: 0.025 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'PECMOTORS',
      vi: { comissao: 0.01, p50: 0.00, p80: 0.00, p100: 0.00, p110: 0.00 },
      ac: { comissao: 0.0015, p50: 0.00, p80: 0.00, p100: 0.00, p110: 0.00 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'LUBEGARD',
      vi: { comissao: 0.01, p50: 0.01, p80: 0.015, p100: 0.02, p110: 0.025 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'THE EAGLE FILTROS',
      vi: { comissao: 0.01, p50: 0.01, p80: 0.015, p100: 0.02, p110: 0.025 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'EAGLE PEÇAS',
      vi: { comissao: 0.01, p50: 0.01, p80: 0.015, p100: 0.02, p110: 0.025 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'FERRAMENTAS E ADAPTADORES',
      vi: { comissao: 0.01, p50: 0.01, p80: 0.015, p100: 0.02, p110: 0.025 },
      ac: { comissao: 0.0015, p50: 0.0005, p80: 0.001, p100: 0.002, p110: 0.003 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'OUTROS',
      vi: { comissao: 0.01, p50: 0.01, p80: 0.015, p100: 0.02, p110: 0.025 },
      ac: { comissao: 0.0015, p50: 0.00, p80: 0.00, p100: 0.00, p110: 0.00 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'ATF 6000 PRO 5° GEN',
      vi: { comissao: 0.01, p50: 0.03, p80: 0.045, p100: 0.02, p110: 0.02 },
      ac: { comissao: 0.005, p50: 0.0025, p80: 0.004, p100: 0.005, p110: 0.005 },
      supervisor: 0.00,
      gerente: 0.01,
    },
    {
      marca: 'ATF 6000 PRO GTS',
      vi: { comissao: 0.01, p50: 0.03, p80: 0.045, p100: 0.02, p110: 0.02 },
      ac: { comissao: 0.005, p50: 0.0025, p80: 0.004, p100: 0.005, p110: 0.005 },
      supervisor: 0.00,
      gerente: 0.01,
    },
  ],
};

// ============================================================
// HELPERS
// ============================================================

const fmt = (v) => {
  if (!v || v === 0) return '-';
  return `${(v * 100).toFixed(2).replace('.', ',')}%`;
};

const fmtBold = (v) => {
  if (!v || v === 0) return '-';
  return `${(v * 100).toFixed(2).replace('.', ',')}%`;
};

// ============================================================
// COMPONENTE DE TABELA PRINCIPAL (3 CARGOS)
// ============================================================

function TabelaComissoes3Cargos({ quadro }) {
  const { marcas, colunas } = quadro;

  const thBase = 'px-2 py-2 text-xs font-semibold text-center border border-border';
  const tdBase = 'px-2 py-2 text-xs text-center border border-border';

  return (
    <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
      <table className="w-full text-xs min-w-[900px]">
        <thead>
          {/* Linha 1: Grupos de cargo */}
          <tr className="bg-[#135670] text-white">
            <th className={`${thBase} text-left min-w-[160px]`} rowSpan={3}>Marca</th>
            {/* Consultor Externo */}
            <th className={`${thBase} bg-[#135670]`} colSpan={6}>{colunas.consultorExterno}</th>
            <th className={`${thBase} bg-transparent border-0`} rowSpan={3} style={{ width: 8 }}></th>
            {/* Vendedor Interno */}
            <th className={`${thBase} bg-[#1a6e8a]`} colSpan={6}>{colunas.vendedorInterno}</th>
            <th className={`${thBase} bg-transparent border-0`} rowSpan={3} style={{ width: 8 }}></th>
            {/* Assistente Comercial */}
            <th className={`${thBase} bg-[#0f4558]`} colSpan={6}>{colunas.assistenteComercial}</th>
            <th className={`${thBase} bg-transparent border-0`} rowSpan={3} style={{ width: 8 }}></th>
            {/* Supervisor e Gerente */}
            <th className={`${thBase} bg-[#ff5c00]`} rowSpan={2}>Supervisor</th>
            <th className={`${thBase} bg-[#ff5c00]`} rowSpan={2}>Gerente</th>
          </tr>
          {/* Linha 2: Prêmio */}
          <tr className="bg-[#135670]/80 text-white">
            <th className={`${thBase} bg-[#135670]/90`} rowSpan={1}>Comissão</th>
            <th className={`${thBase} bg-[#ff5c00]/80`} colSpan={4}>Prêmio por Meta</th>
            <th className={`${thBase} bg-[#135670]/90`}>TOTAL</th>

            <th className={`${thBase} bg-[#1a6e8a]/90`}>Comissão</th>
            <th className={`${thBase} bg-[#ff5c00]/80`} colSpan={4}>Prêmio por Meta</th>
            <th className={`${thBase} bg-[#1a6e8a]/90`}>TOTAL</th>

            <th className={`${thBase} bg-[#0f4558]/90`}>Comissão</th>
            <th className={`${thBase} bg-[#ff5c00]/80`} colSpan={4}>Prêmio por Meta</th>
            <th className={`${thBase} bg-[#0f4558]/90`}>TOTAL</th>
          </tr>
          {/* Linha 3: Faixas de meta */}
          <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <th className={thBase}></th>
            <th className={`${thBase} text-[#ff5c00]`}>50%</th>
            <th className={`${thBase} text-[#ff5c00]`}>80%</th>
            <th className={`${thBase} text-[#ff5c00]`}>100%</th>
            <th className={`${thBase} text-[#ff5c00]`}>110%</th>
            <th className={thBase}></th>

            <th className={thBase}></th>
            <th className={`${thBase} text-[#ff5c00]`}>50%</th>
            <th className={`${thBase} text-[#ff5c00]`}>80%</th>
            <th className={`${thBase} text-[#ff5c00]`}>100%</th>
            <th className={`${thBase} text-[#ff5c00]`}>110%</th>
            <th className={thBase}></th>

            <th className={thBase}></th>
            <th className={`${thBase} text-[#ff5c00]`}>50%</th>
            <th className={`${thBase} text-[#ff5c00]`}>80%</th>
            <th className={`${thBase} text-[#ff5c00]`}>100%</th>
            <th className={`${thBase} text-[#ff5c00]`}>110%</th>
            <th className={thBase}></th>

            <th className={thBase}></th>
            <th className={thBase}></th>
          </tr>
        </thead>
        <tbody>
          {marcas.map((item, idx) => {
            const isATF = item.marca.startsWith('ATF') || item.marca.startsWith('ATC');
            const rowClass = isATF
              ? 'bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20'
              : idx % 2 === 0
              ? 'bg-background hover:bg-muted/30'
              : 'bg-muted/10 hover:bg-muted/30';

            const ceTotal = item.ce.comissao + item.ce.p110;
            const viTotal = item.vi.comissao + item.vi.p110;
            const acTotal = item.ac.comissao + item.ac.p110;

            return (
              <tr key={item.marca} className={`${rowClass} transition-colors`}>
                <td className={`${tdBase} text-left font-medium text-foreground`}>{item.marca}</td>
                {/* CE */}
                <td className={`${tdBase} text-[#135670] font-semibold`}>{fmt(item.ce.comissao)}</td>
                <td className={tdBase}>{fmt(item.ce.p50)}</td>
                <td className={tdBase}>{fmt(item.ce.p80)}</td>
                <td className={tdBase}>{fmt(item.ce.p100)}</td>
                <td className={`${tdBase} text-[#ff5c00] font-semibold`}>{fmt(item.ce.p110)}</td>
                <td className={`${tdBase} font-bold text-[#135670]`}>{fmt(ceTotal)}</td>
                <td className="border-0 bg-transparent" style={{ width: 8 }}></td>
                {/* VI */}
                <td className={`${tdBase} text-[#1a6e8a] font-semibold`}>{fmt(item.vi.comissao)}</td>
                <td className={tdBase}>{fmt(item.vi.p50)}</td>
                <td className={tdBase}>{fmt(item.vi.p80)}</td>
                <td className={tdBase}>{fmt(item.vi.p100)}</td>
                <td className={`${tdBase} text-[#ff5c00] font-semibold`}>{fmt(item.vi.p110)}</td>
                <td className={`${tdBase} font-bold text-[#1a6e8a]`}>{fmt(viTotal)}</td>
                <td className="border-0 bg-transparent" style={{ width: 8 }}></td>
                {/* AC */}
                <td className={`${tdBase} text-[#0f4558] font-semibold`}>{fmt(item.ac.comissao)}</td>
                <td className={tdBase}>{fmt(item.ac.p50)}</td>
                <td className={tdBase}>{fmt(item.ac.p80)}</td>
                <td className={tdBase}>{fmt(item.ac.p100)}</td>
                <td className={`${tdBase} text-[#ff5c00] font-semibold`}>{fmt(item.ac.p110)}</td>
                <td className={`${tdBase} font-bold text-[#0f4558]`}>{fmt(acTotal)}</td>
                <td className="border-0 bg-transparent" style={{ width: 8 }}></td>
                {/* Supervisor / Gerente */}
                <td className={`${tdBase} text-[#ff5c00] font-semibold`}>{fmt(item.supervisor)}</td>
                <td className={`${tdBase} text-[#ff5c00] font-semibold`}>{fmt(item.gerente)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// COMPONENTE DE TABELA SIMPLIFICADA (2 CARGOS - SEM CE)
// ============================================================

function TabelaComissoes2Cargos({ quadro }) {
  const { marcas, colunas } = quadro;

  const thBase = 'px-2 py-2 text-xs font-semibold text-center border border-border';
  const tdBase = 'px-2 py-2 text-xs text-center border border-border';

  return (
    <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
      <table className="w-full text-xs min-w-[600px]">
        <thead>
          <tr className="bg-[#135670] text-white">
            <th className={`${thBase} text-left min-w-[160px]`} rowSpan={3}>Marca</th>
            <th className={`${thBase} bg-[#1a6e8a]`} colSpan={6}>{colunas.vendedorInterno}</th>
            <th className={`${thBase} bg-transparent border-0`} rowSpan={3} style={{ width: 8 }}></th>
            <th className={`${thBase} bg-[#0f4558]`} colSpan={6}>{colunas.assistenteComercial}</th>
            <th className={`${thBase} bg-transparent border-0`} rowSpan={3} style={{ width: 8 }}></th>
            <th className={`${thBase} bg-[#ff5c00]`} rowSpan={2}>Supervisor</th>
            <th className={`${thBase} bg-[#ff5c00]`} rowSpan={2}>Gerente</th>
          </tr>
          <tr className="bg-[#135670]/80 text-white">
            <th className={`${thBase} bg-[#1a6e8a]/90`}>Comissão</th>
            <th className={`${thBase} bg-[#ff5c00]/80`} colSpan={4}>Prêmio por Meta</th>
            <th className={`${thBase} bg-[#1a6e8a]/90`}>TOTAL</th>
            <th className={`${thBase} bg-[#0f4558]/90`}>Comissão</th>
            <th className={`${thBase} bg-[#ff5c00]/80`} colSpan={4}>Prêmio por Meta</th>
            <th className={`${thBase} bg-[#0f4558]/90`}>TOTAL</th>
          </tr>
          <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <th className={thBase}></th>
            <th className={`${thBase} text-[#ff5c00]`}>50%</th>
            <th className={`${thBase} text-[#ff5c00]`}>80%</th>
            <th className={`${thBase} text-[#ff5c00]`}>100%</th>
            <th className={`${thBase} text-[#ff5c00]`}>110%</th>
            <th className={thBase}></th>
            <th className={thBase}></th>
            <th className={`${thBase} text-[#ff5c00]`}>50%</th>
            <th className={`${thBase} text-[#ff5c00]`}>80%</th>
            <th className={`${thBase} text-[#ff5c00]`}>100%</th>
            <th className={`${thBase} text-[#ff5c00]`}>110%</th>
            <th className={thBase}></th>
            <th className={thBase}></th>
            <th className={thBase}></th>
          </tr>
        </thead>
        <tbody>
          {marcas.map((item, idx) => {
            const isATF = item.marca.startsWith('ATF') || item.marca.startsWith('ATC');
            const rowClass = isATF
              ? 'bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20'
              : idx % 2 === 0
              ? 'bg-background hover:bg-muted/30'
              : 'bg-muted/10 hover:bg-muted/30';

            const viTotal = item.vi.comissao + item.vi.p110;
            const acTotal = item.ac.comissao + item.ac.p110;

            return (
              <tr key={item.marca} className={`${rowClass} transition-colors`}>
                <td className={`${tdBase} text-left font-medium text-foreground`}>{item.marca}</td>
                <td className={`${tdBase} text-[#1a6e8a] font-semibold`}>{fmt(item.vi.comissao)}</td>
                <td className={tdBase}>{fmt(item.vi.p50)}</td>
                <td className={tdBase}>{fmt(item.vi.p80)}</td>
                <td className={tdBase}>{fmt(item.vi.p100)}</td>
                <td className={`${tdBase} text-[#ff5c00] font-semibold`}>{fmt(item.vi.p110)}</td>
                <td className={`${tdBase} font-bold text-[#1a6e8a]`}>{fmt(viTotal)}</td>
                <td className="border-0 bg-transparent" style={{ width: 8 }}></td>
                <td className={`${tdBase} text-[#0f4558] font-semibold`}>{fmt(item.ac.comissao)}</td>
                <td className={tdBase}>{fmt(item.ac.p50)}</td>
                <td className={tdBase}>{fmt(item.ac.p80)}</td>
                <td className={tdBase}>{fmt(item.ac.p100)}</td>
                <td className={`${tdBase} text-[#ff5c00] font-semibold`}>{fmt(item.ac.p110)}</td>
                <td className={`${tdBase} font-bold text-[#0f4558]`}>{fmt(acTotal)}</td>
                <td className="border-0 bg-transparent" style={{ width: 8 }}></td>
                <td className={`${tdBase} text-[#ff5c00] font-semibold`}>{fmt(item.supervisor)}</td>
                <td className={`${tdBase} text-[#ff5c00] font-semibold`}>{fmt(item.gerente)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function QuadroComissoes() {
  const [tabAtiva, setTabAtiva] = useState('clt');
  const [expandidoCusto, setExpandidoCusto] = useState(false);

  const tabs = [
    { id: 'clt', label: 'Vendedores Internos CLT', quadro: QUADRO_CLT, tipo: '3cargos' },
    { id: 'pj', label: 'Pejotização Vendedor Interno', quadro: QUADRO_PJ, tipo: '3cargos' },
    { id: 'sem_ce', label: 'Regiões Sem Consultor Externo', quadro: QUADRO_SEM_CE, tipo: '2cargos' },
  ];

  const tabAtual = tabs.find(t => t.id === tabAtiva);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#135670] to-[#ff5c00] flex items-center justify-center shadow-lg">
          <DollarSign className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Quadro de Comissões 2026
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Tabela de comissões e prêmios por marca e cargo — Revisão Janeiro 2026
          </p>
        </div>
      </motion.div>

      {/* Card: Composição Custo Operacional */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
      >
        <button
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
          onClick={() => setExpandidoCusto(!expandidoCusto)}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#135670]" />
            <span className="font-semibold text-foreground text-sm">
              Composição do Custo Operacional (Dedutíveis da Comissão)
            </span>
          </div>
          {expandidoCusto ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        {expandidoCusto && (
          <div className="px-6 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border">
            {[
              { label: 'Banco', value: CUSTO_OPERACIONAL.banco, color: 'from-[#135670] to-[#1a7a9e]' },
              { label: 'Frete', value: CUSTO_OPERACIONAL.frete, color: 'from-[#ff5c00] to-orange-500' },
              { label: 'Imposto', value: CUSTO_OPERACIONAL.imposto, color: 'from-slate-600 to-slate-700' },
            ].map((item) => (
              <div
                key={item.label}
                className={`mt-4 rounded-lg bg-gradient-to-br ${item.color} text-white p-4 flex flex-col items-center`}
              >
                <span className="text-xs font-medium opacity-80 uppercase tracking-wide">{item.label}</span>
                <span className="text-2xl font-bold mt-1">{(item.value * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Tabs de Modalidade */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-2"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTabAtiva(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tabAtiva === tab.id
                ? 'bg-[#135670] text-white shadow-md'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Legenda de Prêmio */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3"
      >
        <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
          <strong>Prêmio por Meta:</strong> As colunas de prêmio (50%, 80%, 100%, 110%) indicam o percentual adicional
          de comissão pago quando o vendedor atinge a respectiva faixa de meta mensal.
          O campo <strong>TOTAL</strong> representa a soma da comissão base + prêmio máximo (110%).
        </p>
      </motion.div>

      {/* Título do quadro ativo */}
      <motion.div
        key={tabAtiva}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 shadow-sm"
      >
        <div className="mb-4">
          <h2 className="text-lg font-bold text-foreground">{tabAtual.quadro.titulo}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Modalidade: <span className="font-medium text-foreground">{tabAtual.quadro.subtitulo}</span>
          </p>
        </div>

        {tabAtual.tipo === '3cargos' ? (
          <TabelaComissoes3Cargos quadro={tabAtual.quadro} />
        ) : (
          <TabelaComissoes2Cargos quadro={tabAtual.quadro} />
        )}

        {/* Legenda de cores */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-100 dark:bg-amber-900/30 border border-amber-300 inline-block"></span>
            Produtos ATF / ATC (comissão diferenciada)
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-background border border-border inline-block"></span>
            Demais marcas
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#ff5c00] font-bold">%</span>
            Prêmio máximo (110% da meta)
          </div>
        </div>
      </motion.div>
    </div>
  );
}

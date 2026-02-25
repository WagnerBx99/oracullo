/**
 * Formata um valor numérico com casas decimais de forma segura
 * @param {any} value - Valor a ser formatado
 * @param {number} decimals - Número de casas decimais (padrão: 2)
 * @returns {string} - Valor formatado ou "0.00" se inválido
 */
export const safeFixed = (value, decimals = 2) => {
  const num = Number(value);
  return isNaN(num) ? "0".padEnd(decimals + 2, ".0") : num.toFixed(decimals);
};

/**
 * Formata valor como moeda brasileira
 * @param {any} value - Valor a ser formatado
 * @returns {string} - Valor formatado como R$ X.XXX,XX
 */
export const formatCurrency = (value) => {
  const num = Number(value);
  if (isNaN(num)) return "R$ 0,00";
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Formata valor como percentual
 * @param {any} value - Valor a ser formatado
 * @param {number} decimals - Número de casas decimais (padrão: 1)
 * @returns {string} - Valor formatado como X.X%
 */
export const formatPercentage = (value, decimals = 1) => {
  const num = Number(value);
  if (isNaN(num)) return "0%";
  return `${(num * 100).toFixed(decimals)}%`;
};

/**
 * Garante que um valor seja número
 * @param {any} value - Valor a ser convertido
 * @param {number} defaultValue - Valor padrão se conversão falhar (padrão: 0)
 * @returns {number} - Número válido
 */
export const ensureNumber = (value, defaultValue = 0) => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

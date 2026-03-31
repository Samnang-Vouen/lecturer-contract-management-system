const DEFAULT_USD_TO_KHR_RATE = 4100;

const resolveUsdToKhrRate = () => {
  const envRate = Number.parseFloat(
    import.meta.env.VITE_USD_TO_KHR || import.meta.env.VITE_EXCHANGE_RATE_KHR || ''
  );
  return Number.isFinite(envRate) && envRate > 0 ? envRate : DEFAULT_USD_TO_KHR_RATE;
};

export const USD_TO_KHR_RATE = resolveUsdToKhrRate();

export const convertUsdToKhr = (amountUsd) => {
  const value = Number(amountUsd);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * USD_TO_KHR_RATE);
};

export const formatKhrFromUsd = (amountUsd) => {
  const amountKhr = convertUsdToKhr(amountUsd);
  if (amountKhr == null) return null;
  return `៛${amountKhr.toLocaleString('en-US')}`;
};
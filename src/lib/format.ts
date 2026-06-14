export const formatMoney = (amount: number, currency: string, lang = "az") => {
  try {
    return new Intl.NumberFormat(lang === "az" ? "az-AZ" : lang === "ru" ? "ru-RU" : "en-US", {
      style: "currency", currency, minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

export const maskCard = (n: string) => n.replace(/\s/g, "").replace(/^(\d{4})\d{8}(\d{4})$/, "$1 •••• •••• $2");
export const formatCard = (n: string) => n.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
export const maskIban = (i: string) => i.length > 10 ? `${i.slice(0, 6)} •••• ${i.slice(-4)}` : i;

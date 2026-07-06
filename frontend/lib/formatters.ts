export function formatarMoeda(valor: number | string | null | undefined) {
  const numero = Number(valor || 0);

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero);
}

export function formatarMoedaCompacta(valor: number | string | null | undefined) {
  const numero = Number(valor || 0);

  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    compactDisplay: "short",
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 1,
  }).format(numero);
}

export function formatarNumero(valor: number | string | null | undefined) {
  const numero = Number(valor || 0);

  return new Intl.NumberFormat("pt-BR").format(numero);
}

export function formatarPercentual(valor: number | string | null | undefined) {
  const numero = Number(valor || 0);

  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numero)}%`;
}
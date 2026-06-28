export interface Currency {
  sym: string;
  code: string;
  dec: number;
}

export function fmt(n: number, currency: Currency): string {
  return (
    currency.sym +
    Number(n || 0).toLocaleString("en-US", {
      minimumFractionDigits: currency.dec,
      maximumFractionDigits: currency.dec,
    })
  );
}

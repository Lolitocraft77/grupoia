/** Zona horaria fija de la oficina — el dashboard corre en pantalla, no usamos la del navegador. */
const OFFICE_TZ = "America/Bogota";

/** Fecha calendario (año/mes/día) de un instante, vista desde America/Bogota. */
function officeYMD(date: Date): { year: number; month: number; day: number } {
  // en-CA produce "YYYY-MM-DD", estable para parsear.
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: OFFICE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const [year, month, day] = ymd.split("-").map(Number);
  return { year, month, day };
}

/**
 * Días de calendario que quedan por correr en el mes actual, según
 * America/Bogota: (último día del mes) − (día actual). Excluye hoy;
 * incluye sábados, domingos y festivos. El último día del mes da 0.
 */
export function daysLeftInMonth(date: Date): number {
  const { year, month, day } = officeYMD(date);
  // Día 0 del mes siguiente = último día del mes actual.
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return lastDay - day;
}

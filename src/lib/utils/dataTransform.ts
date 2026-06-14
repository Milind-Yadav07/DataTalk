import type { ChartConfig, ChartFilter } from '@/types/chart';
import type { Row } from '@/types/dataset';

/**
 * Universal filter — works for any column in any dataset.
 * Case-insensitive string matching for eq and contains.
 */
function applyFilter(row: Row, filter: ChartFilter): boolean {
  const rawVal = row[filter.column];

  // If column does not exist in this row, skip
  if (rawVal === undefined) return true;

  // Null values never match any filter
  if (rawVal === null) return false;

  const strVal = String(rawVal).trim().toLowerCase();
  const strFilter = String(filter.value).trim().toLowerCase();
  const numVal = Number(rawVal);
  const numFilter = Number(filter.value);

  switch (filter.operator) {
    case 'eq':
      // Case-insensitive match — works for names, cities, products, anything
      return strVal === strFilter;

    case 'contains':
      // Partial match — "Alex" matches "Alex Smith"
      return strVal.includes(strFilter);

    case 'gt':
      return !isNaN(numVal) && !isNaN(numFilter) && numVal > numFilter;

    case 'lt':
      return !isNaN(numVal) && !isNaN(numFilter) && numVal < numFilter;

    case 'gte':
      return !isNaN(numVal) && !isNaN(numFilter) && numVal >= numFilter;

    case 'lte':
      return !isNaN(numVal) && !isNaN(numFilter) && numVal <= numFilter;

    case 'not_eq':
      return strVal !== strFilter;

    case 'between':
      if (Array.isArray(filter.value)) {
        return !isNaN(numVal) && numVal >= Number(filter.value[0]) && numVal <= Number(filter.value[1]);
      }
      return false;

    default:
      return true;
  }
}

/**
 * Universal aggregation — groups by any xAxis column,
 * aggregates any numeric yAxis column.
 */
function aggregateRows(
  rows: Row[],
  groupBy: string,
  valueCol: string,
  method: string
): Row[] {
  const groups = new Map<string, number[]>();

  rows.forEach(row => {
    const key = String(row[groupBy] ?? 'Unknown').trim();
    const val = Number(row[valueCol]) || 0;
    groups.set(key, [...(groups.get(key) ?? []), val]);
  });

  return Array.from(groups.entries()).map(([key, vals]) => {
    let result: number;

    switch (method) {
      case 'sum':
        result = vals.reduce((a, b) => a + b, 0);
        break;
      case 'avg':
        result = vals.reduce((a, b) => a + b, 0) / vals.length;
        break;
      case 'count':
        result = vals.length;
        break;
      case 'max':
        result = Math.max(...vals);
        break;
      case 'min':
        result = Math.min(...vals);
        break;
      default:
        result = vals.reduce((a, b) => a + b, 0);
    }

    return {
      [groupBy]: key,
      [valueCol]: Number(result.toFixed(2)),
    };
  });
}

/**
 * Universal sort — works on any column, numeric or string.
 */
function sortRows(rows: Row[], sortCol: string, direction: 'asc' | 'desc'): Row[] {
  return [...rows].sort((a, b) => {
    const aVal = a[sortCol];
    const bVal = b[sortCol];

    const aNum = Number(aVal);
    const bNum = Number(bVal);

    // If both are valid numbers, sort numerically
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return direction === 'asc' ? aNum - bNum : bNum - aNum;
    }

    // Otherwise sort as strings
    const aStr = String(aVal ?? '').toLowerCase();
    const bStr = String(bVal ?? '').toLowerCase();
    if (direction === 'asc') return aStr.localeCompare(bStr);
    return bStr.localeCompare(aStr);
  });
}

export function transformDataForChart(rows: Row[], config: ChartConfig): Row[] {
  let result = [...rows];

  // Step 1 — Apply all filters
  if (config.filters && config.filters.length > 0) {
    result = result.filter(row =>
      config.filters!.every(f => applyFilter(row, f))
    );
  }

  // Step 2 — Aggregate if needed
  if (config.aggregation && config.xAxis && config.yAxis) {
    const yCol = Array.isArray(config.yAxis) ? config.yAxis[0] : config.yAxis;
    result = aggregateRows(result, config.xAxis, yCol, config.aggregation);
  }

  // Step 3 — Sort (works on any column, numeric or string)
  if (config.sortBy && config.yAxis) {
    const sortCol = Array.isArray(config.yAxis) ? config.yAxis[0] : config.yAxis;
    result = sortRows(result, sortCol, config.sortBy);
  }

  // Step 4 — Limit results
  if (config.limit && config.limit > 0) {
    result = result.slice(0, config.limit);
  }

  return result;
}

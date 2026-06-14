import type { ChartConfig, ChartFilter } from '../../types/chart';
import type { Row } from '../../types/dataset';

export const CHART_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
];

/**
 * Filters rows based on configuration rules.
 */
function applyFilters(data: Row[], filters?: ChartFilter[]): Row[] {
  if (!filters || filters.length === 0) return data;

  return data.filter((row) => {
    return filters.every((filter) => {
      const val = row[filter.column];
      if (val === undefined) return true;
      if (val === null) return false;

      const strVal = String(val).trim().toLowerCase();
      const strFilter = String(filter.value).trim().toLowerCase();
      const numVal = Number(val);
      const numFilter = Number(filter.value);

      switch (filter.operator) {
        case 'eq':
          return strVal === strFilter;
        case 'contains':
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
    });
  });
}

/**
 * Aggregates column values based on xAxis groups.
 */
function aggregateData(
  data: Row[],
  xAxis: string,
  yAxis: string | string[],
  aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min'
): { xAxisValues: any[]; seriesData: Record<string, number[]> } {
  const yAxes = Array.isArray(yAxis) ? yAxis : [yAxis];

  if (!aggregation) {
    // Map raw data points directly
    const xAxisValues = data.map((row) => row[xAxis] ?? '');
    const seriesData: Record<string, number[]> = {};
    for (const yCol of yAxes) {
      seriesData[yCol] = data.map((row) => Number(row[yCol]) || 0);
    }
    return { xAxisValues, seriesData };
  }

  // Group rows by xAxis value
  const groups: Record<string, Row[]> = {};
  for (const row of data) {
    const key = String(row[xAxis] ?? 'Unknown');
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  }

  const xAxisValues = Object.keys(groups);
  const seriesData: Record<string, number[]> = {};
  for (const yCol of yAxes) {
    seriesData[yCol] = [];
  }

  for (const key of xAxisValues) {
    const groupRows = groups[key];
    for (const yCol of yAxes) {
      const values = groupRows
        .map((row) => Number(row[yCol]))
        .filter((val) => !isNaN(val));

      let result = 0;
      if (values.length > 0) {
        switch (aggregation) {
          case 'sum':
            result = values.reduce((sum, v) => sum + v, 0);
            break;
          case 'avg':
            result = values.reduce((sum, v) => sum + v, 0) / values.length;
            break;
          case 'count':
            result = values.length;
            break;
          case 'max':
            result = Math.max(...values);
            break;
          case 'min':
            result = Math.min(...values);
            break;
        }
      } else if (aggregation === 'count') {
        result = groupRows.length;
      }
      seriesData[yCol].push(result);
    }
  }

  return { xAxisValues, seriesData };
}

/**
 * Transforms ChartConfig and Row[] into a complete EChartsOption config.
 */
export function toEChartsOption(config: ChartConfig, data: Row[]): any {
  // 1. Filter the dataset
  const filteredData = applyFilters(data, config.filters);

  // 2. Perform aggregation/grouping
  let { xAxisValues, seriesData } = aggregateData(
    filteredData,
    config.xAxis,
    config.yAxis,
    config.aggregation
  );

  const yAxes = Array.isArray(config.yAxis) ? config.yAxis : [config.yAxis];

  // 3. Handle Sorting (applicable to single series)
  if (config.sortBy && yAxes.length === 1) {
    const yCol = yAxes[0];
    const combined = xAxisValues.map((xVal, idx) => ({
      xVal,
      yVal: seriesData[yCol][idx],
    }));

    combined.sort((a, b) => {
      return config.sortBy === 'asc' ? a.yVal - b.yVal : b.yVal - a.yVal;
    });

    xAxisValues = combined.map((c) => c.xVal);
    seriesData[yCol] = combined.map((c) => c.yVal);
  }

  // 4. Handle Limit constraint
  if (config.limit && config.limit > 0) {
    xAxisValues = xAxisValues.slice(0, config.limit);
    for (const yCol of yAxes) {
      seriesData[yCol] = seriesData[yCol].slice(0, config.limit);
    }
  }

  // 5. Select color palette
  const colors = config.color && config.color.length > 0 ? config.color : CHART_COLORS;

  // Common option base
  const option: any = {
    title: {
      show: false,
    },
    tooltip: {
      trigger: config.chartType === 'pie' ? 'item' : 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    color: colors,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '5%',
      containLabel: true,
    },
  };

  // Chart Type specific config
  if (config.chartType === 'pie') {
    // Donut chart implementation
    const yCol = yAxes[0];
    const pieData = xAxisValues.map((xVal, idx) => ({
      name: String(xVal),
      value: seriesData[yCol][idx],
    }));

    option.series = [
      {
        name: yCol,
        type: 'pie',
        radius: ['40%', '70%'], // Donut style
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}: {c} ({d}%)',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 15,
            fontWeight: 'bold',
          },
        },
        data: pieData,
      },
    ];
  } else if (config.chartType === 'scatter') {
    // Scatter Plot implementation
    const yCol = yAxes[0];
    const scatterData = filteredData.map((row) => [
      Number(row[config.xAxis]) || 0,
      Number(row[yCol]) || 0,
    ]);

    option.xAxis = {
      type: 'value',
      name: config.xAxis,
      nameLocation: 'middle',
      nameGap: 30,
      splitLine: { show: true },
    };
    option.yAxis = {
      type: 'value',
      name: yCol,
      nameLocation: 'middle',
      nameGap: 45,
      splitLine: { show: true },
    };
    option.series = [
      {
        name: `${config.xAxis} vs ${yCol}`,
        type: 'scatter',
        symbolSize: 10,
        data: scatterData,
        emphasis: {
          focus: 'series',
        },
      },
    ];

    option.dataZoom = [
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'none',
        zoomOnMouseWheel: false,
      },
      {
        type: 'inside',
        yAxisIndex: 0,
        filterMode: 'none',
        zoomOnMouseWheel: false,
      },
    ];
  } else {
    // Bar, Line, Area Chart implementation
    option.xAxis = {
      type: 'category',
      data: xAxisValues.map((v) => String(v)),
      axisTick: { alignWithLabel: true },
      axisLabel: {
        rotate: xAxisValues.length > 8 ? 30 : 0,
      },
    };
    option.yAxis = {
      type: 'value',
      splitLine: {
        show: true,
        lineStyle: { type: 'dashed' },
      },
    };

    option.series = yAxes.map((yCol) => {
      const isArea = config.chartType === 'area';
      const seriesType = config.chartType === 'bar' ? 'bar' : 'line';

      const seriesOpt: any = {
        name: yCol,
        type: seriesType,
        data: seriesData[yCol],
        smooth: seriesType === 'line',
        showSymbol: seriesType === 'line',
        emphasis: { focus: 'series' },
      };

      if (isArea) {
        seriesOpt.areaStyle = { opacity: 0.25 };
      }

      if (seriesType === 'bar') {
        seriesOpt.barMaxWidth = 45;
        seriesOpt.itemStyle = {
          borderRadius: [4, 4, 0, 0],
        };
      }

      return seriesOpt;
    });

    if (yAxes.length > 1) {
      option.legend = {
        data: yAxes,
        right: 10,
        top: 10,
      };
      option.grid.top = '15%';
    }
  }

  return option;
}

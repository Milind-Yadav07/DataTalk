import React from 'react';
import ReactECharts from 'echarts-for-react';
import { toEChartsOption } from '../../lib/utils/echartsConfig';
import type { ChartConfig } from '../../types/chart';
import type { Row } from '../../types/dataset';

interface ChartWrapperProps {
  config: ChartConfig;
  data: Row[];
}

export default function AreaChartWrapper({ config, data }: ChartWrapperProps) {
  return (
    <ReactECharts
      option={toEChartsOption(config, data)}
      style={{ height: '350px', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}

import { BarChart3, LineChart, PieChart, AreaChart, ScatterChart, LucideIcon } from 'lucide-react';
import type { ChartType } from '../types/chart';

export interface ChartTypeMetadata {
  type: ChartType;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const CHART_TYPES_METADATA: ChartTypeMetadata[] = [
  {
    type: 'bar',
    label: 'Bar Chart',
    description: 'Compare values across different categories.',
    icon: BarChart3,
  },
  {
    type: 'line',
    label: 'Line Chart',
    description: 'Track changes over time or continuous intervals.',
    icon: LineChart,
  },
  {
    type: 'pie',
    label: 'Pie Chart',
    description: 'Show proportions and percentages of a whole.',
    icon: PieChart,
  },
  {
    type: 'area',
    label: 'Area Chart',
    description: 'Visualize trends, volumes, and accumulations over time.',
    icon: AreaChart,
  },
  {
    type: 'scatter',
    label: 'Scatter Plot',
    description: 'Examine relationships and correlations between two numeric variables.',
    icon: ScatterChart,
  },
];

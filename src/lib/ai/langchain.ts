import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { z } from 'zod';
import type { Column } from '../../types/dataset';
import type { ChartConfig } from '../../types/chart';
import { buildChartConfigPrompt, buildInsightPrompt, buildDbQueryPrompt, buildDbAnalysisSummaryPrompt } from './prompts';

// Global singleton pattern to prevent multiple model instances during development HMR
const globalForGemini = global as unknown as {
  gemini35ModelTemp0: ChatGoogleGenerativeAI | undefined;
  gemini35ModelTemp02: ChatGoogleGenerativeAI | undefined;
};

function getModel(temperature: number): ChatGoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not defined.');
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

  if (temperature === 0) {
    const cachedModel = globalForGemini.gemini35ModelTemp0;
    const isDifferentModel = cachedModel && (cachedModel as any).model !== modelName && (cachedModel as any).modelName !== modelName;
    if (!cachedModel || isDifferentModel) {
      globalForGemini.gemini35ModelTemp0 = new ChatGoogleGenerativeAI({
        apiKey,
        model: modelName,
        temperature: 0,
      });
    }
    return globalForGemini.gemini35ModelTemp0!;
  } else {
    const cachedModel = globalForGemini.gemini35ModelTemp02;
    const isDifferentModel = cachedModel && (cachedModel as any).model !== modelName && (cachedModel as any).modelName !== modelName;
    if (!cachedModel || isDifferentModel) {
      globalForGemini.gemini35ModelTemp02 = new ChatGoogleGenerativeAI({
        apiKey,
        model: modelName,
        temperature: temperature,
      });
    }
    return globalForGemini.gemini35ModelTemp02!;
  }
}

const ChartFilterSchema = z.object({
  column: z.string().describe('The column name in the dataset to filter on'),
  operator: z.enum(['eq', 'gt', 'lt', 'gte', 'lte', 'contains', 'not_eq', 'between']).describe('Comparison operator'),
  value: z.union([z.string(), z.number(), z.array(z.number())]).describe('Value to match or range for between'),
});

const ChartConfigSchema = z.object({
  dataExists: z.boolean().describe('Set to true if the requested data exists in the dataset schema and values, and can be visualized. Set to false if the requested data or columns are not present in the dataset.'),
  errorReason: z.string().optional().describe('If dataExists is false, explain why the requested data is not in the dataset (e.g., "this data is not there in dataset"). Keep it concise.'),
  chartType: z.enum(['bar', 'line', 'pie', 'area', 'scatter']).optional().describe('Type of chart to display. Required if dataExists is true.'),
  title: z.string().optional().describe('Title summarizing the chart. Required if dataExists is true.'),
  xAxis: z.string().optional().describe('X-axis column name. Required if dataExists is true.'),
  yAxis: z.union([z.string(), z.array(z.string())]).optional().describe('Y-axis column name or array of columns. Required if dataExists is true.'),
  aggregation: z.enum(['sum', 'avg', 'count', 'max', 'min']).optional().describe('Aggregation function if applicable'),
  filters: z.array(ChartFilterSchema).optional().describe('Filter criteria to apply to the dataset'),
  sortBy: z.enum(['asc', 'desc']).optional().describe('Sort order'),
  limit: z.number().optional().describe('Limit the number of records to show'),
  color: z.array(z.string()).optional().describe('Recommended colors (hex format)'),
});

/**
 * Generates a structured ChartConfig based on dataset schema, retrieved row context, and user request.
 */
export async function generateChartConfig(
  query: string,
  schema: Column[],
  context: string
): Promise<any> {
  const model = getModel(0);

  const structuredModel = model.withStructuredOutput(ChartConfigSchema);

  const prompt = buildChartConfigPrompt(schema, query, context);

  const response = (await structuredModel.invoke(prompt)) as any;

  // Generate a random unique ID for the chart config
  const id = `chart_${Math.random().toString(36).substring(2, 11)}`;

  return {
    id,
    ...response,
  } as ChartConfig;
}

/**
 * Generates natural language insights about the chart config and its data.
 */
export async function generateInsight(
  query: string,
  chartConfig: ChartConfig,
  data: any[]
): Promise<string> {
  const model = getModel(0.2);

  const dataSnippet = JSON.stringify(data.slice(0, 100), null, 2);

  const prompt = buildInsightPrompt(query, chartConfig.title || '', dataSnippet);

  const response = await model.invoke(prompt);
  return String(response.content || '');
}

/**
 * Generates a database query and chart configuration based on schema and user query.
 */
export async function generateDbQuery(
  dbType: 'mongodb' | 'postgresql',
  tableName: string,
  schema: Column[],
  queryText: string
): Promise<any> {
  const model = getModel(0);

  const DbQueryResponseSchema = z.object({
    queryExists: z.boolean().describe('Set to true if we can construct a query to answer the user request. Set to false if columns or data is missing.'),
    errorReason: z.string().optional().describe('Brief explanation if queryExists is false.'),
    query: z.string().describe(
      dbType === 'mongodb'
        ? 'A valid stringified JSON array representing a MongoDB aggregation pipeline (e.g., "[{\\"$match\\": { ... }}]"). DO NOT return SQL.'
        : 'A valid SQL SELECT query. DO NOT return MongoDB aggregation pipelines.'
    ),
    title: z.string().describe('Descriptive title for the query results.'),
  });

  const structuredModel = model.withStructuredOutput(DbQueryResponseSchema);
  const prompt = buildDbQueryPrompt(dbType, tableName, schema, queryText);
  const response = await structuredModel.invoke(prompt);
  return response;
}

/**
 * Generates a detailed data analysis summary for database query results.
 */
export async function generateDbAnalysisSummary(
  query: string,
  data: any[]
): Promise<string> {
  const model = getModel(0.2);
  const dataSnippet = JSON.stringify(data.slice(0, 100), null, 2);
  const prompt = buildDbAnalysisSummaryPrompt(query, dataSnippet);
  const response = await model.invoke(prompt);
  return String(response.content || '');
}

import type { Column, Row } from '@/types/dataset';

export function buildChartConfigPrompt(
  schema: Column[],
  userQuery: string,
  ragContext?: string
): string {

  const schemaDescription = schema
    .map(
      col =>
        `- "${col.name}" (${col.type}): sample values → ${col.sampleValues.slice(0, 5).join(', ')}`
    )
    .join('\n');

  const contextBlock = ragContext
    ? `\nRELEVANT DATA FROM DATASET:\n${ragContext}\n`
    : '';

  return `
You are a data visualisation expert. A user uploaded a CSV file and asked a question.
Your job is to return a JSON config that correctly visualises the answer from the data.

DATASET SCHEMA (column name, type, sample values):
${schemaDescription}
${contextBlock}
USER QUESTION: "${userQuery}"

Return ONLY valid JSON — no markdown, no explanation, no code fences.

JSON structure:
{
  "chartType": "bar" | "line" | "pie" | "area" | "scatter",
  "title": "clear descriptive title",
  "xAxis": "exact column name from schema",
  "yAxis": "exact column name from schema",
  "aggregation": "sum" | "avg" | "count" | "max" | "min" | null,
  "filters": [
    {
      "column": "exact column name",
      "operator": "eq" | "gt" | "lt" | "gte" | "lte" | "contains",
      "value": "exact value as it appears in the data"
    }
  ],
  "sortBy": "asc" | "desc" | null,
  "limit": number | null
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UNIVERSAL RULES — apply to ANY dataset:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULE 1 — HIGHEST / MAXIMUM / BEST / MOST queries:
Never use a filter for this. Always use sortBy + limit.
Examples:
- "highest salary"           → sortBy: "desc", limit: 1, yAxis: salary column
- "most expensive product"   → sortBy: "desc", limit: 1, yAxis: price column
- "best performing student"  → sortBy: "desc", limit: 1, yAxis: grade column
- "maximum revenue"          → sortBy: "desc", limit: 1, yAxis: revenue column
- "top 3 salaries"           → sortBy: "desc", limit: 3
- "top 10 products by sales" → sortBy: "desc", limit: 10, yAxis: sales column

RULE 2 — LOWEST / MINIMUM / WORST / LEAST queries:
Never use a filter for this. Always use sortBy + limit.
Examples:
- "lowest salary"            → sortBy: "asc", limit: 1
- "cheapest product"         → sortBy: "asc", limit: 1
- "worst performing store"   → sortBy: "asc", limit: 1
- "bottom 5 employees"       → sortBy: "asc", limit: 5

RULE 3 — SPECIFIC NAME / VALUE queries:
Use filters with operator "eq". Value must EXACTLY match what appears in the data context.
Examples:
- "show Alex Smith"          → filters: [{ column: "Name", operator: "eq", value: "Alex Smith" }]
- "data for iPhone 15"       → filters: [{ column: "Product", operator: "eq", value: "iPhone 15" }]
- "orders from London"       → filters: [{ column: "City", operator: "eq", value: "London" }]
- "sales in January"         → filters: [{ column: "Month", operator: "eq", value: "January" }]

RULE 4 — COMPARISON queries (show all or multiple):
No filters, no limit. Show everything.
Examples:
- "compare all salaries"     → no filters, no limit, bar chart
- "all products revenue"     → no filters, no limit, bar chart
- "sales by region"          → no filters, aggregation: "sum", bar chart

RULE 5 — RANGE queries:
Use gt/lt/gte/lte operators.
Examples:
- "salary above 50000"       → filters: [{ column: "Salary", operator: "gt", value: 50000 }]
- "experience less than 3"   → filters: [{ column: "Experience", operator: "lt", value: 3 }]
- "age between 25 and 35"    → filters: [{ column: "Age", operator: "gte", value: 25 }, { column: "Age", operator: "lte", value: 35 }]

RULE 6 — COLUMN NAMES:
Always use the exact column name from the schema above. Case sensitive.
Never invent column names that are not in the schema.

RULE 7 — FILTER VALUES:
Always use exact values as they appear in the data context above.
If the data shows "New York" use "New York" not "new york" or "NEW YORK".
If the data shows "iPhone 15" use "iPhone 15" not "iphone 15".

RULE 8 — CHART TYPE SELECTION:
- bar → comparing categories (most common choice)
- line → data over time (only when xAxis is a date column)
- pie → proportions of a whole (max 8 categories)
- area → trends over time with volume emphasis
- scatter → correlation between two numeric columns
- When in doubt → use bar chart

RULE 9 — SINGLE RECORD queries:
When result is a single person/item, use bar chart.
Example: "show Alex Smith" → bar chart with his columns as bars
  `.trim();
}

export function buildInsightPrompt(
  query: string,
  chartTitle: string,
  dataSummary: string
): string {
  return `
You are a data analyst. Write a 2-3 sentence plain-English insight about this chart.
Be specific with actual numbers and values from the data.
Mention the most important finding, trend, or outlier.
Do NOT start with "The chart shows" — be direct and specific.

User asked: "${query}"
Chart title: "${chartTitle}"
Data: ${dataSummary}

Respond with only the insight text. No bullet points. No markdown.
  `.trim();
}

export function buildDbQueryPrompt(
  dbType: 'mongodb' | 'postgresql',
  tableName: string,
  schema: Column[],
  userQuery: string
): string {
  const schemaDescription = schema
    .map(col => `- "${col.name}" (Type: ${col.type}, sample values: ${col.sampleValues.slice(0, 3).join(', ')})`)
    .join('\n');

  const rules = dbType === 'mongodb' 
    ? `CRITICAL RULES FOR MONGODB:
- You MUST generate a valid stringified JSON array representing a MongoDB aggregation pipeline (e.g., "[{\\"$group\\": {\\"\$_id\\": \\"\$city\\", \\"total_revenue\\": {\\"\$sum\\": \\"\$amount\\"}}}, {\\"\$sort\\": {\\"total_revenue\\": -1}}]").
- DO NOT write any SQL syntax. SQL queries (like SELECT, FROM, WHERE) will fail and cause errors.
- DO NOT use write/merge stages (like "$out" or "$merge").
- Remember that MongoDB aggregation output fields are defined by you in the pipeline. Make sure you use flat keys.`
    : `CRITICAL RULES FOR SQL (PostgreSQL):
- You MUST generate a valid SQL SELECT query.
- DO NOT write any MongoDB aggregation pipeline JSON.
- ONLY query columns that exist in the schema above.
- NEVER generate destructive statements (DROP, DELETE, UPDATE, INSERT, ALTER, TRUNCATE, CREATE, INTO).
- Use SQL aggregations (SUM, AVG, COUNT, MAX, MIN) and GROUP BY to do the aggregation inside the database.
- Use explicit alias names (e.g., SELECT city, SUM(amount) AS total_revenue) so the resulting column names are clean.
- Ensure the table name in the query matches "${tableName}" exactly. Double-quote the table name if it has capitals or special characters (e.g. FROM "${tableName}").`;

  return `
You are an expert data analyst and database engineer. The user has connected a ${dbType} database and selected the table/collection "${tableName}" for analysis.

Here is the SCHEMA of "${tableName}" (field names and inferred types):
${schemaDescription}

USER QUESTION: "${userQuery}"

Your goal is to:
1. Write a read-only database query that gathers, filters, aggregates, groups, or sorts the data to perfectly answer the user's question.
2. Provide a short, descriptive title for the query results (e.g. "Total Revenue by Month").

${rules}

Return ONLY a structured JSON response matching the schema details.
  `.trim();
}

export function buildDbAnalysisSummaryPrompt(
  userQuery: string,
  dataSnippet: string
): string {
  return `
You are a senior data analyst. The user queried their live database with the question: "${userQuery}".
Here are the query results (JSON format):
${dataSnippet}

Write a detailed, structured data analysis summary in plain English that answers the user's question.
Guidelines:
- Provide a clear, direct answer to the user's question first.
- Reference actual numbers, percentages, or records from the query results.
- Structure it cleanly with paragraphs or bullet points if needed (use standard text or markdown, but keep it readable).
- Do not reference "the SQL query", "the database", or technical details about tables unless requested. Focus purely on the business and data insights.
- Do NOT output HTML.
`.trim();
}

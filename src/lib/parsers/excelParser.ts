import * as XLSX from 'xlsx';
import type { Dataset, Column, ColumnType, Row } from '../../types/dataset';

/**
 * Parses an Excel File object (XLS, XLSX) and returns a complete Dataset object with typed rows and columns.
 */
export function parseExcel(file: File): Promise<Dataset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('Could not read file data');
        }

        // Read as array buffer
        const workbook = XLSX.read(data, { type: 'array' });
        if (workbook.SheetNames.length === 0) {
          throw new Error('Excel file has no sheets.');
        }

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert worksheet to JSON rows
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Record<string, any>[];
        if (rawRows.length === 0) {
          throw new Error('Excel sheet is empty.');
        }

        const headers = Object.keys(rawRows[0]);
        const sampleRowCount = Math.min(rawRows.length, 50);
        const sampleRows = rawRows.slice(0, sampleRowCount);

        const columns: Column[] = headers.map((header) => {
          const values = sampleRows
            .map((row) => String(row[header] ?? '').trim())
            .filter((val) => val !== '');

          let colType: ColumnType = 'string';

          if (values.length > 0) {
            // 1. Check for boolean: all values in ['true','false','yes','no','1','0']
            const isBool = values.every((v) =>
              ['true', 'false', 'yes', 'no', '1', '0'].includes(v.toLowerCase())
            );

            // 2. Check for number: all values pass !isNaN(Number(v))
            const isNum = values.every((v) => !isNaN(Number(v)));

            // 3. Check for date: matches /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}/ or valid Date.parse
            const dateRegex = /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}/;
            const isDate = values.every((v) => dateRegex.test(v) || (!isNaN(Date.parse(v)) && isNaN(Number(v))));

            if (isBool) {
              colType = 'boolean';
            } else if (isNum) {
              colType = 'number';
            } else if (isDate) {
              colType = 'date';
            }
          }

          // Gather up to 5 unique non-empty sample values
          const uniqueSamples = Array.from(
            new Set(
              rawRows
                .map((row) => String(row[header] ?? '').trim())
                .filter((val) => val !== '')
            )
          ).slice(0, 5);

          return {
            name: header,
            type: colType,
            sampleValues: uniqueSamples,
          };
        });

        // Cast rows to their inferred types
        const typedRows: Row[] = rawRows.map((row) => {
          const typedRow: Row = {};
          for (const col of columns) {
            const rawVal = String(row[col.name] ?? '').trim();
            if (rawVal === '') {
              typedRow[col.name] = null;
              continue;
            }

            if (col.type === 'number') {
              typedRow[col.name] = Number(rawVal);
            } else if (col.type === 'boolean') {
              const lower = rawVal.toLowerCase();
              typedRow[col.name] = lower === 'true' || lower === 'yes' || lower === '1';
            } else {
              typedRow[col.name] = rawVal;
            }
          }
          return typedRow;
        });

        const dataset: Dataset = {
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^/.]+$/, ''), // friendly name without extension
          fileName: file.name,
          columns,
          rows: typedRows,
          rowCount: typedRows.length,
          uploadedAt: new Date(),
          userId: '', // updated by backend or caller
          isIndexed: false,
        };

        resolve(dataset);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

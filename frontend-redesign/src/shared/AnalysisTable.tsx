import type { ReactNode, Key } from 'react';
import { numberText, tableCellValue } from './format';
import './data-workspace.css';

export type AnalysisColumn<Row> = {
  key: string;
  label: string;
  heading?: ReactNode;
  render: (row: Row) => ReactNode;
  numeric?: boolean;
};

type AnalysisTableProps<Row> = {
  label: string;
  rows: readonly Row[];
  columns: readonly AnalysisColumn<Row>[];
  empty?: ReactNode;
  rowKey?: (row: Row, index: number) => Key;
  containerClassName?: string;
  tableClassName?: string;
  formatCell?: (value: ReactNode, columnIndex: number) => ReactNode;
  alignRowHeader?: boolean;
};

/** Read-only analytical data; no fictitious sort or row action. */
export function AnalysisTable<Row>({
  label,
  rows,
  columns,
  empty,
  rowKey,
  containerClassName = 'dw-table-scroll dw-analysis-scroll focus-ring',
  tableClassName = 'dw-table dw-analysis-table',
  formatCell = tableCellValue,
  alignRowHeader = true,
}: AnalysisTableProps<Row>) {
  return (
    <div className={containerClassName} role="region" aria-label={label} tabIndex={0}>
      <table className={tableClassName}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" data-align={column.numeric ? 'end' : undefined}>
                {column.heading ?? column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={rowKey?.(row, index) ?? index}>
                {columns.map((column, columnIndex) => {
                  const value = formatCell(column.render(row), columnIndex);
                  const align = column.numeric ? 'end' : undefined;
                  return columnIndex === 0 ? (
                    <th
                      scope="row"
                      key={column.key}
                      data-align={alignRowHeader ? align : undefined}
                    >
                      {value}
                    </th>
                  ) : (
                    <td key={column.key} data-align={align}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : empty !== undefined ? (
            <tr>
              <td colSpan={columns.length}>{empty}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export type MatrixTableProps = {
  headers: readonly string[];
  rows: readonly (readonly ReactNode[])[];
  label?: string;
};

type MatrixAnalysisTableProps = MatrixTableProps & {
  numericHeaders?: ReadonlySet<string>;
  containerClassName: string;
  tableClassName: string;
  formatBody?: (value: ReactNode) => ReactNode;
};

/** Existing analysis views already build rectangular rows. Keep their layout and formatter,
 * but delegate all actual table markup and accessibility to AnalysisTable. */
export function MatrixAnalysisTable({
  headers,
  rows,
  label = 'Bảng số liệu',
  numericHeaders,
  containerClassName,
  tableClassName,
  formatBody = tableCellValue,
}: MatrixAnalysisTableProps) {
  const columns: AnalysisColumn<readonly ReactNode[]>[] = headers.map((header, index) => ({
    key: String(index),
    label: header,
    numeric: numericHeaders?.has(header),
    render: (row) => row[index],
  }));
  return (
    <AnalysisTable
      label={label}
      rows={rows}
      columns={columns}
      containerClassName={containerClassName}
      tableClassName={tableClassName}
      alignRowHeader={false}
      formatCell={(value, index) => (index === 0 ? value : formatBody(value))}
    />
  );
}

/** Keep the existing count/decimal and missing-value policy of admissions tables. */
export function admissionsAnalysisCell(value: ReactNode): ReactNode {
  return typeof value === 'number' ? numberText(value, 2) : (value ?? '—');
}

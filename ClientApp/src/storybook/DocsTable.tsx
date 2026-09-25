import type { ReactNode } from 'react';

export interface DocsTableProps {
  headers: ReactNode[];
  rows: ReactNode[][];
}

const DocsTable = ({ headers, rows }: DocsTableProps) => (
  <table>
    <thead>
      <tr>
        {headers.map((header, index) => (
          <th key={`header-${index}`}>{header}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, rowIndex) => (
        <tr key={`row-${rowIndex}`}>
          {row.map((cell, cellIndex) => (
            <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

export default DocsTable;

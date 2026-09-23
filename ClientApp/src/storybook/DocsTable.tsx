import type { ReactNode } from 'react';

export interface DocsTableProps {
  headers: ReactNode[];
  rows: ReactNode[][];
}

const DocsTable = ({ headers, rows }: Readonly<DocsTableProps>) => (
  <table>
    <thead>
      <tr>
        {headers.map((header, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: DocsTable receives display nodes, not keyed header models.
          <th key={`header-${index}`}>{header}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, rowIndex) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: DocsTable receives display rows, not keyed row models.
        <tr key={`row-${rowIndex}`}>
          {row.map((cell, cellIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: DocsTable receives display cells, not keyed cell models.
            <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

export default DocsTable;

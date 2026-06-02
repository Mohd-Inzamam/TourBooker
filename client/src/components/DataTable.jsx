import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import '../styles/components.css';

export const DataTable = ({
  columns = [],
  data = [],
  onSort,
  sortColumn,
  sortDirection = 'asc',
  className = '',
  onRowClick
}) => {
  return (
    <div className={`ag-table-container ${className}`}>
      <table className="ag-table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th 
                key={index} 
                onClick={() => col.sortable && onSort && onSort(col.key)}
                className={`${col.sortable ? 'ag-sortable' : ''} ${col.align === 'right' ? 'ag-text-right' : ''}`}
                style={{ width: col.width }}
              >
                <div className={`ag-th-content ${col.align === 'right' ? 'ag-th-right' : ''}`}>
                  {col.label}
                  {col.sortable && (
                    <span className="ag-sort-icon">
                      {sortColumn === col.key ? (
                        sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                      ) : (
                        <span className="ag-sort-placeholder"></span>
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? 'ag-row-clickable' : ''}
              >
                {columns.map((col, colIndex) => (
                  <td 
                    key={colIndex}
                    className={col.align === 'right' ? 'ag-text-right' : ''}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="ag-table-empty">
                <div className="ag-empty-state">
                  <p>No data available</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

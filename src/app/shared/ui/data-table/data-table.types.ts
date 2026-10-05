export interface DtTableColumn<T> {
  id: string;
  label: string;
  priority: 1 | 2 | 3;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
  width?: string;
  accessor: (row: T) => string | number | null;
}

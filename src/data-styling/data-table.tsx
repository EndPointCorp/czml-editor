import { VNode } from "preact"

type StringOrVNode = string | VNode;

export type DataTableColumn<T = {}> = {
    header: StringOrVNode | ( () => StringOrVNode );
    accessor: (data: any, inx: number) => T;
}

type DataTableProps<D = any> = {
    data: D[];
    columns: DataTableColumn[];
    className?: string;
}
export function DataTable({columns, data, className}: DataTableProps) {

    const ths = columns
        .filter(c => !!c)
        .map(cmn => <th>{cmn.header}</th>);

    const rows = data.map((d, inx) => {
        const cells = columns.map(cmn => <td>{cmn.accessor(d, inx)}</td>);
        return <tr>{cells}</tr>;
    });

    return (
    <table class={className}>
        <thead>
            <tr>{ths}</tr>
        </thead>
        
        <tbody>
            {rows}
        </tbody>
    </table>
    );

}
import { useCallback, useContext, useState } from "preact/hooks";
import { FileInput } from "../../misc/elements/file-input";
import Papa from 'papaparse';
import { ModalPane } from "../../misc/elements/modal-pane";
import { DataTable } from "../../data-styling/data-table";
import { LabledSwitch } from "../../misc/elements/labled-switch";

import "./import-files.css"
import { Cartesian3, Entity, Color, VerticalOrigin, Cartesian2 } from "cesium";
import { ViewerContext } from "../../app";

type ImportFromFileProps = {
    onImport?: (entities: Entity[]) => void
};
export function ImportFromFile({ onImport }: ImportFromFileProps) {

    const viewer = useContext(ViewerContext);

    const [data, setData] = useState<any[]>([]);
    const [r1Header, setR1Header] = useState<boolean>(true);
    const [latitudeColumn, setLatitudeColumn] = useState(0);
    const [longitudeColumn, setLongitudeColumn] = useState(0);

    const [nameColumn, setNameColumn] = useState(0);
    const [createPoints, setCreatePoints] = useState<boolean>(true);
    const [createBillboards, setCreateBillboards] = useState<boolean>(false);
    const [showLabels, setShowLabels] = useState<boolean>(true);
    const [labelColumn, setLabelColumn] = useState(0);

    const handleDataLoaded = useCallback((d: unknown[]) => {
        setData(d);

        if (r1Header && d.length > 0) {
            const firstRow = d[0];

            const latColumn = (firstRow as string[]).findIndex(name => {
                return (/(lat|latitude)/ig).test(name);
            });

            const lonColumn = (firstRow as string[]).findIndex(name => {
                return (/(lon|lng|longitude)/ig).test(name);
            });

            const lblColumn = (firstRow as string[]).findIndex(name => {
                return (/(name|label|title)/ig).test(name);
            });

            latColumn >= 0 && setLatitudeColumn(latColumn);
            lonColumn >= 0 && setLongitudeColumn(lonColumn);
            lblColumn >= 0 && setLabelColumn(lblColumn);
        }

    }, [r1Header, setData, setLatitudeColumn, setLongitudeColumn, setLabelColumn]);

    const fileSelected = useCallback((file: File) => {
        Papa.parse(file, {
            delimiter: "",
            complete: (results) => {
                handleDataLoaded(results.data);
            }
        });
    }, [handleDataLoaded]);

    const columns = data[0]?.map((v: any, i: number) => {
        return {
            header: r1Header ? v : `Column ${i + 1}`,
            accessor: (row: any[], _r: number) => row[i]
        }
    }) || [];

    const [firstRow, ...dataBody] = data;

    const handleImport = useCallback(() => {
        const entities = (r1Header ? dataBody : data).map((row) => {
            const lat = parseFloat(row[latitudeColumn]);
            const lon = parseFloat(row[longitudeColumn]);

            if (isNaN(lat) || isNaN(lon)) return null;

            const entity: Entity.ConstructorOptions = {
                position: Cartesian3.fromDegrees(lon, lat),
                name: row[nameColumn]
            };

            if (createPoints) {
                entity.point = {
                    pixelSize: 10,
                    color: Color.WHITESMOKE,
                    disableDepthTestDistance: 10000000,
                };
            }

            if (createBillboards) {
                entity.billboard = { scale: 1.0 };
            }

            if (showLabels) {
                entity.label = {
                    text: row[labelColumn],
                    pixelOffset: new Cartesian2(0, -5),
                    verticalOrigin: VerticalOrigin.BOTTOM
                };
            }



            return viewer?.entities.add(entity);
        }).filter(e => e != null);

        onImport && onImport(entities);
        setData([]);

    }, [viewer, data, dataBody, r1Header, latitudeColumn, longitudeColumn, nameColumn,
        createPoints, createBillboards, showLabels, labelColumn, onImport]);

    const canImport = (createPoints || createBillboards || showLabels) && data.length > 0;

    return (
        <>
            <ModalPane visible={data.length > 0} className="csv-import-pane">
                <div class={'actions'}>
                    <button onClick={() => setData([])}>Close</button>
                    <button disabled={!canImport} onClick={handleImport}>Import</button>
                </div>

                <div className={"csv-import-options"}>
                    <LabledSwitch label={"First row is header"} checked={r1Header} onChange={() => setR1Header(!r1Header)} />

                    <div className={"form-section"}>
                        <div className="section-title">Coordinates</div>
                        <div className={"creation-option"}>
                            <label>Latitude: </label>
                            <ColumnSelect column={latitudeColumn} columns={columns} onChange={(c) => setLatitudeColumn(columns.indexOf(c))} />
                        </div>
                        <div className={"creation-option"}>
                            <label>Longitude: </label>
                            <ColumnSelect column={longitudeColumn} columns={columns} onChange={(c) => setLongitudeColumn(columns.indexOf(c))} />
                        </div>
                    </div>

                    <div className={"form-section"}>
                        <div className={"creation-option"}>
                            <label>Name: </label>
                            <ColumnSelect column={nameColumn} columns={columns} onChange={(c) => setNameColumn(columns.indexOf(c))} />
                        </div>

                        <LabledSwitch label={"Show Labels"} checked={showLabels} onChange={() => setShowLabels(!showLabels)} />

                        {showLabels && (
                            <div>
                                <label>Label Column: </label>
                                <ColumnSelect column={labelColumn} columns={columns} onChange={(c) => setLabelColumn(columns.indexOf(c))} />
                            </div>
                        )}
                    </div>

                    <LabledSwitch label={"Create Points"} checked={createPoints} onChange={() => setCreatePoints(!createPoints)} />
                    <LabledSwitch label={"Create Billboards"} checked={createBillboards} onChange={() => setCreateBillboards(!createBillboards)} />

                </div>

                <div class={'import-table-container'}>
                    <DataTable className="csv-data" data={r1Header ? dataBody : [firstRow, ...dataBody]} columns={columns} />
                </div>
            </ModalPane>
            <FileInput name="Import"
                accept={".csv, .tsv"}
                onFile={fileSelected} />
        </>
    );
}

type ColumnSelectProps = {
    column: { header: string } | string | number
    columns: { header: string }[]
    onChange?: (column: { header: string }) => void
};
function ColumnSelect({ column, columns, onChange }: ColumnSelectProps) {

    const selectedInx = typeof column === 'number' ? column : (
        columns.findIndex(col => typeof column === 'string' ? col.header === column : column === col)
    );

    const options = columns.map((col, inx) => <option value={`${inx}`}>{col.header}</option>);

    const handleChange = useCallback((e: Event) => {
        const inx = parseInt((e.target as HTMLSelectElement).value);
        onChange && onChange(columns[inx])
    }, [columns, onChange]);

    return (
        <select value={selectedInx} onChange={handleChange}>
            {options}
        </select>
    )
}


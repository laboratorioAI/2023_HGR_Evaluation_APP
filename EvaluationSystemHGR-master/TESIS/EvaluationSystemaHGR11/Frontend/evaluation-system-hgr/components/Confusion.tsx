
import {useEffect, useState} from "react";
import {Table} from "react-bootstrap";

type Confusion = {
    matrixData: [][],
    classes: [] ,
}
export default function ({matrixData, classes} : Confusion) {
    const [classesColumn,setClassesColumn] = useState<string[]>(classes);
    useEffect(()=>{
    setClassesColumn(classes=> [...classes,"Targets count"]);
    setClassesColumn(classes=> [...classes,"Sensitivity"]);

    },[classes])

    return(<>
        <>
            <div style={{ textAlign: "center" }}>
                <p><strong>Confusion Matrix of the Proposed Models</strong></p>
                <Table striped hover style={{ textAlign: "center" }}>
                    <thead>
                    <tr>
                        <th></th>
                        {classes && classes.map((value) => <th><p>{value}</p></th>)}
                        <th><p>Precision</p></th>
                    </tr>
                    </thead>
                    <tbody>
                    {matrixData &&
                        matrixData.map((row, index) => {
                            return (
                                <tr key={index}>
                                    <td>
                                        <p><strong>{classesColumn[index]}</strong></p>
                                    </td>
                                    {row.map((value: number, colIndex) => {
                                        const isDiagonal = index === colIndex || row.length-1    === index || row.length === index || row.length-1=== colIndex;
                                        const cellStyle = {
                                            color: isDiagonal ? "green" : "red",
                                            fontWeight: isDiagonal ? "bold" : "normal",
                                        };

                                        return Number.isInteger(value) ? (
                                            <td key={colIndex} style={cellStyle}>
                                                {value}
                                            </td>
                                        ) : (
                                            <td key={colIndex} style={cellStyle}>
                                                {value.toFixed(2)}%
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </div>
        </>

    </>)
}
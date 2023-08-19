import {useEffect, useState, useRef} from "react";
import React from 'react';
import {Chart as ChartJS, registerables} from 'chart.js';
import 'chartjs-plugin-datalabels';
import {Bar, Line} from 'react-chartjs-2'
import {Model, User} from "../services/models";
import {Button, Card, Nav} from "react-bootstrap";
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import Confusion from "./Confusion";
import { Parser } from '@json2csv/plainjs';

ChartJS.register(...registerables);
const optionsAccuracy: {[key: string]: string} = {
    "class": "Classification",
    "recog": "Recognition",
    "times": "Times",
    "": "Classification",

}
type ModelProps = {
    model: Model,
    typeOfAccuracy: string,
}
type data = {
    labels: string[],
    datasets:
        [];
};

export default function ({model, typeOfAccuracy}: ModelProps) {

    const [modelGraph, setModelGraph] = useState<Model|null>(null)
    const [data, setData] = useState<data|null>(null);
    const [options, setOptions] = useState<{}|null>(null);
    const [typeOfGraphic, setTypeOfGraphic] = useState("line");

    const handleCapture = () => {
        const chart = document.querySelector('#myChart');

        if (chart instanceof HTMLElement) {
            html2canvas(chart).then(canvas => {
                canvas.toBlob(blob => {
                    if (blob !== null) {
                        saveAs(blob, `${typeOfGraphic + typeOfAccuracy}.png`);
                    }
                });
            });
        }
    };
    const convertAndDownloadCSV = () => {

        const fields = [
            'user',
            typeOfAccuracy,
        ];

        const opts = { fields };

        try {
            const parser = new Parser(opts);


            const users = model
                .users.map((user) => {
                    const userMapped = {};
                    // @ts-ignore
                    userMapped["user"] = Object.keys(user)[0];
                    const userValues = {};

                    if(typeOfAccuracy==="class"){
                        // @ts-ignore
                        userValues["class"] = Object.values(user)[0]["class"];
                    }else{
                        // @ts-ignore
                        userValues["recog"] = Object.values(user)[0]["recog"];
                    }

                    return {...userMapped,...userValues};
                });


            const csvContent = parser.parse(users);

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `${model.model.name}.csv`;
            link.click();

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al generar y descargar el archivo CSV:', error);
        }
    };

    const graphModelChartter = () => {
        model.users
        if (typeOfAccuracy == "times") {
            let array  = model.graphs.times.map((user) => {
                return (user[0] * 100).toFixed(2);
            });

            const datas = {

                labels: array ,
                datasets: [{
                    label: "Frecuency",
                    type: "bar",
                    data: model.graphs["times"].map((user) => {
                        return user[1]
                    }),
                    fill: false,
                    backgroundColor: 'rgba(0, 0, 0, 1)',
                    borderColor: 'rgba(255, 255, 255, 0)',
                    borderWidth: 0,
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                    pointRadius: 5,
                },

                ]
            };
            // @ts-ignore
            setData(datas);

            const optionsGraphHistogram = {

                scales: {
                    x: {
                        type: 'category',
                        title: {
                            display: true,
                            text: 'Times (ms)',
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Normalized frequency',
                        },
                        ticks: {
                            // Establecer el formato de los números en el eje Y
                            callback: function (value : number) {
                                return value.toLocaleString() + "%";
                            },
                        },

                    },
                },responsive: true,
                plugins: {
                    legend: {
                        position: 'top' as const,

                    },tooltip: {

                        callbacks: {
                            // @ts-ignore
                            title: function (context) {
                                const dataIndex = context[0].dataIndex; // Obtener el índice del punto de datos
                                const datasetIndex = context[0].datasetIndex; // Obtener el índice del conjunto de datos
                                const dataset = context[0].chart.data.datasets[datasetIndex]; // Obtener el conjunto de datos correspondiente
                                const value = dataset.data[dataIndex]; // Obtener el valor del punto de datos

                                return "Frequency: " + value.toFixed(4) + "%";
                            },
                            // @ts-ignore
                            label: function (context) {
                                const label = context.chart.data.labels[context.dataIndex]; // Obtener la etiqueta correspondiente del eje x

                                return "Times: " + label + " ms";
                            }
                        }
                    }
                },

            };
            setOptions(optionsGraphHistogram)
        } else {

            if (typeOfGraphic=="line") {

                const datas = {

                    labels: model.graphs["scatter"][typeOfAccuracy].map((user:[string, number]) => {
                        return user[0];
                    }),
                    datasets: modelGraph
                        ? [
                            {
                                label: "Accuracy",
                                type: "line",
                                data: model.graphs["scatter"][typeOfAccuracy].map((user: [string, number]) => {
                                    return user[1] * 100;
                                }),
                                fill: false,
                                backgroundColor: typeOfAccuracy === "class" ? "rgba(255, 99, 132, 1)" : "rgba(0, 99, 132, 1)",
                                borderColor: "rgba(255, 255, 255, 0)",
                                borderWidth: 0,
                                pointBackgroundColor: typeOfAccuracy === "class" ? "rgba(255, 99, 132, 1)" : "rgba(0, 99, 132, 1)",
                                pointRadius: 5,
                            },
                            {
                                label: `Promedio: ${(modelGraph.model[typeOfAccuracy] * 100).toFixed(2)}%`,
                                data: Array(modelGraph.users.length).fill(modelGraph.model[typeOfAccuracy] * 100),
                                type: "line" as const,
                                backgroundColor: "rgba(0, 0, 0, 0)",
                                borderColor: "rgba(0, 0, 0, 1)",
                                borderWidth: 1,
                                pointRadius: 1,
                                pointHoverRadius: 0,
                                borderDash: [5, 5],
                                fill: false,
                            },
                            {
                                label: `Desviación superior: ${(modelGraph.model[typeOfAccuracy] * 100 + modelGraph.model[typeOfAccuracy + "Std"] * 100).toFixed(2)}%` +
                                    `  Desviación inferior: ${(modelGraph.model[typeOfAccuracy] * 100 - modelGraph.model[typeOfAccuracy + "Std"] * 100).toFixed(2)}%`,
                                data: Array(modelGraph.users.length).fill(modelGraph.model[typeOfAccuracy] * 100 + modelGraph.model[typeOfAccuracy + "Std"] * 100),
                                fill: true,
                                backgroundColor: "rgba(255, 206, 86, 0.5)",
                                borderColor: "rgba(255, 165, 0, 1)",
                                borderWidth: 1,
                                pointRadius: 0,
                                order: 1,
                            },
                            {
                                label: "",
                                data: Array(modelGraph.users.length).fill(modelGraph.model[typeOfAccuracy] * 100 - modelGraph.model[typeOfAccuracy + "Std"] * 100),
                                fill: true,
                                backgroundColor: "rgba(255, 255, 255, 1)",
                                borderColor: "rgba(255, 165, 0, 0)",
                                borderWidth: 1,
                                pointRadius: 0,
                                order: 0,
                            },
                        ]
                        : [], // Retorna un arreglo vacío si modelGraph no existe
                };
                // @ts-ignore
                setData(datas);
                const optionsGraphScatter = {
                    scales: {
                        x:{
                            title: {
                                display: true,
                                text: 'Users',
                            },
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Accuracy',
                            },
                            ticks: {
                                // Establecer el formato de los números en el eje Y
                                callback: function (value: number) {
                                    return value.toLocaleString() + "%";
                                },
                            },
                        },
                    },
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top' as const,

                        },tooltip: {
                            callbacks: {
                                // @ts-ignore
                                title: function (context) {
                                    const dataIndex = context[0].dataIndex; // Obtener el índice del punto de datos
                                    const datasetIndex = context[0].datasetIndex; // Obtener el índice del conjunto de datos
                                    const dataset = context[0].chart.data.datasets[datasetIndex]; // Obtener el conjunto de datos correspondiente
                                    const value = dataset.data[dataIndex]; // Obtener el valor del punto de datos

                                    return "Accuracy: " + value.toFixed(2) + "%";
                                },
                                // @ts-ignore
                                label: function (context) {
                                    const label = context.chart.data.labels[context.dataIndex]; // Obtener la etiqueta correspondiente del eje x

                                    return "User: " + label ;
                                }
                            }
                        }
                    },

                };
                setOptions(optionsGraphScatter)
            } else {
                const datas = {
                    labels: model.graphs["histogram"][typeOfAccuracy].map((user:[string, number]) => {
                        return user[0];
                    }),
                    datasets: [{
                        label: "Accuracy",
                        type: "bar",
                        data: model.graphs["histogram"][typeOfAccuracy].map((user:[string, number]) => {
                            return user[1] * 100 / model.users.length
                        }),
                        fill: false,
                        backgroundColor: typeOfAccuracy ==="class"?'rgba(255, 99, 132, 1)' :'rgba(0, 99, 132, 1)',
                        borderColor: 'rgba(255, 255, 255, 0)',
                        borderWidth: 0,
                        pointBackgroundColor: typeOfAccuracy ==="class"?'rgba(255, 99, 132, 1)' :'rgba(0, 99, 132, 1)',
                        pointRadius: 5,
                    },
                    ]
                };
                // @ts-ignore
                setData(datas)
                const optionsGraphHistogram = {

                    scales: {
                        x: {
                            type: 'category',
                            title: {
                                display: true,
                                text: 'Accuracy',
                            },
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Normalized frequency',
                            },
                            ticks: {
                                // Establecer el formato de los números en el eje Y
                                callback: function (value : number) {
                                    return value.toLocaleString() + "%";
                                },
                            },

                        },
                    },plugins: {
                        legend: {
                            position: 'top' as const,

                        },tooltip: {

                            callbacks: {
                                // @ts-ignore
                                title: function (context) {
                                    const dataIndex = context[0].dataIndex; // Obtener el índice del punto de datos
                                    const datasetIndex = context[0].datasetIndex; // Obtener el índice del conjunto de datos
                                    const dataset = context[0].chart.data.datasets[datasetIndex]; // Obtener el conjunto de datos correspondiente
                                    const value = dataset.data[dataIndex]; // Obtener el valor del punto de datos

                                    return "Frequency: " + value.toFixed(2) + "%";
                                },
                                // @ts-ignore
                                label: function (context) {
                                    const label = context.chart.data.labels[context.dataIndex]; // Obtener la etiqueta correspondiente del eje x

                                    return "Accuracy: " + label ;
                                }
                            }
                        }
                    },

                };
                setOptions(optionsGraphHistogram)
            }
        }

    }
    useEffect(() => {

        setModelGraph(model);

    }, [])
    useEffect(() => {
        if (modelGraph) {
            graphModelChartter()
        }
    }, [modelGraph, typeOfAccuracy, typeOfGraphic])

    return (
        <>
            <div style={{ width: '85%', padding: '0% 0% 0% 15%'  }}>
                <div id="myChart">
                    <div>
                        {typeOfAccuracy==="class"&&(
                            <Card style={{padding:"0px"}}>
                                <Card.Header>
                                    <Card.Title >  {optionsAccuracy[typeOfAccuracy]} graphic </Card.Title>
                                    <Nav variant="tabs" defaultActiveKey={`#${typeOfGraphic}`}>
                                        <Nav.Item>
                                            <div onClick={(e) => {
                                                e.preventDefault();
                                                setTypeOfGraphic("line");
                                            }}>
                                                <Nav.Link href="#line" >Dispersion</Nav.Link>
                                            </div>
                                        </Nav.Item>
                                        <Nav.Item>
                                            <div onClick={(e) => {
                                                e.preventDefault();
                                                setTypeOfGraphic("bar");
                                            }}>
                                                <Nav.Link href="#bar" >Histogram</Nav.Link>
                                            </div>
                                        </Nav.Item>
                                        <Nav.Item>
                                            <div onClick={(e) => {
                                                e.preventDefault();
                                                setTypeOfGraphic("confusion");
                                            }}>
                                                <Nav.Link href="#Confusion" >Confusion</Nav.Link>
                                            </div>
                                        </Nav.Item>
                                    </Nav>
                                </Card.Header>
                                <Card.Body>
                                    <div>
                                        {data && options && (
                                            <>
                                                {typeOfGraphic === 'line' && (
                                                    <Line data={data} options={options} id="myChart" />
                                                )}
                                                {typeOfGraphic === 'bar' && (
                                                    <Bar data={data} options={options} id="myChart"/>
                                                )}
                                                {typeOfGraphic === 'confusion' && (
                                                    <Confusion matrixData={model.graphs["confusion"]["confusion"]} classes={model.graphs["confusion"]["classes"]} ></Confusion>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </Card.Body>

                            </Card>
                        )}
                        {typeOfAccuracy=="recog"&&(
                            <Card style={{padding:"0px"}} >
                                <Card.Header>
                                    <Card.Title > {optionsAccuracy[typeOfAccuracy]} graphic </Card.Title>
                                    <Nav variant="tabs" defaultActiveKey={`#${typeOfGraphic}`}>
                                        <Nav.Item>
                                            <div onClick={(e) => {
                                                e.preventDefault();
                                                setTypeOfGraphic("line");
                                            }}>
                                                <Nav.Link href="#line" >Dispersion</Nav.Link>
                                            </div>
                                        </Nav.Item>
                                        <Nav.Item>
                                            <div onClick={(e) => {
                                                e.preventDefault();
                                                setTypeOfGraphic("bar");
                                            }}>
                                                <Nav.Link href="#bar" >Histogram</Nav.Link>
                                            </div>
                                        </Nav.Item>
                                    </Nav>
                                </Card.Header>
                                <Card.Body>
                                    <div>
                                        {data && options && (
                                            <>
                                                {typeOfGraphic === 'line' && (
                                                    <Line data={data} options={options}  />
                                                )}
                                                {typeOfGraphic === 'bar' && (
                                                    <Bar data={data} options={options} />
                                                )}
                                            </>
                                        )}
                                    </div>
                                </Card.Body>

                            </Card>
                        )}
                        {typeOfAccuracy=="times"&&(
                            <Card style={{padding:"0px"}}>

                                <Card.Header>
                                    <Card.Title > {optionsAccuracy[typeOfAccuracy]} graphic </Card.Title>
                                    <Nav variant="tabs" defaultActiveKey={"#times"}>
                                        <Nav.Item>
                                            <div onClick={(e) => {
                                                e.preventDefault();
                                                setTypeOfGraphic("bar");
                                            }}>
                                                <Nav.Link href="#times">Times</Nav.Link>
                                            </div>
                                        </Nav.Item>

                                    </Nav>
                                </Card.Header>
                                <Card.Body>
                                    <div>
                                        {data && options && (
                                            <>

                                                {typeOfAccuracy === 'times' && (
                                                    <Bar data={data} options={options} id="myChart"/>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </Card.Body>

                            </Card>
                        )}



                    </div>
                </div>
                {typeOfAccuracy==="class"||typeOfAccuracy==="recog"?(
                    <Card style={{margin:"25px"}}>
                        <p> <strong>Download  evaluated data</strong></p>
                        <div  className="text-center">
                            <button onClick={handleCapture}
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-center"
                            >Download Graphic</button>
                            {typeOfGraphic==="line" &&(
                                <button onClick={convertAndDownloadCSV}
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-center"
                                >Download CSV</button>
                            )}


                        </div>


                    </Card>
                ):(
                    <Card style={{margin:"25px"}}>
                        <p> <strong>Download  evaluated data</strong></p>
                        <div><button onClick={handleCapture}
                                     className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-center"
                        >Download Graphic</button></div>

                    </Card>
                )}
            </div>
        </>
    )
}



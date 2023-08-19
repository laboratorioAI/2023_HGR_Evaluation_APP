
import React from 'react';
import { Parser } from '@json2csv/plainjs';
import {useEffect, useState} from "react";
import {Model, ModelService} from "../services/models";
import Layout from "../components/Layout";
import {Popover, Card, OverlayTrigger, Table} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileCsv, faArrowUp as asc, faArrowDown as desc, faChartLine as PresentationChartLineIcon} from '@fortawesome/free-solid-svg-icons'


export default function () {
    const infoLabels :  {[key: string]: string} = {
        "Model" : "Name given to this hand gesture recognition model",
        "Date" : "Date",
        "Institution" : "Reported institution",
        "Classification" : "Classification accuracy: (average value of user's classification accuracies)",
        "Classification Std." : "Standard deviation of user's classification",
        "Recognition" : "Recognition accuracy: (average value of user's recognition accuracies)",
        "Recognition Std." : "Standard deviation of user's recognition",
        "Time" : "Average processing time of the all sliding windows in all the samples (real time operation is considered below 100ms)*",
        "Time Std." : "Standard deviation of the processing time",
        "Analyze" : "Analyze the results of the model",
        "Download" : "Download the results in csv file"
    }

    const [models11, setModels11] = useState<Model[]>([] as Model[]);
    const [models5, setModels5] = useState<Model[]>([] as Model[]);
    const [orderModels, setOrderModels] = useState<string>("recog" as string);
    const [orderForm, setOrderForm] = useState<string>("asc" as string);
    const getModels  = async () => {
        const models: Model[] = await ModelService.getModels();


        const modelsGestures11 = models.filter((model)=>{

            return model.model.gestures == "11";
        })
        modelsGestures11.sort((modelA, modelB) => {
            if (orderForm !== "asc") {
                return modelA.model[orderModels] - modelB.model[orderModels];
            } else {
                return modelB.model[orderModels] - modelA.model[orderModels];
            }
        });


        setModels11(modelsGestures11);

        const modelsGestures5 = models.filter((model)=>{
            return model.model.gestures == "5";
        })
        modelsGestures5.sort((modelA, modelB) => {
            if (orderForm !== "asc") {
                return modelA.model[orderModels] - modelB.model[orderModels];
            } else{
                return modelB.model[orderModels] - modelA.model[orderModels];
            }

        });
        setModels5(modelsGestures5);
    }

    const popover = (model : string) => (
        <Popover id={`popover-positioned-${model}`}>
            <Popover.Header as="h3">{model}</Popover.Header>
            <Popover.Body>
                {infoLabels[model]}
            </Popover.Body>
        </Popover>
    );
    const convertAndDownloadCSV = (date : string, modelGestures : string) => {

        const fields = [
            'user',
            'age',
            'class',
            'classStd',
            'ethnicGroup',
            'gender',
            'handedness',
            'hasSufferedArmDamage',
            'overlapF',
            'overlapFStd',
            'recog',
            'recogStd'
        ];

        const opts = { fields };

        try {
            const parser = new Parser(opts);
            let model : Model;
            if(modelGestures==="11"){
                model = models11
                    .filter((model) => model.model.date.toString() === date)[0];
            }else {
                model = models5
                    .filter((model) => model.model.date.toString() === date)[0];
            }

            const users = model
                .users.map((user) => {
                    const userMapped = {};
                    // @ts-ignore
                    userMapped["user"] = Object.keys(user)[0];
                    const userValues = Object.values(user)[0];
                    // @ts-ignore
                    return {...userMapped,...userValues};
                });
            console.log(users);

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


    useEffect(()=>{
        getModels();


    },[orderModels,orderForm])

    return(<>

        <Layout  title="Models">

            <Card style={{margin:"15px"}}>
                <Card.Title className="text-center">Model ranking for 11 gestures</Card.Title>
                <Table hover  style={{textAlign:"center"}}>
                    <thead style={{color:"gray"}}>
                        <tr>
                            <th>
                                <OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={popover("Model")}>
                                    {orderModels=="name"?(<span>Model</span>):(<span>Model</span>)}
                                </OverlayTrigger>

                            </th>
                            <th><OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={popover("Date")}>
                                <span>Date</span>
                            </OverlayTrigger></th>
                            <th><OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={popover("Institution")}>
                                <span>Institution</span>
                            </OverlayTrigger></th>
                            <th><OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={popover("Classification")}>
                                {orderModels=="class"?(<strong style={{color:"black"}}><em>Classification ± σ [%]</em></strong>):(<span>Classification ± σ [%]</span>)}
                            </OverlayTrigger>
                                <span style={{cursor:"pointer"}} onClick={()=>{
                                    setOrderModels("class")
                                }}>{orderForm=="asc"?<FontAwesomeIcon color={"gray"} icon={desc} onClick={()=>{
                                    setOrderForm("desc");
                                }}></FontAwesomeIcon>:<FontAwesomeIcon color={"gray"} icon={asc}  onClick={()=>{
                                    setOrderForm("asc");
                                }}></FontAwesomeIcon>}
                            </span>
                            </th>
                            <th><OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={popover("Recognition")}>
                                {orderModels=="recog"?(<strong style={{color:"black"}}><em>Recognition ± σ [%]</em></strong>):(<span>Recognition ± σ [%]</span>)}
                            </OverlayTrigger>
                                <span style={{cursor:"pointer"}} onClick={()=>{
                                    setOrderModels("recog")
                                }}>{orderForm=="asc"?<FontAwesomeIcon color={"gray"} icon={desc} onClick={()=>{
                                    setOrderForm("desc");
                                }}></FontAwesomeIcon>:<FontAwesomeIcon color={"gray"} icon={asc}  onClick={()=>{
                                    setOrderForm("asc");
                                }}></FontAwesomeIcon>}
                            </span>
                            </th>
                            <th><OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={popover("Time")}>
                                {orderModels=="time"?(<strong style={{color:"black"}}><em>Time ± σ [ms]</em></strong>):(<span>Time ± σ [ms]</span>)}
                            </OverlayTrigger>
                                <span style={{cursor:"pointer"}} onClick={()=>{
                                    setOrderModels("time")
                                }}>{orderForm=="asc"?<FontAwesomeIcon color={"gray"} icon={desc} onClick={()=>{
                                    setOrderForm("desc");
                                }}></FontAwesomeIcon>:<FontAwesomeIcon color={"gray"} icon={asc}  onClick={()=>{
                                    setOrderForm("asc");
                                }}></FontAwesomeIcon>}
                            </span>
                            </th>
                            <th><OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={popover("Download")}>
                                <span>Download</span>
                            </OverlayTrigger></th>
                            <th><OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={popover("Analyze")}>
                                <span>Analyze</span>
                            </OverlayTrigger></th>

                        </tr>
                    </thead>
                    <tbody>
                        {models11.map((model, index)=>(

                            <tr key={index} style={{height:"10px"}} >
                                <td >{model.model.name}</td>
                                <td >{model.model.date.toString()}</td>
                                <td >{model.model.institution}</td>
                                <td>{(model.model.class*100).toFixed(2) + " ± "+ (model.model.classStd*100).toFixed(2)}%</td>
                                <td>{(model.model.recog*100).toFixed(2) + " ± "+ (model.model.recogStd*100).toFixed(2)}%</td>
                                <td>{(model.model.time).toFixed(4) + " ± "+ (model.model.timeStd).toFixed(4)}ms</td>
                                <td ><a href="#" onClick={()=>{
                                    convertAndDownloadCSV(model.model.date.toString(),"11")
                                }}> <FontAwesomeIcon icon={faFileCsv} size={"lg"} color="gray"></FontAwesomeIcon></a></td>
                                <td><a href={`/analyze_results/${model.model.name}_${model.model.date}`}>
                                    <FontAwesomeIcon icon={PresentationChartLineIcon} color="gray" size={"lg"}></FontAwesomeIcon>
                                </a></td>

                            </tr>

                        ))}
                    </tbody>

                </Table>
            </Card>



            <Card style={{margin:"15px"}}>
                <Card.Title className="text-center">Model ranking for 5 gestures</Card.Title>
                <Table  hover  style={{textAlign:"center"}}>
                    <thead style={{color:"gray"}}>
                    <tr>
                        <th >
                            <OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={popover("Model")}>
                                {orderModels=="name"?(<span style={{color:"black"}}>Model</span>):(<span>Model</span>)}
                            </OverlayTrigger>

                        </th>
                        <th><OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={popover("Date")}>
                            <span>Date</span>
                        </OverlayTrigger></th>
                        <th><OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={popover("Institution")}>
                            <span>Institution</span>
                        </OverlayTrigger></th>
                        <th><OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={popover("Classification")}>
                            {orderModels=="class"?(<strong style={{color:"black"}}><em>Classification ± σ [%]</em></strong>):(<span>Classification ± σ [%]</span>)}
                        </OverlayTrigger>
                            <span style={{cursor:"pointer"}} onClick={()=>{
                                setOrderModels("class")
                            }}>{orderForm=="asc"?<FontAwesomeIcon color={"gray"} icon={desc} onClick={()=>{
                                setOrderForm("desc");
                            }}></FontAwesomeIcon>:<FontAwesomeIcon color={"gray"} icon={asc}  onClick={()=>{
                                setOrderForm("asc");
                            }}></FontAwesomeIcon>}
                            </span>
                        </th>
                        <th><OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={popover("Recognition")}>
                            {orderModels=="recog"?(<strong style={{color:"black"}}><em>Recognition ± σ [%]</em></strong>):(<span>Recognition ± σ [%]</span>)}
                        </OverlayTrigger>
                            <span style={{cursor:"pointer"}} onClick={()=>{
                                setOrderModels("recog")
                            }}>{orderForm=="asc"?<FontAwesomeIcon color={"gray"} icon={desc} onClick={()=>{
                                setOrderForm("desc");
                            }}></FontAwesomeIcon>:<FontAwesomeIcon color={"gray"} icon={asc}  onClick={()=>{
                                setOrderForm("asc");
                            }}></FontAwesomeIcon>}
                            </span>
                        </th>
                        <th><OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={popover("Time")}>
                            {orderModels=="time"?(<strong style={{color:"black"}}><em>Time ± σ [ms]</em></strong>):(<span>Time ± σ [ms]</span>)}
                        </OverlayTrigger>
                            <span style={{cursor:"pointer"}} onClick={()=>{
                                setOrderModels("time")
                            }}>{orderForm=="asc"?<FontAwesomeIcon color={"gray"} icon={desc} onClick={()=>{
                                setOrderForm("desc");
                            }}></FontAwesomeIcon>:<FontAwesomeIcon color={"gray"} icon={asc}  onClick={()=>{
                                setOrderForm("asc");
                            }}></FontAwesomeIcon>}
                            </span>
                        </th>
                        <th><OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={popover("Download")}>
                            <span>Download</span>
                        </OverlayTrigger></th>
                        <th><OverlayTrigger trigger={['hover', 'focus']} placement="top" overlay={popover("Analyze")}>
                            <span>Analyze</span>
                        </OverlayTrigger></th>

                    </tr>
                    </thead>
                    <tbody>
                    {models5.map((model, index)=>(

                        <tr key={index} style={{height:"10px"}} >
                            <td >{model.model.name}</td>
                            <td >{model.model.date.toString()}</td>
                            <td >{model.model.institution}</td>
                            <td>{(model.model.class*100).toFixed(2) + " ± "+ (model.model.classStd*100).toFixed(2)}%</td>
                            <td>{(model.model.recog*100).toFixed(2) + " ± "+ (model.model.recogStd*100).toFixed(2)}%</td>
                            <td>{(model.model.time).toFixed(4) + " ± "+ (model.model.timeStd).toFixed(4)}ms</td>
                            <td ><a href="#" onClick={()=>{
                                convertAndDownloadCSV(model.model.date.toString(),"5")
                            }}> <FontAwesomeIcon icon={faFileCsv} size={"lg"} color="gray"></FontAwesomeIcon></a></td>
                            <td><a href={`/analyze_results/${model.model.name}_${model.model.date}`}>
                                <FontAwesomeIcon icon={PresentationChartLineIcon} color="gray" size={"lg"}></FontAwesomeIcon>
                            </a></td>

                        </tr>

                    ))}
                    </tbody>

                </Table>
            </Card>

        </Layout>


    </>)
}
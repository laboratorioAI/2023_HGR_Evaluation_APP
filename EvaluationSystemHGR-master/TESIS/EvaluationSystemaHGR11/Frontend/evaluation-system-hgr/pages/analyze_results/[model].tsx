import Graphics from "../../components/Graphics";
import {Model, ModelService} from "../../services/models";
import {useEffect, useState} from "react";
import {useRouter} from "next/router";
import Layout from "../../components/Layout";
import {Card, Col, Row} from "react-bootstrap";
function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}
export default function () {
    const router = useRouter();
    const [model, setModel] = useState<Model>({} as Model);
    const [typeOfAccuracy, setTypeOfAccuracy] = useState("class")
    const getModel  = async () => {
        const modelName = router.query.model ? router.query.model.toString() : "s"
        const modelApi: Model = await ModelService.getModel(modelName);
        setModel(modelApi);

    }
    useEffect(()=>{
        if(router.query.model){
            getModel();
        }

    },[router.query.model])

    return(<>
        <Layout title={"Analyze results"}>
            <div style={{textAlign:"center"}}>
                {model.model&&(
                    <div>

                        <Card style={{margin:"25px"}}>
                            <Card.Title>Model Name: {model.model.name}</Card.Title>
                            <div className="container">
                                <div>

                                    <Row xs={8} md={4} className="g-sm-0" >
                                        <Col >
                                            <Card style={{padding:"0px"}}>
                                                <Card.Header><p><strong>Data</strong></p></Card.Header>
                                                <Card.Body>
                                                    <Card.Text>
                                                        <p>Institution : {model.model.institution}</p>
                                                    </Card.Text>
                                                    <Card.Text>
                                                        <p>Date : {model.model.date.toString()}</p>
                                                    </Card.Text>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                        <Col>
                                            <Card className="hover:scale-y-105" style={{padding:"0px"}}>
                                                <a href="#" onClick={(e)=>{
                                                    e.preventDefault();
                                                    setTypeOfAccuracy("class")

                                                }}>
                                                    <Card.Header style={{color:"rgba(255, 99, 132, 1)"}}
                                                                 className={classNames(typeOfAccuracy=="class"?'border-4 border-b-pink-400 text-gray-900':
                                                                     'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                                                                 )}
                                                    ><p color="fuchsia"> <strong>Classification</strong></p></Card.Header>
                                                    <Card.Body className={'cardOption'}>
                                                        <Card.Text >
                                                            <p>Mean: {(model.model.class*100).toFixed(2) +"%"}</p>
                                                        </Card.Text>
                                                        <Card.Text>
                                                            <p>Deviation Standard: {(model.model.classStd*100).toFixed(2) +"%"}</p>
                                                        </Card.Text>
                                                    </Card.Body>
                                                </a>
                                            </Card>
                                        </Col>
                                        <Col>
                                            <Card className="hover:scale-y-105" style={{padding:"0px"}}>
                                                <a href="#" onClick={(e)=>{
                                                    e.preventDefault();
                                                    setTypeOfAccuracy("recog")

                                                }}>
                                                    <Card.Header style={{color:"rgba(0, 99, 132, 1)"}}
                                                                 className={classNames(typeOfAccuracy=="recog"?'border-4 border-b-blue-900 text-gray-900':
                                                                     'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                                                                 )}
                                                    ><p color="blue"> <strong>Recognition</strong></p></Card.Header>
                                                    <Card.Body className={'cardOption'}>
                                                        <Card.Text>
                                                            <p>Mean: {(model.model.recog*100).toFixed(2) +"%"}</p>
                                                        </Card.Text>
                                                        <Card.Text>
                                                            <p>Deviation Standard: {(model.model.recogStd*100).toFixed(2) +"%"}</p>
                                                        </Card.Text>
                                                    </Card.Body>
                                                </a>
                                            </Card>
                                        </Col>
                                        <Col>
                                            <Card className="hover:scale-y-105" style={{padding:"0px"}}>
                                                <a href="#" onClick={(e)=>{
                                                    e.preventDefault();
                                                    setTypeOfAccuracy("times");


                                                }}>
                                                    <Card.Header style={{color:"rgba(0, 0, 0, 1)"}}
                                                                 className={classNames(typeOfAccuracy=="times"?'border-4 border-b-slate-950 text-gray-900':
                                                                     'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                                                                 )}
                                                    ><p><strong>Time</strong></p></Card.Header>
                                                    <Card.Body className={'cardOption'}>
                                                        <Card.Text>
                                                            <p>Mean: {(model.model.time*100).toFixed(2) +"ms"}</p>
                                                        </Card.Text>
                                                        <Card.Text>
                                                            <p>Deviation Standard: {(model.model.timeStd*100).toFixed(2) +"ms"}</p>
                                                        </Card.Text>
                                                    </Card.Body>
                                                </a>
                                            </Card>
                                        </Col>


                                    </Row>


                                </div>

                            </div>
                        </Card>
                    </div>
                )}

                    {model.model&&(
                        <div style={{placeItems:"center"}}>
                            <Graphics model={model} typeOfAccuracy={typeOfAccuracy} ></Graphics>
                        </div>
                    )}

            </div>
        </Layout>

    </>)
}
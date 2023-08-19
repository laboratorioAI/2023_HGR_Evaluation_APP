// Import the functions you need from the SDKs you need
import {initializeApp} from "firebase/app";
import {getDatabase, ref, onValue, off, set} from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDAcnVFFr8uha-_akNyYb81bfQmltP2ZpI",
    authDomain: "sistemadeevaluacionhgr.firebaseapp.com",
    databaseURL: "https://sistemadeevaluacionhgr-default-rtdb.firebaseio.com",
    projectId: "sistemadeevaluacionhgr",
    storageBucket: "sistemadeevaluacionhgr.appspot.com",
    messagingSenderId: "1027418880664",
    appId: "1:1027418880664:web:58626b794c1f25468beeed"
};


import React, {ChangeEvent, useEffect, useState} from "react";
import emailjs from 'emailjs-com';
import {DataModel, Model, ModelService} from "../services/models";
import {useForm} from "react-hook-form";
import {Col, Form, Row, Spinner, Card, Table, ProgressBar, Popover, OverlayTrigger } from "react-bootstrap";


interface ModelForm {
    modelName: string,
    name: string,
    lastName: string,
    email: string,
    institution: string,
    responseJSON: JSON,
    modelType: string,


}
const messagesEmail = {
    "sendEmail" : "Someone send an email.",
    "errorEmail" : "Someone send an incorrect JSON File.",
    "resultsEmail" : "The results of evaluation are:"
}
export default function () {

// Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const dataRef = ref(db, "/users");
    const [users, setUsers] = useState<any[]>([]);
    const [progress, setProgress] = useState(0);
    const [errorsJSON, setErrorsJSON] = useState<string|null>(null);
    const [modelType, setModelType] = useState('');
    const [buttoValid, isButtonValid] = useState(true);
    const [analizingData, setAnalizingData] = useState(false);
    const [modelEvaluated, setModelEvaluated] = useState<Model|null>(null );
    const { register, handleSubmit, formState: {errors, isValid}} = useForm({
        defaultValues: {
            modelName: "",
            name: "",
            lastName: "",
            email: "",
            institution: "",
            responseJSON: JSON,
            modelType: "",

        },
        mode: 'all'
    });

    const popover =  (
        <Popover id={`popover-positioned-1`} >
            <Popover.Header as="h5">Restrictions of response JSON</Popover.Header>
            <Popover.Body className="text-center">
                {modelType==="11"?(
                    <div>
                        <p>The input json files must comply with a certain format in order to be evaluated, in summary the main parameters are mentioned, for more information you can see in the 'Help' section</p>
                        <label><em><strong>Model Gesture 11</strong><br/></em></label><br/>
                        <label><strong>UserGroup: </strong></label> <br/><p>testing</p>
                        <label><strong>Number of users: </strong></label><br/> <p>42</p>
                        <label><strong>Valid labels: </strong></label><br/> <p>"class", "vectorOfLabels", "vectorOfTimePoints", "vectorOfProcessingTime"</p>
                        <label><strong>Number of repetitions: </strong></label><br/> <p>180</p>
                    </div>

                ):(
                    <div>
                        <p>The input json files must comply with a certain format in order to be evaluated, in summary the main parameters are mentioned, for more information you can see in the 'Help' section</p>
                        <label><em><strong>Model Gesture 5</strong><br/></em></label>
                        <label><strong>UserGroup: </strong></label> <br/><p>testing</p>
                        <label><strong>Number of users: </strong></label><br/> <p>306</p>
                        <label><strong>Valid labels : </strong></label><br/> <p>"class", "vectorOfLabels", "vectorOfTimePoints", "vectorOfProcessingTime"</p>
                        <label><strong>Number of repetitions: </strong></label><br/> <p>150</p>
                    </div>

                )}

            </Popover.Body>
        </Popover>
    );

    const handleModelTypeChange = (event: ChangeEvent<HTMLInputElement>) => {
        setModelType(event.target.value);

    };
    const sendModel = async (data: ModelForm) => {

        // @ts-ignore
        const file = data.responseJSON[0];

        setAnalizingData(true);
        isButtonValid(false);
        const reader = new FileReader();
        reader.onload = async function (event) {
            if (event.target) {
                const jsonContent = event.target.result as string;
                const jsonData = JSON.parse(jsonContent);
                const dataModel = data as DataModel;
                const now = new Date();
                const  date = now.getFullYear().toString() + "-"
                    + (now.getMonth()+1).toString().padStart(2, '0')
                    + "-" + now.getDate().toString().padStart(2, '0')
                    +":" + now.getHours().toString().padStart(2, '0')
                    + ":"+ now.getMinutes().toString().padStart(2,'0');
                const result = ModelService.validateJSON(dataModel,jsonData);
                if(result[1]){
                    await sendEmail(dataModel, messagesEmail["sendEmail"]);
                    await ModelService.evaluateModel(jsonData, dataModel,date);
                    await set(dataRef, "");
                    setUsers([]);
                    const model = await ModelService.getModel(data.modelName+"_"+date);
                    setModelEvaluated(model);
                    await sendEmail(dataModel, messagesEmail["resultsEmail"], model);
                    isButtonValid(true);
                }else{
                    setErrorsJSON(result[0]);
                    setAnalizingData(false);
                    await sendEmail(dataModel, messagesEmail["errorEmail"] +":" + "\n" + result[0]);
                    isButtonValid(true);
                }

            }
        };
        reader.readAsText(file);
    }

    useEffect(() => {

        onValue(dataRef, (snapshot) => {
            setAnalizingData(false)
            setProgress(prevState => prevState+1);
            snapshot.forEach((mensajeSnapshot) => {
                const mensaje = mensajeSnapshot.val();
                setUsers([mensaje]);

            });


        });

        // Detiene la escucha de cambios en la base de datos cuando se desmonta el componente
        return () => {
            off(dataRef);

        };
    }, [])


    // @ts-ignore
    const handleFileChange= (event)=> {
        if(event.target.files[0]){
            setErrorsJSON(null);
        }
    }

    const sendEmail = async (dataModel: DataModel, messages : string , model? : Model) => {
        let templateParams;
        try {
            if(model){
                templateParams = {
                    to_email: model.model.email,
                    from_name: dataModel.name + " " + dataModel.lastName,
                    message: messages + "\n" + JSON.stringify(model.model).replace(/,/g, "\n"),
                };
            }else{
                templateParams = {
                    to_email: dataModel.email,
                    from_name: dataModel.name + " " + dataModel.lastName,
                    message: messages,
                };
            }


            const response = await emailjs.send(
                'service_l8mv9xt',
                'template_zb1ul9l',
                templateParams,
                "0Z_8cgqE9dcp6QHMF"
            );

            console.log('Correo electrónico enviado correctamente', response);
        } catch (error) {
            console.error('Error al enviar el correo electrónico:', error);
        }

    };

    return (<>

        <div style={{padding:"25px"}}>
            <Row >
                <Col md={4}>

                    <Card>
                        <Card.Title >Submit your model</Card.Title>
                        <Form onSubmit={handleSubmit(sendModel)}>
                            <div >
                                <div><label htmlFor="modelType" className="form-label"><strong>Gestures</strong></label></div>
                                <div style={{ display: 'flex', textAlign:"center" }}>
                                    <div style={{ marginRight: '10px' }}>
                                        <label htmlFor="modelType5" className="form-label">11</label>
                                        <input
                                            type="radio"
                                            className="form-check-input"
                                            value="11"
                                            id="modelType5"
                                            {...register("modelType", { required: "Required model" })}
                                            aria-describedby="modelType"
                                            checked={modelType === "11"}
                                            onChange={handleModelTypeChange}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="modelType11" className="form-label">5</label>
                                        <input
                                            type="radio"
                                            className="form-check-input"
                                            value="5"
                                            id="modelType11"
                                            {...register("modelType", { required: "Required model" })}
                                            aria-describedby="modelType"
                                            checked={modelType === "5"}
                                            onChange={handleModelTypeChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="modelName" className="form-label"><strong>Model Name</strong></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="E.g: ModelHGR"
                                    id="modelName"
                                    {...register("modelName", { required: "Required model name" })}
                                    aria-describedby="modelNameHelp"
                                />
                                {errors.modelName &&
                                    <div className="alert alert-warning" role="alert">
                                        Error: {errors.modelName.message}
                                    </div>
                                }

                            </div>
                            <div>
                                <label htmlFor="name" className="form-label"><strong>Name</strong></label>
                                <input type="text"
                                           className="form-control"
                                           placeholder="E.g: Jonathan"
                                           id="name"
                                           {...register("name", {required: "Required name"})}
                                           aria-describedby="nameHelp"

                                />
                                {errors.name &&
                                    <div className="alert alert-warning" role="alert">
                                        Error: {errors.name.message}
                                    </div>
                                }
                            </div>
                            <div>
                                <label htmlFor="lastName" className="form-label"><strong>Lastname</strong></label>
                                <input type="text"
                                           className="form-control"
                                           placeholder="E.g: Kennedy"
                                           id="lastName"
                                           {...register("lastName", {required: "Required last name"})}
                                           aria-describedby="lastNameHelp"

                                />
                                {errors.lastName &&
                                    <div className="alert alert-warning" role="alert">
                                        Error: {errors.lastName.message}
                                    </div>
                                }
                            </div>
                            <div>
                                <label htmlFor="email" className="form-label"><strong>Email</strong></label>
                                <input type="email"
                                           className="form-control"
                                           placeholder="E.g: kevin.ramos01@epn.edu.ec"
                                           id="email"
                                           {...register("email", {required: "Required email",
                                               pattern: {
                                                   value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                   message: "Invalid email address"
                                               }})}
                                           aria-describedby="emailHelp"

                                />
                                {errors.email &&
                                    <div className="alert alert-warning" role="alert">
                                        Error: {errors.email.message}
                                    </div>
                                }
                            </div>
                            <div>
                                <label htmlFor="institution" className="form-label"><strong>Institution</strong></label>
                                <input type="text"
                                           className="form-control"
                                           placeholder="E.g: EPN"
                                           id="institution"
                                           {...register("institution", {required: "Required institution"})}
                                           aria-describedby="institutionHelp"

                                />
                                {errors.institution &&
                                    <div className="alert alert-warning" role="alert">
                                        Error: {errors.institution.message}
                                    </div>
                                }
                            </div>
                            <div>
                                <label htmlFor="responseJSON" className="form-label"><strong>Response JSON</strong></label>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="file"
                                        accept=".json"
                                        className="form-control"
                                        id="responseJSON"
                                        {...register("responseJSON", {required: "Required responseJSON"})}
                                        aria-describedby="responseJSONHelp"
                                        onChange={handleFileChange}
                                    />
                                    <OverlayTrigger trigger={["hover","focus"]} placement="right" overlay={popover}>
                                        <img
                                            alt=""
                                            src="/informationJSON.svg"
                                            width="25px"
                                            className="d-inline-block align-top"
                                            style={{padding:"0px 3px"}}
                                        />
                                    </OverlayTrigger>

                                </div>

                                {errors.responseJSON &&
                                    <div className="alert alert-warning" role="alert">
                                        Error: {errors.responseJSON.message}
                                    </div>
                                }
                                {errorsJSON!=null &&
                                    <div className="alert alert-warning" role="alert">
                                        Error: {errorsJSON}
                                    </div>
                                }
                            </div>

                            <div style={{padding: "5px", textAlign:"center"}}>
                                {buttoValid ?(
                                    <button
                                        type="submit"
                                        disabled={(!isValid) }
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        Submit
                                    </button>
                                ):(
                                    <div></div>
                                )}


                                <button
                                    type="reset"
                                    className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold py-2 px-4 rounded"
                                >
                                    Clear
                                </button>
                            </div>

                        </Form>
                    </Card>

                </Col>
                <Col md={8}>

                    <Card>
                        <Card.Title>Results</Card.Title>
                        <Table style={{textAlign:"center"}}>
                            <thead style={{color:"gray"}}>
                                <tr key="labels">
                                    <th>Model</th>
                                    <th>Date</th>
                                    <th>Institution</th>
                                    <th>Classification</th>
                                    <th>Recognition</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modelEvaluated?(
                                    <tr >
                                        <td>{modelEvaluated.model.name}</td>
                                        <td>{modelEvaluated.model.date.toString()}</td>
                                        <td>{modelEvaluated.model.institution}</td>
                                        <td>{(modelEvaluated.model.class*100).toFixed(2)}%</td>
                                        <td>{(modelEvaluated.model.recog*100).toFixed(2)}%</td>
                                        <td>{(modelEvaluated.model.time).toFixed(4)}ms</td>

                                    </tr>
                                ):(
                                    <tr style={{textAlign:"center"}}>
                                        <td>---</td>
                                        <td>---</td>
                                        <td>---</td>
                                        <td>---</td>
                                        <td>---</td>
                                        <td>---</td>

                                    </tr>
                                )}
                            </tbody>
                        </Table>
                        {
                            modelEvaluated ?(
                                <div style={{textAlign:"center"}}>

                                    <button
                                        type="button"
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                    >
                                        <a href={`/analyze_results/${modelEvaluated.model.name}_${modelEvaluated.model.date}`} style={{textDecoration:"none"}}>View Details</a>
                                    </button>
                                </div>
                            ):(<h1></h1>)
                        }
                    </Card>
                    <br/>
                    <Card>
                        {analizingData ? (
                            <div style={{textAlign:"center"}}>
                                <p><strong>Loading JSON file...</strong> </p>
                                <Spinner animation="border"  as="div" />
                            </div>

                        ):(<div>
                                <h1></h1>
                            </div>
                        )}

                        <div style={{textAlign:"center"}}>

                            {users.length === 1 && (
                                <div>
                                    {modelType === "11" ? (
                                        <div>
                                            <Card className="max-w-sm mx-auto">
                                                <Card.Subtitle>
                                                    <p>Progress of evaluation</p>
                                                </Card.Subtitle>
                                                <ProgressBar animated now={(progress * 100 / 42)}  label={`${(progress * 100 / 42).toFixed(2)}%`}/>
                                            </Card>
                                            <p>Analyzing user: {users[0]}</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <Card className="max-w-sm mx-auto">
                                                <Card.Subtitle>
                                                    Progress of evaluation
                                                </Card.Subtitle>
                                                <ProgressBar animated now={(progress * 100 / 306)}  label={`${(progress * 100 / 306).toFixed()}%`}/>
                                            </Card>
                                            <p>Analyzing user:  {users[0]}</p>
                                        </div>
                                    )}
                                </div>
                            )}


                        </div>
                    </Card>

                </Col>
            </Row>

        </div>

    </>)
}
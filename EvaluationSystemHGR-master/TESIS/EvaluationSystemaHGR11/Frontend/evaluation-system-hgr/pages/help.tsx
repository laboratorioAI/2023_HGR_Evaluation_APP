import Layout from "../components/Layout";
import {Card, ListGroup} from "react-bootstrap";

export default function () {
    const handleDownload = (typeOfGesture : string) => {
        const fileUrl = `${typeOfGesture}.json`; // Ruta al archivo en el servidor
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = `${typeOfGesture}.json`; // Nombre del archivo que se descargará
        link.click();
    };
    return(
        <>
        <Layout>
            <Card style={{margin:"25px"}}>
                <Card.Title className="text-center"> Help</Card.Title>
                <p><strong>JSON structure of the input file for 5 and 11 gestures</strong></p>
                <p>The JSON file contains information necessary for the evaluation of the results of the hand gesture recognition models. There are going to be two very similar formats for models with 5 and 11 gestures respectively. This file must follow the structure specified in this document, otherwise the evaluation will not be possible.</p><br/>
                <p><strong>Structure 5 gestures:</strong> </p>
                <p>Considerations:</p>
                <ListGroup>
                    <ListGroup.Item><p>Valid tags are: ['waveIn', 'waveOut', 'fist', 'open', 'pinch', 'noGesture'].</p></ListGroup.Item>
                    <ListGroup.Item><p>This structure has the tag “noGesture” as the gesture when it is relaxed or not gesturing.</p></ListGroup.Item>
                    <ListGroup.Item><p>Number of users: 306.</p></ListGroup.Item>
                    <ListGroup.Item><p>Number of repetitions per user: 150.</p></ListGroup.Item>
                </ListGroup>
                <br/>
                <p><strong>Structure 11 gestures:</strong> </p>
                <p>Considerations:</p>
                <ListGroup>
                    <ListGroup.Item><p>Valid tags are: ['waveIn', 'waveOut', 'fist', 'open', 'pinch','up','down','left','right','forward','backward', 'relax'].</p></ListGroup.Item>
                    <ListGroup.Item><p>This structure is labeled "relax" as the gesture when it is relaxing or not gesturing.</p></ListGroup.Item>
                    <ListGroup.Item><p>Number of users: 42.</p></ListGroup.Item>
                    <ListGroup.Item><p>Number of repetitions per user: 180.</p></ListGroup.Item>
                </ListGroup>
                <br/>


                <p><strong>Examples of response JSON file: </strong></p>
                <p><strong>JSON File 11 gestures: </strong></p>
                <div>
                    <button onClick={()=>{
                        handleDownload('example11');
                    }} type="button" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    > Download</button>
                </div>
                <p><strong>JSON File 5 gestures: </strong></p>
                <div>
                    <button onClick={()=>{
                        handleDownload('example5');
                    }} type="button" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    > Download</button>
                </div>
            </Card>
        </Layout>
        </>
    )
}
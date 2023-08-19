
export interface Model {
    model: {
        date: Date,
        institution: string,
        name: string
        class : number,
        classStd : number,
        recog: number,
        recogStd : number,
        time : number,
        timeStd :number,
        gestures: string,
        [key: string]: any; // Agregar firma de índice
    },
    users : [],
    graphs : {
        confusion : {
            classes: [],
            confusion: [],
        },
        histogram : {
            class: [],
            recog: [],
            [key: string]: any; // Agregar firma de índice
        },
        scatter : {
            class: [],
            recog: [],
            [key: string]: any; // Agregar firma de índice
        },
        times: [],
    }
}

export interface User {
    class: number,
    classStd: number,
    recog: number,
    recogStd: number,
    age: number,
    ethnicGroup: string,
    gender: string,
    handedness: string,
    hasSufferedArmDamage: boolean,
    overlapF: number,
    overlapFStd: number,
}


export interface DataModel {
    modelName: string,
    name: string,
    lastName: string,
    institution: string,
    email: string,
    modelType: string,


}
const url = "http://127.0.0.1:8000/evaluationSystemHGR/";
export class ModelService{

        static  async getModels(): Promise<Model[]> {
            try {
                const response = await fetch(url + "getModels");
                return await response.json() as Model[];
            } catch (error) {
                console.error("Error fetching models:", error);
                return [];
            }
        }

    static  async getModel(modelName:string): Promise<Model> {
        const response = await fetch(url+"getModel/"+modelName);
        return (await response.json()) as Model;
    }

    static async evaluateModel(modelJSON: JSON, dataModel: DataModel, date: string){
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body : JSON.stringify({
                modelJSON : modelJSON,
                dataModel : dataModel,
                date: date,
            }),
        };


        await fetch(url + "evaluateModel", options)
            .then(response => {
                console.log(response);
            })
            .catch(error => {
                console.log(error);
            });
    }
    static  validateJSON(dataModel:DataModel,modelJSON: JSON) : [string,boolean]{
        const keys = Object.keys(modelJSON);
        if(keys[0] !="testing"){
            return ["The userGroup has to be 'testing'", false];
        }else{
            if (dataModel["modelType"] =="11"){
                if(Object.values((modelJSON as any)["testing"]).length != 42){

                    return ["The number of users is not  42",false];
                }else{
                    const expectedValues = ["class", "vectorOfLabels", "vectorOfTimePoints", "vectorOfProcessingTime"];
                    const values = Object.keys((modelJSON as any)["testing"]["user_001"]);

                    const areAllIncluded = expectedValues.every((expectedValue) => values.includes(expectedValue));
                    if(!areAllIncluded){

                        return ["Each user doesn't have all attributes :  \"class\",\"vectorOfLabels\",\"vectorOfTimePoints\",\"vectorOfProcessingTime\"",false];
                    }else{
                        if(!(Object.keys((modelJSON as any)["testing"]["user_001"]["class"]).length==180)){
                            return ["The number of repetitions is not 180",false];

                        }
                    }
                }
            }else{
                if(Object.values((modelJSON as any)["testing"]).length != 306){
                    return ["The number of users is not  306",false];
                }else{
                    const expectedValues = ["class", "vectorOfLabels", "vectorOfTimePoints", "vectorOfProcessingTime"];
                    const values = Object.keys((modelJSON as any)["testing"]["user1"]);

                    const areAllIncluded = expectedValues.every((expectedValue) => values.includes(expectedValue));
                    if(!areAllIncluded){

                        return ["Each user doesn't have all attributes :  \"class\",\"vectorOfLabels\",\"vectorOfTimePoints\",\"vectorOfProcessingTime\"",false];
                    }else{
                        if(!(Object.keys((modelJSON as any)["testing"]["user1"]["class"]).length==150)){
                            return ["The number of repetitions is not 150",false];

                        }
                    }
                }
            }
            return ["",true];
        }

    }


}
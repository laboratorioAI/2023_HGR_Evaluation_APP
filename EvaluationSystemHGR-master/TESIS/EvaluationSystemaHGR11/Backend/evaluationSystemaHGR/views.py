from datetime import datetime

from rest_framework.response import Response
from rest_framework.views import APIView
import firebase_admin
from firebase_admin import credentials, db
from evaluationSystemaHGR.models import Evaluator, Evaluated, ModelManager
import os

path = os.getcwd()
path = path.replace("\\", "/")

# Firebase

cred = credentials.Certificate(path + "/credentials/credentials.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': "https://sistemadeevaluacionhgr-default-rtdb.firebaseio.com"
})

optionsModel = {
    "userGroup": 'testing',
    "repGroup": 'testing',
    "save": False,
    "genPersonalStats": True,
    "threshold_recognition": 0.25,
    "default_gesture": "relax",
}


class GetModels(APIView):
    def get(self, request):
        ref = db.reference('/modelsEvaluated')
        modelsFirebase = ref.get()
        models = list(modelsFirebase["models11"].values()) + list(modelsFirebase["models5"].values())
        return Response(models)


class GetModel(APIView):
    def get(self, request, nameModel):

        if db.reference('/modelsEvaluated/models11/' + nameModel).get() is not None:
            ref = db.reference('/modelsEvaluated/models11/' + nameModel)
            modelFirebase = ref.get()
        else:

            ref = db.reference('/modelsEvaluated/models5/' + nameModel)
            modelFirebase = ref.get()
        return Response(modelFirebase)


class EvaluateModel(APIView):
    def __init__(self, **kwargs):
        # Name of the folder where the figs will be generated.
        super().__init__(**kwargs)

    def post(self, request):
        # Obtener los datos de la solicitud
        response = request.data["modelJSON"]
        dataModel = request.data["dataModel"]
        date = request.data["date"]
        model = ModelManager(optionsModel,dataModel["modelType"],response).createModel()
        evaluated = Evaluated(model,dataModel)
        if dataModel["modelType"] == "11":
            # Procesar los datos y realizar las operaciones necesarias
            evaluador = Evaluator(evaluated.getModel().sentJSONModel(), evaluated.getModel().sentOptionsModel(),
                                  dataModel["modelName"], dataModel["modelType"])
        else:
            evaluador = Evaluator(evaluated.getModel().sentJSONModel(), evaluated.getModel().sentOptionsModel(),
                                  dataModel["modelName"], dataModel["modelType"])
        results, class_, classStd, recog, recogStd, times, timeAvg, timeStd, confusion, classes = evaluador.eval_HGR_set()

        # Draw graphs
        graphs = evaluador.graphResults(results, times, timeAvg, timeStd)
        graphs["confusion"] = {
            "classes": classes,
            "confusion": confusion,
        }
        # # Escribir los resultados en Firebase Realtime Database
        modelEvaluate = {
            dataModel["modelName"] + "_" + date: {
                "model": {
                    "name": dataModel["modelName"],
                    "institution": dataModel["institution"],
                    "email": dataModel["email"],
                    "date": date,
                    "class": class_,
                    "classStd": classStd,
                    "recog": recog,
                    "recogStd": recogStd,
                    "time": timeAvg,
                    "timeStd": timeStd,
                    "gestures": dataModel["modelType"]
                },
                'users': results,
                'graphs': graphs
            }
        }
        if modelEvaluate[dataModel["modelName"] + "_" + date]["model"]["gestures"] == "11":
            ref = db.reference('/modelsEvaluated/models11')
            modelos = ref.get()
            if modelos is None:
                ref.set(modelEvaluate)
            else:
                modelos.update(modelEvaluate)
                ref.set(modelos)
        else:
            ref = db.reference('/modelsEvaluated/models5')
            modelos = ref.get()
            if modelos is None:
                ref.set(modelEvaluate)
            else:
                modelos.update(modelEvaluate)
                ref.set(modelos)

        return Response(modelEvaluate)

import json

import numpy as np

from evaluationSystemaHGR.models import Evaluator
#
with open('C:/Users/59399/Desktop/Poli/7mo/VyV/SistemaDeEvaluacionHGRBackend/polls/archivoMin.json',
          'r') as f:
    data = json.load(f)

optionsModel = {
        "publicFolder" : './resultsHGR/',
        "evalResultsFolder" : './resultsHGR/',
        "userGroup" : 'training',
        "repGroup" : 'testing',
        "generateFigs" : True,
        "save" : True,
        "genPersonalStats" : True,
        "threshold_recognition" : 0.25,
        "default_gesture" : "noGesture",
        "privFile" : 'repData_training',
        "userInfoFile" : 'personalInfo_training',
        "inputFolder" : '',
    }


evaluador = Evaluator(data=data,options=optionsModel )
print(evaluador.eval_HGR_set())


import json
import math
import os
import re
from abc import ABC, abstractmethod
from datetime import datetime
from prettytable import PrettyTable
import numpy as np
from firebase_admin import credentials, db


# Create your models here.
class Evaluator:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, data, options, dataUser, typeModel):
        if not hasattr(self, 'initialized'):
            # Solo realiza la inicialización si la instancia aún no ha sido inicializada.
            self.userGroup = options["userGroup"]
            self.repGroup = options["repGroup"]
            self.save = options["save"]
            self.genPersonalStats = options["genPersonalStats"]
            self.data = data
            self.threshold_recognition = options["threshold_recognition"]
            self.default_gesture = options["default_gesture"]
            self.dataUser = dataUser
            self.typeModel = typeModel
            self.initialized = True

    def evalRecognition(self, rep_info, response):
        rep_info = rep_info
        response = response
        true_class = rep_info['gestureName']
        predictions_vector = response['vectorOfLabels']
        response_point_vector = response['vectorOfTimePoints']
        class_prediction = response['class']
        # CLASIFICACION
        class_result = class_prediction == true_class
        ###
        # BLOCK REPRESENTATION
        numPredictionsVector = len(predictions_vector)

        if numPredictionsVector < 1:
            print("Error in blockRepresentation. Not valid size of predictions!")
            return
        freqClass = [1]
        blockClassesPredicted = [predictions_vector[0]]
        for kPrediction in predictions_vector[1:len(predictions_vector) - 1]:
            if kPrediction == blockClassesPredicted[-1]:
                freqClass[-1] += 1
            else:
                freqClass.append(1)
                blockClassesPredicted.append(kPrediction)
        # BLOCK REPRESENTATION

        # Response validity, based on the block representation
        n_block_classes_predicted = len(blockClassesPredicted)
        isPredictionVectorValid = False
        classEquivalent = []
        if n_block_classes_predicted == 1:
            # Case 1 (all predictions correspond to one class)
            classEquivalent = blockClassesPredicted[0]
            isPredictionVectorValid = True

        elif n_block_classes_predicted == 2:
            # 2 elements in the block representation
            classesPred = [x for x in blockClassesPredicted if x != self.default_gesture]
            n_classes_pred = len(classesPred)

            if n_classes_pred == 1:
                # one of the 2 predictions is noGesture, other is class.
                classEquivalent = classesPred[0]
                isPredictionVectorValid = True

            else:
                # two no noGesture classes, invalid
                isPredictionVectorValid = False

        elif n_block_classes_predicted == 3:
            # 3 elements in the block representation
            if blockClassesPredicted[0] == self.default_gesture and blockClassesPredicted[2] == self.default_gesture:
                # gesture in the middle with relaxes at the sides
                classEquivalent = blockClassesPredicted[1]
                isPredictionVectorValid = True

            else:
                isPredictionVectorValid = False

        else:
            # more elements in the block representation!
            # Case 7. a lot of stuff, really, really wrong
            isPredictionVectorValid = False

        # Response validity, based on the block representation

        # getEquivalentPredictionVector
        ground_truth = rep_info['groundTruth']

        if isPredictionVectorValid and (classEquivalent == true_class):

            tamGT = len(ground_truth)

            equivalentVector = [self.default_gesture] * tamGT
            kPrediction = 0
            responsePointVector = response_point_vector
            for kGT in range(0, tamGT - 1):
                # point alignment
                if kGT > responsePointVector[kPrediction]:
                    # saturate! GT larger than predictions.
                    if kPrediction < numPredictionsVector - 1:
                        kPrediction += 1
                equivalentVector[kGT] = predictions_vector[kPrediction]

            # getEquivalentPredictionVector

            # calculateOverlappingFactor

            ground_truth = np.array(ground_truth, dtype=bool)
            lengthCorrectGT = np.sum(ground_truth)
            equivalentVector = np.array(equivalentVector)
            lengthResp = np.sum(equivalentVector == true_class)
            equivalentVector = np.array(equivalentVector)
            equivalentVectorTrueClass = equivalentVector == true_class
            # Añadimos uno por la indexacion empieza en 0
            intersectionArea = np.sum(ground_truth & equivalentVectorTrueClass) + 1
            overlapping_factor = (2 * intersectionArea) / (lengthCorrectGT + lengthResp)

            # calculateOverlappingFactor

            recog_result = overlapping_factor >= self.threshold_recognition
            overlapping_factor = overlapping_factor
            equivalentVector = equivalentVectorTrueClass
        else:
            overlapping_factor = np.nan
            recog_result = False

        return class_result, recog_result, overlapping_factor

    def evalRecognition_loop(self, responses, privInfo):
        usersTestList = list(responses[self.repGroup].keys())
        results = {}
        confusion = {}
        times = {}

        for kUser in usersTestList:
            print('{}:\tAnalyzing {}'.format(datetime.now().strftime("%Y-%m-%d %H:%M:%S"), kUser))
            ref = db.reference("/users")
            ref.push(kUser)
            userRepInfo = privInfo["hiddenInfo"][self.userGroup][kUser]['repInfo'][self.repGroup]
            numReps = len(responses[self.repGroup][kUser]['class'])

            results[kUser] = {}
            confusion[kUser] = [[] for _ in range(numReps)]
            times[kUser] = np.concatenate(list(responses[self.repGroup][kUser]['vectorOfProcessingTime'].values()))

            for kRep in range(0, numReps):
                name = "idx_" + str(kRep)
                resp = {'class': responses[self.repGroup][kUser]['class'][name]}

                if not resp['class']:
                    continue
                resp['vectorOfLabels'] = responses[self.repGroup][kUser]['vectorOfLabels'][name]
                resp['vectorOfTimePoints'] = responses[self.repGroup][kUser]['vectorOfTimePoints'][name]
                resp['vectorOfProcessingTimes'] = responses[self.repGroup][kUser]['vectorOfProcessingTime'][name]
                repInfo = {'gestureName': userRepInfo[kRep + numReps],
                           'groundTruth': userRepInfo[kRep + (numReps * 3)]}

                repEval = self.evalRecognition(repInfo, resp)

                results[kUser][kRep] = [repEval[0], repEval[1], repEval[2]]
                confusion[kUser][kRep] = [repInfo['gestureName'], resp['class']]
        times = times.values()

        return results, confusion, times

    def export_summary(self, table, field_name, class_avg, class_std, recog_avg, recog_std, time_avg, time_std):
        # Export_summary añade en el archivo "summary" el resumen de la stats_table dada.
        # Imprime en consola y guarda en archivo text.
        # ¡Sí field_name está vacío, saca resultados generales!

        # Inputs:
        # stats_table  (n, 8) table: n clases, name, cuenta, mean, class, recog
        # Outputs:
        path = os.getcwd()
        path = path.replace("\\", "/")
        if self.save:

            output_file = f"{path}/resultsHGR/{self.dataUser}/summary.txt"
            with open(output_file, "w") as fid:
                print("Laboratorio de Inteligencia y Visión Artificial", file=fid)
                print("Escuela Politécnica Nacional", file=fid)
                print("Quito-Ecuador", file=fid)
                print("\n", file=fid)
                print("by Jonathan A. Zea", file=fid)
                print("\n", file=fid)
                print("===========================================", file=fid)
                print(f"MAIN RESULTS: {self.dataUser}", file=fid)
                print("===========================================", file=fid)
                print(f"{datetime.now()}\n", file=fid)
                print(
                    f"classification Accuracy: {class_avg:.2f}% \xB1 {class_std:.2f}%\t\trecognition Accuracy: "
                    f"{recog_avg:.2f}% \xB1 {recog_std:.2f}%",
                    file=fid)
                print(f"time: {time_avg:.6g} \xB1 {time_std:.6g} [s]\n\n\n", file=fid)

                # Resultados específicos
                if field_name is None:
                    # Resultados generales
                    fid.close()
                else:
                    if self.save:
                        print("============================", file=fid)
                        print(f"Results: {field_name}", file=fid)
                        print("============================", file=fid)
                        print(table, file=fid)
                        fid.close()

    def confusion2latex(self, outputFile, mat, totalCols, porcentCols, totalRows, porcentRows, total, percentTotal):
        cols = np.concatenate((totalCols, porcentCols)).reshape(-1, 1)
        cols = cols.flatten('F')
        total = np.array(total)

        with open(outputFile, 'w') as f:
            f.write('%% add this packages at the top of the latex doc.\n')
            f.write('%%\\usepackage{adjustbox}\n')
            f.write('%%\\usepackage{graphicx}\n')
            f.write('%%\\usepackage{multirow}\n')
            f.write('%%\\usepackage[table,xcdraw]{xcolor}\n')
            f.write('\n')
            f.write('\n')
            f.write('\\begin{table*}[htbp] %% recommended when the paper has 2 columns.\n')
            f.write('%% \\begin{table}[htbp] %% (Recommended to uncomment when the paper has 1 column.)\n')
            f.write('\n')
            f.write('\\caption{Confusion Matrix of the Proposed Models} \\label{tab:confMat}\n')
            f.write('\\centering\n')
            f.write(
                '%%\\begin{adjustbox}{scale = 0.625} %% caso IEEE. Solo en ambiente table! Se puede añadir (",'
                'center")\n')
            f.write('%%\\small\n')
            f.write('\\begin{tabular}{c|cccccc|c}\n')
            f.write('\\hline\n')
            f.write(
                '\t& \\multicolumn{6}{c|}{}                             \t&               \\\\\n')
            f.write(
                '\\multirow{-2}{*}{}                \t& \\multicolumn{6}{c|}{\\multirow{-2}{*}{Targets}}   \t&        '
                '       \\\\\\cline{2-7}\n')
            f.write(
                '\t& waveIn                                             \t& waveOut       \t& fist         \t& open   '
                '        \t& pinch         \t& noGesture      \t& \\multirow{-3}{*}{\\textbf{\\begin{tabular}[c]{@{'
                '}c@{}}Predictions Count\\\\ (Precision)\\end{tabular}}}   \\\\ \\hline\n')
            # Primera fila
            f.write(
                '\\multicolumn{1}{c|}{waveIn}\t& \\textbf{%d}\t& %d\t& %d\t& %d\t& %d\t& %d\t& \\textbf{\\begin{'
                'tabular}[c]{@{}c@{}}%d\\\\ %.4g\\%%\\end{tabular}} \\\\\\hline\n' % tuple(
                    [mat[0][i] for i in range(len(mat[0]))] + [totalRows[0], porcentRows[0]]))

            # Segunda fila
            f.write(
                '\\multicolumn{1}{c|}{waveOut}\t& %d\t& \\textbf{%d}\t& %d\t& %d\t& %d\t& %d\t& \\textbf{\\begin{'
                'tabular}[c]{@{}c@{}}%d\\\\ %.4g\\%%\\end{tabular}} \\\\\\hline\n' % tuple(
                    [mat[1][i] for i in range(len(mat[1]))] + [totalRows[1], porcentRows[1]]))

            # Tercera fila
            f.write(
                '\\multicolumn{1}{c|}{fist}\t& %d\t& %d\t& \\textbf{%d}\t& %d\t& %d\t& %d\t& \\textbf{\\begin{'
                'tabular}[c]{@{}c@{}}%d\\\\ %.4g\\%%\\\\\\end{tabular}} \\\\\\hline\n' % tuple(
                    [mat[2][i] for i in range(len(mat[2]))] + [totalRows[2], porcentRows[2]]))

            # Cuarta fila
            f.write(
                '\\multicolumn{1}{c|}{open}\t& %d\t& %d\t& %d\t& \\textbf{%d}\t& %d\t& %d\t& \\textbf{\\begin{'
                'tabular}[c]{@{}c@{}}%d\\\\ %.4g\\%%\\\\\\end{tabular}} \\\\\\hline\n' % tuple(
                    [mat[3][i] for i in range(len(mat[3]))] + [totalRows[3], porcentRows[3]]))

            # Quinta fila
            f.write(
                '\\multicolumn{1}{c|}{pinch}\t& %d\t& %d\t& %d\t& %d\t& \\textbf{%d}\t& %d\t& \\textbf{\\begin{'
                'tabular}[c]{@{}c@{}}%d\\\\ %.4g\\%% \\\\\\end{tabular}} \\\\ \\hline\n' % tuple(
                    [mat[4][i] for i in range(len(mat[4]))] + [totalRows[4], porcentRows[4]]))

            # Sexta fila
            f.write(
                '\\multicolumn{1}{c|}{noGesture}\t& %d\t& %d\t& %d\t& %d\t& %d\t& \\textbf{%d}\t& \\textbf{\\begin{'
                'tabular}[c]{@{}c@{}}%d\\\\ %.4g\\%%\\end{tabular}} \\\\ \\hline\\hline\n '
                % tuple([mat[5][i] for i in range(len(mat[5]))] + [totalRows[5], porcentRows[5]]))

            totals = []
            for col, totalCol in zip(totalCols, porcentCols):
                totals.append(col)
                totals.append(totalCol)

            f.write(
                '\\textbf{\\begin{tabular}[c]{@{}c@{}}Targets Count\\\\ (Sensitivity)\\end{tabular}} \t& '
                '\\textbf{\\begin{tabular}[c]{@{}c@{}}%d\\\\ %.4g\\%%\\end{tabular}} \t& '
                '\\textbf{\\begin{tabular}[c]{@{}c@{}}%d\\\\ %.4g\\%%\\end{tabular}} \t& '
                '\\textbf{\\begin{tabular}[c]{@{}c@{}}%d\\\\ %.4g\\%%\\end{tabular}} \t& '
                '\\textbf{\\begin{tabular}[c]{@{}c@{}}%d\\\\ %.4g\\%%\\end{tabular}} \t& '
                '\\textbf{\\begin{tabular}[c]{@{}c@{}}%d\\\\ %.4g\\%%\\end{tabular}} \t& '
                '\\textbf{\\begin{tabular}[c]{@{}c@{}}%d\\\\ %.4g\\%%\\end{tabular}} \t& '
                '{\\textbf{\\begin{tabular}[c]{@{}c@{}}%d\\\\ %.4g\\%%\\end{tabular}}} \\\\ \\hline\n'
                % tuple(totals + [total, percentTotal])
            )

            f.write('\\end{tabular}\n')
            f.write('%%\\end{adjustbox}\n')
            f.write('%%\\end{table}\n')
            f.write('\\end{table*}\n')

            f.close()

    def export_confusion_emg(self, targets, outputs):
        """
        export_confusion_emg exports the confusion matrix to latex format.

        Inputs
        ----------
        targets : ndarray of shape (m, 1)
            Categorical of true classes.
        outputs : ndarray of shape (m, 1)
            Categorical of predicted classes.
        options : dict
            Struct with options: output_folder.

        Outputs
        -------
        mat : ndarray of shape (6, 6)
            Confusion matrix.

        """
        classes = ['waveIn', 'waveOut', 'fist', 'open', 'pinch', 'noGesture']
        if self.typeModel == "11":
            classes = ['waveIn', 'waveOut', 'fist', 'open', 'pinch', 'up', 'down', 'left', 'right', 'forward',
                       'backward', 'relax']

        mat = np.zeros((len(classes), len(classes)))
        for idxOutput in range(len(classes)):
            kOutput = classes[idxOutput]

            predsG = outputs == kOutput

            for idxTarget in range(len(classes)):
                kTarget = classes[idxTarget]

                truesG = targets == kTarget

                mat[idxOutput, idxTarget] = np.sum(predsG & truesG)
        # Metrics
        # Sensitivity
        totalCols = np.sum(mat, axis=0)
        porcentCols = np.diag(mat) / totalCols * 100

        # Precision
        totalRows = np.sum(mat, axis=1)
        porcentRows = np.diag(mat) / totalRows * 100

        total = np.sum(mat)
        percentTotal = np.sum(np.diag(mat)) / total * 100

        totalCols = np.append(totalCols, total)
        porcentCols = np.append(porcentCols, percentTotal)
        mat = np.column_stack((mat, porcentRows))
        mat = np.row_stack((mat, totalCols))
        mat = np.row_stack((mat, porcentCols))
        mat = mat.tolist()
        # PATH
        path = os.getcwd()
        path = path.replace("\\", "/")
        # Send Latex

        # output_file = f"{path}/resultsHGR/{self.dataUser}/confusion.tex"
        # self.confusion2latex(output_file, mat, totalCols, porcentCols, totalRows, porcentRows, total, percentTotal)

        return mat, classes

    def analyseResults(self, evaluationXUser, confusionXUser, times, dataPersons):
        # Obtener la lista plana de todos los valores de todos los arreglos

        lista_plana = [valor for arreglo in times for valor in arreglo]

        # Calcular el promedio sin contar los valores de cero
        lista_filtrada = list(filter(lambda x: x != 0, lista_plana))
        timeAvg = sum(lista_filtrada) / len(lista_filtrada)

        # Calcular la desviación estándar sin contar los valores de cero
        lista_filtrada = list(filter(lambda x: x != 0, lista_plana))

        promedio = sum(lista_filtrada) / len(lista_filtrada)
        timeStd = math.sqrt(sum((x - promedio) ** 2 for x in lista_filtrada) / len(lista_filtrada))

        userNames = list(evaluationXUser.keys())

        avgsXUser = {}

        for kUser in userNames:
            matriz = np.array([valor for valor in evaluationXUser[kUser].values()])

            classEvaluationXUser = np.array(matriz[:, 0])
            recogEvaluationXUser = np.array(matriz[:, 1])
            overLapEvaluationXUser = np.array(matriz[:, 2])
            # Para evitar los resultados inf or nan
            overLapEvaluationXUser = np.isfinite(overLapEvaluationXUser)
            avgsXUser[kUser] = [
                [np.nanmean(classEvaluationXUser), np.nanmean(recogEvaluationXUser), np.mean(overLapEvaluationXUser)],
                [np.nanstd(classEvaluationXUser, ddof=1), np.nanstd(recogEvaluationXUser, ddof=1),
                 np.std(overLapEvaluationXUser, ddof=1)
                 ]]

        matriz = np.array([valor for valor in avgsXUser.values()])
        promedios_avg = np.zeros((1, matriz.shape[2]))
        promedios_std = np.zeros((1, matriz.shape[2]))

        for i in range(matriz.shape[2]):
            promedios_avg[0, i] = np.nanmean(matriz[:, 0, i])
            # Arreglo std
            promedios_std[0, i] = np.nanstd(matriz[:, 0, i], ddof=1)
        table = PrettyTable()
        table.field_names = ['u', 'class', 'recog', 'overlapF', 'classStd', 'recogStd', 'overlapFStd', 'age', 'gender',
                             'handedness', 'ethnicGroup ', 'hasSufferedArmDamage']
        respXUser = []
        for keyUser in evaluationXUser:
            respXUser.append([
                keyUser, avgsXUser[keyUser][0][0], avgsXUser[keyUser][0][1], avgsXUser[keyUser][0][2],
                avgsXUser[keyUser][1][0], avgsXUser[keyUser][1][1], avgsXUser[keyUser][1][2]])

        respXUser = sorted(respXUser, key=lambda x: int(re.search(r'\d+', x[0]).group()))

        if self.genPersonalStats:
            for i, user in enumerate(respXUser):
                indexUser = user[0]
                respXUser[i] = user + list(
                    dataPersons[self.userGroup + "Users"][int(re.findall(r'\d+', indexUser)[0]) - 1].values())
                table.add_row(respXUser[i])

        self.export_summary(table, next(iter(self.data)), promedios_avg[0][0], promedios_std[0][0], promedios_avg[0][1],
                            promedios_std[0][1], timeAvg, timeStd)
        confsAll = [confusionXUser[usuario] for usuario in confusionXUser]
        confsAll = np.array(confsAll)
        targets = np.concatenate([c[:, 0] for c in confsAll])
        outputs = np.concatenate([c[:, 1] for c in confsAll])

        respXUser_dict = []
        for user in respXUser:
            respXUser_dict.append({
                str(user[0]): {
                    "class": user[1],
                    "recog": user[2],
                    "overlapF": user[3],
                    "classStd": user[4],
                    "recogStd": user[5],
                    "overlapFStd": user[6],
                    "age": user[7],
                    "gender": user[8],
                    "handedness": user[9],
                    "ethnicGroup": user[10],
                    "hasSufferedArmDamage": user[11]

                }
            })

        confusion, classes = self.export_confusion_emg(targets, outputs)

        return respXUser_dict, promedios_avg[0][0], promedios_std[0][0], promedios_avg[0][1], promedios_std[0][
            1], lista_filtrada, timeAvg, timeStd, confusion, classes

    def eval_HGR_set(self):
        # path
        path = os.getcwd()
        path = path.replace("\\", "/")

        # create output folder
        # outputFolder = os.path.join(self.publicFolder, self.dataUser)
        # os.makedirs(outputFolder, exist_ok=True)

        responses = self.data
        # data persons
        if self.genPersonalStats:
            if self.typeModel == "11":
                with open(
                        path + "/secrets/demoFile_bloque85_private.json", 'r') as f:
                    data = json.load(f)
                    dataPersons = data
            else:
                with open(
                        path + "/secrets/personalInfo.json", 'r') as f:
                    data = json.load(f)
                    dataPersons = data

        else:
            dataPersons = []
        # priv
        if self.typeModel == "11":
            with open(
                    path + "/secrets/evalFile_bloque85_private.json", 'r', encoding='utf-8') as f:
                data = json.load(f)
                privInfo = data
        else:
            with open(
                    path + "/secrets/matchGtVectorTestingFullReviewed_final.json", 'r', encoding='utf-8') as f:
                data = json.load(f)
                privInfo = data

        evaluation, confusion, times = self.evalRecognition_loop(responses, privInfo, )

        print(f"{next(iter(self.data))}____________")
        respxUser, class_, classStd, recog, recogStd, times, timeAvg, timeStd, confusionResult, classes = self.analyseResults(
            evaluation,
            confusion,
            times,
            dataPersons)
        print('\a')  # beep

        return respxUser, class_, classStd, recog, recogStd, times, timeAvg, timeStd, confusionResult, classes

    def graphResults(self, respXUser, times, timeAvg, timeStd):
        graphs = {}

        # Histogram
        graphs["histogram"] = {}
        accuracyClass = []
        accuracyRecog = []
        graphs["histogram"]["class"] = []
        graphs["histogram"]["recog"] = []
        for user in respXUser:
            for char in user:
                accuracyClass.append(user[char]["class"])
                accuracyRecog.append(user[char]["recog"])
        arrayNumpyClass = np.array(accuracyClass)

        frequency, limits = np.histogram(arrayNumpyClass, bins=10, range=(0.5, 1.0))

        for f, b in zip(frequency.astype(int), limits.astype(float)):
            graphs["histogram"]["class"].append(
                [str(format(b * 100, ".0f")) + "% - " + str((format((b + 0.05) * 100, ".0f"))) + "%", int(f)])

        arrayNumpyRecog = np.array(accuracyRecog)
        frequency, limits = np.histogram(arrayNumpyRecog, bins=10, range=(0.5, 1.0))

        for f, b in zip(frequency.astype(int), limits.astype(float)):
            graphs["histogram"]["recog"].append(
                [str(format(b * 100, ".0f")) + "% - " + str((format((b + 0.05) * 100, ".0f"))) + "%", int(f)])

        # Scatter
        graphs["scatter"] = {}
        graphs["scatter"]["class"] = []
        graphs["scatter"]["recog"] = []
        for user in respXUser:
            for char in user:
                graphs["scatter"]["class"].append([list(user.keys())[0], user[char]["class"]])
                graphs["scatter"]["recog"].append([list(user.keys())[0], user[char]["recog"]])

        # times
        graphs["times"] = []
        minT = timeAvg - 3 * timeStd
        maxT = timeAvg + 3 * timeStd
        if minT < 0:
            minT = 0

        timeVector = np.array(times)
        timeVector = timeVector[(timeVector > minT) & (timeVector <= maxT)]
        frequency, limits = np.histogram(timeVector, bins=50, range=(minT, maxT))

        for f, b in zip(frequency, limits):
            graphs["times"].append([float(b), (int(f) / len(timeVector)) * 100])

        return graphs


class Model(ABC):
    def __init__(self, optionsModel, JSON):
        self.optionsModel = optionsModel
        self.JSON = JSON

    @abstractmethod
    def sentOptionsModel(self):
        pass

    @abstractmethod
    def sentJSONModel(self):
        pass


class Evaluated:
    def __init__(self, model: Model, dataModel):
        self.model = model
        self.dataModel = dataModel

    def getDataModel(self):
        return self.dataModel

    def getModel(self):
        return self.model


class Model11(Model):

    def sentOptionsModel(self):
        return self.optionsModel

    def sentJSONModel(self):
        return self.JSON


class Model5(Model):

    def sentJSONModel(self):
        return self.JSON

    def sentOptionsModel(self):
        return self.optionsModel


class ModelManager:
    def __init__(self, optionsModel, typeModel, JSON):
        if typeModel == "11":
            optionsModel["default_gesture"] = "relax"
        else:
            optionsModel["default_gesture"] = "noGesture"

        self.optionsModel = optionsModel
        self.typeModel = typeModel
        self.JSON = JSON

    def createModel(self):
        if self.typeModel == "11":
            return Model11(self.optionsModel, self.JSON)
        else:
            return Model5(self.optionsModel, self.JSON)

from django.urls import path, include

from evaluationSystemaHGR.views import EvaluateModel, GetModel, GetModels

urlpatterns = [
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('evaluateModel', EvaluateModel.as_view()),
    path('getModels', GetModels.as_view()),
    path('getModel/<nameModel>', GetModel.as_view()),
]
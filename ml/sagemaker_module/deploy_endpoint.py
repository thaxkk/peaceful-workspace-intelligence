# sagemaker/deploy_endpoint.py
import sagemaker
from sagemaker.huggingface import HuggingFaceModel

def deploy_polite_guard():
    role = "arn:aws:iam::173128527645:role/service-role/AmazonSageMakerAdminIAMExecutionRole"

    hub = {
        'HF_MODEL_ID': 'Intel/polite-guard',
        'HF_TASK': 'text-classification'
    }

    huggingface_model = HuggingFaceModel(
        transformers_version='4.37.0',
        pytorch_version='2.1.0',
        py_version='py310',
        env=hub,
        role=role,
    )

    predictor = huggingface_model.deploy(
        initial_instance_count=1,
        instance_type='ml.m5.xlarge',
        endpoint_name='polite-guard-endpoint'
    )

    print("Endpoint deployed:", predictor.endpoint_name)
    return predictor

if __name__ == "__main__":
    deploy_polite_guard()
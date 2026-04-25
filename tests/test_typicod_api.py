
import allure
import pytest

from service.typicod_service import Typicod_Service
from utils.endpoint_helper import get_endpoint
from utils.schema_validator import validate_schema

post_payload = {
  "title": "Your Post Title",
  "body": "The main content of your post.",
  "userId": 1
}

@allure.testcase("GET validation")
@pytest.mark.api
def test_typicod_api_response(api_context):
    api = Typicod_Service(api_context)
    endpoint = get_endpoint("typicod_service","get_api")
    response = api.get_request(endpoint)
    print(response.json())

@allure.testcase("schema validation")
@pytest.mark.api
def test_typicod_schema_validation(api_context):
    api = Typicod_Service(api_context)
    endpoint = get_endpoint("typicod_service","get_api")
    response = api.get_request(endpoint)
    validate_schema(response,"./schemas/typicod_get_schema.json")

@allure.testcase("PUT validation")
@pytest.mark.api
def test_typicode_put_request(api_context):
    api = Typicod_Service(api_context)
    response = api.post_request(get_endpoint("typicod_service","post_api"),None,post_payload)
    print("POST:", response.json())
    print("POST:", response.status)


    


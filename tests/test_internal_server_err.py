
from http.client import INTERNAL_SERVER_ERROR

import allure
import pytest

from service.internal_server_err_service import InternalServerErr_Service
from utils.endpoint_helper import get_endpoint
from utils.schema_validator import validate_schema


@allure.testcase("ERROR validation")
@pytest.mark.api_1
def test_internal_server_err_api_response(api_context):
    api = InternalServerErr_Service(api_context)
    endpoint = get_endpoint("internal_error_service","get_api")
    response = api.get_request(endpoint)
    print(response.json())
from playwright.sync_api import sync_playwright, APIRequestContext
from requests import head

from utils.endpoint_helper import get_base_url, get_endpoint, get_service_url
from utils.retry_analyzer import retry_request

class InternalServerErr_Service:
    
    def __init__(self,request_context:APIRequestContext):
        self.request = request_context
        self.base_url = get_base_url("internal_error_service")

    def get_request(self, endpoint, extra_headers=None):
        retry_request(lambda: self.request.get(f"{self.base_url}{endpoint}",headers=extra_headers))
        #return self.request.get(f"{self.base_url}{endpoint}",headers=extra_headers)
    
    def post_request(self, endpoint, extra_headers=None, payload=None):
        return self.request.post(f"{self.base_url}{endpoint}",headers=extra_headers, data=payload)

    def put_request(self, endpoint, extra_headers=None, payload=None):
        return self.request.put(f"{self.base_url}{endpoint}",headers=extra_headers, data=payload)


        
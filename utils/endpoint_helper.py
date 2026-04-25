
from config.config_manager import get_config


config = get_config()

def get_service_url(service_name, service_endpoint):
    service = config["services"][service_name]
    base_url = service["base_url"]
    end_point = service["end_points"][service_endpoint]
    return f"{base_url}{end_point}"

def get_base_url(service_name):
    service = config["services"][service_name]
    base_url = service["base_url"]
    return f"{base_url}"
    
def get_endpoint(service_name, service_endpoint):
    service = config["services"][service_name]
    end_point = service["end_points"][service_endpoint]
    return f"{end_point}"

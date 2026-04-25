
import os
import yaml

env = os.getenv("ENV")

def get_config():
    with open(f"./config/{env}_config.yml") as file:
        return yaml.safe_load(file)
    

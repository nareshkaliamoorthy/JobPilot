import json

from jsonschema import validate

def validate_schema(response, schema_path):
    with open(schema_path) as file:
        schema = json.load(file)
        
    validate(instance=response.json(), schema=schema)
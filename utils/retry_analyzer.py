import time


RETRY_STATUS = [429, 500, 501, 502, 503, 504]

def retry_request(func, retries=3):

    for attempt in range(retries):

        response = func()

        if response.status not in RETRY_STATUS:
            return response

        if response.status == 429:
            retry_after = response.headers.get("Retry-After", 2)
            wait_time = int(retry_after)
        else:
            wait_time = 2

        print(f"Attempt {attempt+1} Failed: Retrying after {wait_time} seconds")

        time.sleep(wait_time)

    return response
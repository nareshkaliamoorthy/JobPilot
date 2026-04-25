import pytest
from playwright.sync_api import Playwright, sync_playwright

@pytest.fixture(scope="session")
def api_context(playwright: Playwright):
        request = playwright.request.new_context()
        yield request
        request.dispose()




from pathlib import Path

from django.conf import settings
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build


SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]


def get_sheets_service():
    credentials_path = Path(settings.BASE_DIR) / "credentials" / "google-service-account.json"

    credentials = Credentials.from_service_account_file(
        credentials_path,
        scopes=SCOPES,
    )

    service = build("sheets", "v4", credentials=credentials)

    return service


def read_sheet_range(spreadsheet_id, range_name):
    service = get_sheets_service()

    result = (
        service.spreadsheets()
        .values()
        .get(
            spreadsheetId=spreadsheet_id,
            range=range_name,
        )
        .execute()
    )

    return result.get("values", [])

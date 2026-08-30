import os
import pytest
from app.services.monday_service import MondayService

@pytest.mark.asyncio
async def test_monday_service_missing_credentials(monkeypatch):
    monkeypatch.delenv("MONDAY_API_TOKEN", raising=False)
    monkeypatch.delenv("MONDAY_DEALS_BOARD_ID", raising=False)
    monkeypatch.delenv("MONDAY_WORK_ORDERS_BOARD_ID", raising=False)

    service = MondayService(api_token="")
    
    with pytest.raises(ValueError, match="MONDAY_DEALS_BOARD_ID"):
        await service.get_deals()

    with pytest.raises(ValueError, match="MONDAY_WORK_ORDERS_BOARD_ID"):
        await service.get_work_orders()

@pytest.mark.asyncio
async def test_monday_service_health_check_missing_token(monkeypatch):
    monkeypatch.delenv("MONDAY_API_TOKEN", raising=False)
    service = MondayService(api_token="")
    health = await service.check_connection_health()
    assert health["connected"] is False
    assert health["status_message"] == "Monday.com • Connection Error"

import os
import httpx
from typing import Dict, Any, List, Optional
from app.utils.logging import get_logger

logger = get_logger("MondayService")

MONDAY_API_URL = "https://api.monday.com/v2"

class MondayService:
    def __init__(self, api_token: Optional[str] = None):
        self._api_token = api_token

    @property
    def api_token(self) -> Optional[str]:
        return self._api_token or os.getenv("MONDAY_API_TOKEN")

    @property
    def deals_board_id(self) -> Optional[str]:
        return os.getenv("MONDAY_DEALS_BOARD_ID")

    @property
    def work_orders_board_id(self) -> Optional[str]:
        return os.getenv("MONDAY_WORK_ORDERS_BOARD_ID")

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": self.api_token or "",
            "Content-Type": "application/json",
            "API-Version": "2023-10"
        }

    async def fetch_board_items_graphql(self, board_id: str) -> List[Dict[str, Any]]:
        """
        Dynamically fetches all items and column values from a Monday.com board using GraphQL with cursor pagination.
        """
        token = self.api_token
        if not token or not str(token).strip():
            logger.error("Monday.com API Token (MONDAY_API_TOKEN) is missing.")
            raise ValueError("MONDAY_API_TOKEN environment variable is missing.")

        if not board_id or not str(board_id).strip():
            logger.error("Monday.com Board ID is missing.")
            raise ValueError("Monday.com Board ID environment variable is missing.")

        query = """
        query ($board_id: [ID!], $cursor: String) {
            boards (ids: $board_id) {
                name
                columns {
                    id
                    title
                    type
                }
                items_page (limit: 100, cursor: $cursor) {
                    cursor
                    items {
                        id
                        name
                        created_at
                        updated_at
                        column_values {
                            id
                            text
                            value
                            type
                        }
                    }
                }
            }
        }
        """

        all_items = []
        cursor = None
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            while True:
                variables = {"board_id": [board_id], "cursor": cursor}
                try:
                    response = await client.post(
                        MONDAY_API_URL,
                        json={"query": query, "variables": variables},
                        headers=self._get_headers()
                    )
                    
                    if response.status_code == 401:
                        logger.error("Monday.com API authentication failure (401).")
                        raise PermissionError("Monday.com API authentication failed. Please verify MONDAY_API_TOKEN.")
                    elif response.status_code == 429:
                        logger.warning("Monday.com API rate limit exceeded (429).")
                        raise RuntimeError("Monday.com API rate limit reached. Please try again shortly.")
                    elif response.status_code != 200:
                        logger.error(f"Monday.com API HTTP error {response.status_code}: {response.text}")
                        raise RuntimeError(f"Monday.com API request failed with status HTTP {response.status_code}.")

                    data = response.json()
                    
                    if "errors" in data:
                        err_msg = data["errors"][0].get("message", "Unknown GraphQL error")
                        logger.error(f"GraphQL Error from Monday.com: {err_msg}")
                        raise RuntimeError(f"Monday.com GraphQL API error: {err_msg}")

                    boards = data.get("data", {}).get("boards", [])
                    if not boards:
                        logger.warning(f"Board ID {board_id} returned no board payload from Monday.com API.")
                        raise ValueError(f"Monday.com Board ID {board_id} not found or inaccessible.")

                    board = boards[0]
                    col_map = {col["id"]: col["title"] for col in board.get("columns", [])}
                    
                    items_page = board.get("items_page", {})
                    items = items_page.get("items", [])
                    
                    for item in items:
                        row_data = {
                            "Item ID": item.get("id"),
                            "Item Name": item.get("name"),
                            "Created At": item.get("created_at")
                        }
                        for cv in item.get("column_values", []):
                            col_title = col_map.get(cv["id"], cv["id"])
                            row_data[col_title] = cv.get("text") or cv.get("value")
                        all_items.append(row_data)

                    cursor = items_page.get("cursor")
                    if not cursor:
                        break

                except (httpx.TimeoutException, TimeoutError):
                    logger.error("Monday.com API connection timed out.")
                    raise TimeoutError("Connection to Monday.com API timed out.")
                except Exception as e:
                    logger.error(f"Error fetching Monday.com board {board_id}: {str(e)}")
                    raise e

        return all_items

    async def get_deals(self) -> List[Dict[str, Any]]:
        """
        Dynamically fetches Deals board data directly from Monday.com GraphQL API.
        No runtime fallback to local Excel dataset allowed.
        """
        deals_id = self.deals_board_id
        if not deals_id:
            raise ValueError("MONDAY_DEALS_BOARD_ID environment variable is missing.")
        
        logger.info(f"Dynamically fetching Deals from Monday.com GraphQL API (Board ID: {deals_id})")
        return await self.fetch_board_items_graphql(deals_id)

    async def get_work_orders(self) -> List[Dict[str, Any]]:
        """
        Dynamically fetches Work Orders board data directly from Monday.com GraphQL API.
        No runtime fallback to local Excel dataset allowed.
        """
        wo_id = self.work_orders_board_id
        if not wo_id:
            raise ValueError("MONDAY_WORK_ORDERS_BOARD_ID environment variable is missing.")

        logger.info(f"Dynamically fetching Work Orders from Monday.com GraphQL API (Board ID: {wo_id})")
        return await self.fetch_board_items_graphql(wo_id)

    async def check_connection_health(self) -> Dict[str, Any]:
        """
        Probes Monday.com GraphQL API to verify token and board accessibility.
        """
        token = self.api_token
        deals_id = self.deals_board_id
        wo_id = self.work_orders_board_id

        if not token or not deals_id or not wo_id:
            return {
                "connected": False,
                "status_message": "Monday.com • Connection Error",
                "reason": "Missing MONDAY_API_TOKEN, MONDAY_DEALS_BOARD_ID, or MONDAY_WORK_ORDERS_BOARD_ID in environment."
            }

        probe_query = "query { me { id name email } }"
        async with httpx.AsyncClient(timeout=8.0) as client:
            try:
                res = await client.post(
                    MONDAY_API_URL,
                    json={"query": probe_query},
                    headers=self._get_headers()
                )
                if res.status_code == 200 and "data" in res.json():
                    return {
                        "connected": True,
                        "status_message": "Monday.com • Live",
                        "deals_board_id": deals_id,
                        "work_orders_board_id": wo_id,
                        "user": res.json().get("data", {}).get("me", {}).get("name", "Authenticated")
                    }
                else:
                    return {
                        "connected": False,
                        "status_message": "Monday.com • Connection Error",
                        "reason": f"API returned HTTP {res.status_code}"
                    }
            except Exception as e:
                return {
                    "connected": False,
                    "status_message": "Monday.com • Connection Error",
                    "reason": f"Network/Connection failure: {str(e)}"
                }

"""WebSocket consumer for real-time notifications."""
import json
from channels.generic.websocket import AsyncWebsocketConsumer


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.close()
            return
        self.group_name = f"notifications_{user.pk}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        # Send unread count on connect
        from channels.db import database_sync_to_async
        count = await database_sync_to_async(
            lambda: user.notifications.filter(is_read=False, is_dismissed=False).count()
        )()
        await self.send(json.dumps({"type": "unread_count", "count": count}))

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        # Heartbeat ping/pong
        try:
            data = json.loads(text_data or "{}")
            if data.get("type") == "ping":
                await self.send(json.dumps({"type": "pong"}))
        except Exception:
            pass

    async def notification_message(self, event):
        """Called by channel layer group_send from utils.py."""
        await self.send(json.dumps({
            "type": "notification",
            **{k: v for k, v in event.items() if k != "type"},
        }))

"""
Custom exception handlers for Django REST Framework.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
import logging

logger = logging.getLogger('django')


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent error responses.
    
    Args:
        exc: The exception being handled
        context: The context of the request
        
    Returns:
        Response with error details or None
    """
    response = exception_handler(exc, context)
    
    if response is not None:
        # Log the exception
        logger.error(
            f"DRF Exception: {exc.__class__.__name__} - {exc}",
            exc_info=True,
            extra={'context': context}
        )
        
        # Customize the response structure
        if isinstance(response.data, dict):
            response.data = {
                'status': 'error',
                'error': response.data,
                'status_code': response.status_code,
            }
    
    return response

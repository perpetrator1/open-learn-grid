"""Full-text search logic for materials."""

from django.db.models import Q


def material_search(queryset, query):
    """
    Simple case-insensitive full-text search over title, description, and tags.
    Falls back to LIKE-style search (works on all databases including SQLite for tests).
    In production with PostgreSQL, you can enhance this with SearchVector/SearchRank.
    """
    if not query:
        return queryset

    terms = query.split()
    q = Q()
    for term in terms:
        q |= (
            Q(title__icontains=term)
            | Q(description__icontains=term)
            | Q(tags__name__icontains=term)
        )
    return queryset.filter(q).distinct()

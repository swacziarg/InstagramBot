from bot.services.influencer_import_service import (
    InfluencerImportError,
    InfluencerImportService,
)


CatalogImportError = InfluencerImportError


class CatalogService(InfluencerImportService):
    """Compatibility wrapper for the previous catalog-focused importer."""

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Inventory & Order Management API"
    environment: str = "development"

    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/inventory_db"
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://localhost"
    low_stock_threshold: int = 5

    # JWT/Auth settings
    # In production, set SECRET_KEY in Render/Docker environment. Do not commit real secrets.
    secret_key: str = "dev-only-change-this-secret-key-minimum-32-characters"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def validate_production_secret(self):
        if self.environment.lower() == "production":
            if not self.secret_key or self.secret_key.startswith("dev-only") or len(self.secret_key) < 32:
                raise ValueError("SECRET_KEY must be set in production and must be at least 32 characters.")
        return self

    @property
    def origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()

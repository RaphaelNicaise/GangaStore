DEV:
```bash
docker compose -f infra/dev.yml --env-file .env up -d --build
```

PROD:
```bash
docker compose --profile prod up -d --build
```

/api/categories
/api/products
/api/users
/api/price-profiles
/api/special-prices
/api/health
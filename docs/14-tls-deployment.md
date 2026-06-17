# TLS / HTTPS Production Deployment

A production Nginx reverse proxy terminates TLS and routes traffic to the
backend and frontend containers.

```
Internet ──HTTPS:443──► Nginx reverse proxy ──► /api,/metrics → backend:5000
              HTTP:80 → 301 redirect          └► /*            → frontend:80
```

## Files
- `infra/nginx/nginx.conf` — reverse proxy: HTTP→HTTPS redirect, TLS 1.2/1.3, HSTS + security headers, edge rate limiting, `/api` + `/metrics` → backend, `/` → frontend.
- `docker-compose.prod.yml` — adds the `reverse-proxy` service (ports 80/443) and sets `NODE_ENV=production` + an HTTPS `CORS_ORIGIN`.
- `infra/nginx/generate-self-signed-cert.sh` — local self-signed cert helper.
- `infra/nginx/certs/` — cert mount (git-ignored; never commit keys).

## Local HTTPS (self-signed)

```bash
# 1. Secrets (required by the backend)
cp .env.example .env
#    set strong JWT_SECRET / JWT_REFRESH_SECRET and CORS_ORIGIN=https://localhost

# 2. Generate a self-signed cert
chmod +x infra/nginx/generate-self-signed-cert.sh
./infra/nginx/generate-self-signed-cert.sh

# 3. Start the full stack behind the proxy
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```
Open https://localhost (accept the self-signed warning). API: https://localhost/api/health.

## Production TLS (Let's Encrypt)

1. Point your domain's DNS A/AAAA record at the host.
2. Set `CORS_ORIGIN=https://your-domain` in `.env`.
3. Obtain a certificate (one of):
   - **certbot (webroot):** the proxy serves `/.well-known/acme-challenge/` from `/var/www/certbot`; run certbot to issue into `infra/nginx/certs/` (`fullchain.pem`, `privkey.pem`).
   - **Managed:** terminate TLS at a cloud load balancer / CDN and proxy to the stack over the private network.
4. Reload Nginx after renewals: `docker compose -f docker-compose.yml -f docker-compose.prod.yml exec reverse-proxy nginx -s reload` (or run certbot's deploy hook).

## Hardening checklist
- Use real certificates (not self-signed) in production; enable auto-renewal.
- Do **not** publish `backend`/`frontend` host ports — let only the proxy be public.
- Keep `NODE_ENV=production` (enforces explicit non-wildcard `CORS_ORIGIN` + strong secrets).
- HSTS is enabled (`max-age=31536000`); confirm all subdomains are HTTPS first.
- Optionally restrict `/metrics` to the monitoring network / an IP allowlist.

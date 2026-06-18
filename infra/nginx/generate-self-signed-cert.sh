#!/usr/bin/env bash
# Generate a self-signed TLS certificate for local HTTPS testing.
# For production use Let's Encrypt / certbot or a managed certificate instead.
set -euo pipefail

CERT_DIR="$(dirname "$0")/certs"
mkdir -p "$CERT_DIR"

openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -subj "/C=US/ST=Dev/L=Dev/O=CloudPortability/CN=localhost"

echo "Self-signed cert written to $CERT_DIR (privkey.pem, fullchain.pem)."
echo "Mount $CERT_DIR into the reverse-proxy container at /etc/nginx/certs."

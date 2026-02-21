#!/usr/bin/env bash
# =============================================================================
# SafeguardJunub — CouchDB Setup Script
# =============================================================================
# Creates all databases, design documents, and CORS configuration.
#
# Usage:
#   COUCHDB_URL=http://admin:password@localhost:5984 ./scripts/setup-couchdb.sh
#
# Requirements: curl, bash
# =============================================================================

set -euo pipefail

COUCHDB_URL="${COUCHDB_URL:-http://admin:password@localhost:5984}"

# Strip trailing slash
COUCHDB_URL="${COUCHDB_URL%/}"

echo "=== SafeguardJunub CouchDB Setup ==="
echo "Server: ${COUCHDB_URL//:*@/://***@}"
echo ""

# ---------- 1. Verify connectivity ----------
echo "--- Checking CouchDB connectivity..."
if ! curl -sf "${COUCHDB_URL}/" > /dev/null 2>&1; then
  echo "ERROR: Cannot connect to CouchDB at ${COUCHDB_URL//:*@/://***@}"
  echo "Make sure CouchDB is running and credentials are correct."
  exit 1
fi
echo "OK: CouchDB is reachable."

# ---------- 2. Create databases ----------
DATABASES=(
  taban_users
  taban_patients
  taban_hospitals
  taban_medical_records
  taban_referrals
  taban_lab_results
  taban_disease_alerts
  taban_prescriptions
  taban_audit_log
  taban_messages
  taban_births
  taban_deaths
  taban_facility_assessments
  taban_immunizations
  taban_anc
  taban_boma_visits
  taban_follow_ups
  taban_organizations
  taban_platform_config
  taban_meta
)

echo ""
echo "--- Creating databases..."
for db in "${DATABASES[@]}"; do
  status=$(curl -sf -o /dev/null -w "%{http_code}" -X PUT "${COUCHDB_URL}/${db}" 2>/dev/null || echo "000")
  case "$status" in
    201) echo "  Created: ${db}" ;;
    412) echo "  Exists:  ${db}" ;;
    *)   echo "  WARN:    ${db} (HTTP ${status})" ;;
  esac
done

# ---------- 3. Create design documents for filtered replication ----------
echo ""
echo "--- Installing design documents..."

# Org-scoped filter: only replicate documents matching the user's orgId
ORG_FILTER_DOC='{
  "_id": "_design/sync",
  "filters": {
    "by_org": "function(doc, req) { if (doc._id.indexOf(\"_design/\") === 0) return true; if (!doc.orgId) return true; return doc.orgId === req.query.orgId; }"
  }
}'

# Databases that use org-scoped filtering
ORG_SCOPED_DBS=(
  taban_patients
  taban_medical_records
  taban_referrals
  taban_lab_results
  taban_prescriptions
  taban_messages
  taban_births
  taban_deaths
  taban_facility_assessments
  taban_immunizations
  taban_anc
  taban_boma_visits
  taban_follow_ups
  taban_hospitals
  taban_users
  taban_audit_log
)

for db in "${ORG_SCOPED_DBS[@]}"; do
  # Delete old design doc if it exists (ignore errors)
  curl -sf -X DELETE "${COUCHDB_URL}/${db}/_design/sync?rev=$(curl -sf "${COUCHDB_URL}/${db}/_design/sync" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("_rev",""))' 2>/dev/null)" > /dev/null 2>&1 || true

  status=$(curl -sf -o /dev/null -w "%{http_code}" -X PUT \
    -H "Content-Type: application/json" \
    -d "${ORG_FILTER_DOC}" \
    "${COUCHDB_URL}/${db}/_design/sync" 2>/dev/null || echo "000")
  case "$status" in
    201) echo "  Design doc installed: ${db}/_design/sync" ;;
    409) echo "  Design doc exists:    ${db}/_design/sync" ;;
    *)   echo "  WARN: ${db}/_design/sync (HTTP ${status})" ;;
  esac
done

# ---------- 4. Configure CORS ----------
echo ""
echo "--- Configuring CORS..."

# Enable CORS globally
curl -sf -X PUT "${COUCHDB_URL}/_node/_local/_config/httpd/enable_cors" \
  -H "Content-Type: application/json" \
  -d '"true"' > /dev/null 2>&1

# Allow all origins (restrict in production to your domain)
curl -sf -X PUT "${COUCHDB_URL}/_node/_local/_config/cors/origins" \
  -H "Content-Type: application/json" \
  -d '"*"' > /dev/null 2>&1

# Allow credentials
curl -sf -X PUT "${COUCHDB_URL}/_node/_local/_config/cors/credentials" \
  -H "Content-Type: application/json" \
  -d '"true"' > /dev/null 2>&1

# Allow necessary headers
curl -sf -X PUT "${COUCHDB_URL}/_node/_local/_config/cors/headers" \
  -H "Content-Type: application/json" \
  -d '"accept, authorization, content-type, origin, referer"' > /dev/null 2>&1

# Allow necessary methods
curl -sf -X PUT "${COUCHDB_URL}/_node/_local/_config/cors/methods" \
  -H "Content-Type: application/json" \
  -d '"GET, PUT, POST, HEAD, DELETE"' > /dev/null 2>&1

echo "OK: CORS configured."

# ---------- 5. Summary ----------
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Databases created: ${#DATABASES[@]}"
echo "Design docs installed: ${#ORG_SCOPED_DBS[@]}"
echo ""
echo "Next steps:"
echo "  1. Set NEXT_PUBLIC_COUCHDB_URL in .env.local"
echo "  2. Set NEXT_PUBLIC_SYNC_ENABLED=true"
echo "  3. Restart the Next.js dev server"
echo ""

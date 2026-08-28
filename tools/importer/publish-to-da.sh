#!/usr/bin/env bash
# Upload migrated content/*.plain.html to Document Authoring, then preview + publish.
#
# DA source expects a full HTML document, so each .plain.html body fragment is
# wrapped in <body><main>…</main></body> before upload. DA's md pipeline then
# localizes external images to optimized media_ hashes on preview.
#
# Credentials are injected by the environment (no Authorization header) when the
# Adobe IMS / Document Authoring opt-in is enabled in Settings → LLM Permissions.
#
# Usage: tools/importer/publish-to-da.sh [org] [repo] [branch]
set -euo pipefail

ORG="${1:-bhap2}"
REPO="${2:-eds-capstone}"
BRANCH="${3:-main}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CONTENT_DIR="${ROOT}/content"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Publishing ${ORG}/${REPO}@${BRANCH} from ${CONTENT_DIR}"

upload_one() {
  local f="$1" path="$2"
  local wrapped="${TMP}/$(echo "$path" | tr '/' '_').html"
  { echo "<body>"; echo "<main>"; cat "$f"; echo "</main>"; echo "</body>"; } > "$wrapped"
  curl -s -o /dev/null -w "%{http_code}" -X POST \
    -F "data=@${wrapped};type=text/html" \
    "https://admin.da.live/source/${ORG}/${REPO}/${path}.html"
}

hlx() { # $1=action(preview|live) $2=path
  curl -s -o /dev/null -w "%{http_code}" -X POST \
    "https://admin.hlx.page/$1/${ORG}/${REPO}/${BRANCH}/$2"
}

# Upload images referenced by nav/footer fragments.
if [ -d "${CONTENT_DIR}/images" ]; then
  for img in "${CONTENT_DIR}"/images/*; do
    [ -f "$img" ] || continue
    name="$(basename "$img")"
    code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -F "data=@${img}" \
      "https://admin.da.live/source/${ORG}/${REPO}/images/${name}")
    echo "  image images/${name} -> ${code}"
  done
fi

# Upload → preview → publish every .plain.html fragment.
find "${CONTENT_DIR}" -name "*.plain.html" | sort | while read -r f; do
  rel="${f#"${CONTENT_DIR}"/}"
  path="${rel%.plain.html}"
  up=$(upload_one "$f" "$path")
  pv=$(hlx preview "$path")
  lv=$(hlx live "$path")
  echo "  ${path}: upload=${up} preview=${pv} publish=${lv}"
done

echo "Done."

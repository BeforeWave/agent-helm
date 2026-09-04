#!/bin/sh
set -eu

fail() {
  printf '%s\n' "GitHub Release installer: $1" >&2
  exit 1
}

checksum_file() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
  elif command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    fail "SHA-256 verification requires shasum or sha256sum."
  fi
}

validate_release_url() {
  case "$1" in
    https://github.com/*/releases) ;;
    *) fail "--release-url must be an https://github.com/.../releases URL." ;;
  esac
}

validate_version() {
  printf '%s\n' "$1" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+([+-][0-9A-Za-z.-]+)?$' \
    || fail "version must be semantic version X.Y.Z or latest."
}

resolve_version() {
  release_url=$1
  requested=$2
  if [ "$requested" != latest ]; then
    requested=${requested#v}
    validate_version "$requested"
    printf '%s\n' "$requested"
    return 0
  fi
  effective=$(curl -fsSL -o /dev/null -w '%{url_effective}' "$release_url/latest") \
    || fail "could not resolve latest GitHub Release from $release_url."
  version=${effective##*/}
  version=${version#v}
  validate_version "$version"
  printf '%s\n' "$version"
}

fetch_manifest() {
  _bwr_fetch_release_url=$1
  _bwr_fetch_version=$2
  _bwr_fetch_output=$3
  curl -fL --retry 2 --connect-timeout 15 "$_bwr_fetch_release_url/download/v$_bwr_fetch_version/release-manifest.json" -o "$_bwr_fetch_output" \
    || fail "GitHub Release v$_bwr_fetch_version does not provide release-manifest.json."
}

manifest_field() {
  manifest=$1
  field=$2
  line=$(grep -m 1 "\"$field\"[[:space:]]*:" "$manifest" || true)
  value=$(printf '%s\n' "$line" | sed -n "s/.*\"$field\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p")
  [ -n "$value" ] || fail "release manifest does not contain string field $field."
  printf '%s\n' "$value"
}

artifact_field() {
  manifest=$1
  artifact_id=$2
  field=$3
  awk -v id="$artifact_id" -v field="$field" '
    index($0, "\"id\": \"" id "\"") { found=1 }
    found && index($0, "\"" field "\":") { print; exit }
    found && /^[[:space:]]*}[,]?[[:space:]]*$/ { found=0 }
  ' "$manifest" | sed -n "s/.*\"$field\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p"
}

command -v curl >/dev/null 2>&1 || fail "curl is required."

command_name=${1:-}
shift || true
release_url=''
version=latest
artifact_id=''
field=''
output=''

while [ "$#" -gt 0 ]; do
  case "$1" in
    --release-url) release_url=${2:-}; shift 2 ;;
    --version) version=${2:-}; shift 2 ;;
    --artifact-id) artifact_id=${2:-}; shift 2 ;;
    --field) field=${2:-}; shift 2 ;;
    --output) output=${2:-}; shift 2 ;;
    *) fail "unknown option: $1" ;;
  esac
done

[ -n "$release_url" ] || fail "--release-url is required."
release_url=${release_url%/}
validate_release_url "$release_url"
resolved=$(resolve_version "$release_url" "$version")

case "$command_name" in
  resolve)
    printf '%s\n' "$resolved"
    ;;
  field)
    [ -n "$field" ] || fail "field command requires --field."
    case "$field" in *[!A-Za-z0-9_-]*) fail "--field contains unsupported characters." ;; esac
    tmp=$(mktemp "${TMPDIR:-/tmp}/beforewave-release-manifest.XXXXXX")
    trap 'rm -f "$tmp"' EXIT HUP INT TERM
    fetch_manifest "$release_url" "$resolved" "$tmp"
    manifest_field "$tmp" "$field"
    ;;
  download)
    [ -n "$artifact_id" ] || fail "download command requires --artifact-id."
    case "$artifact_id" in *[!A-Za-z0-9._-]*) fail "--artifact-id contains unsupported characters." ;; esac
    [ -n "$output" ] || fail "download command requires --output."
    root=$(mktemp -d "${TMPDIR:-/tmp}/beforewave-release-download.XXXXXX")
    trap 'rm -rf "$root"' EXIT HUP INT TERM
    manifest="$root/release-manifest.json"
    fetch_manifest "$release_url" "$resolved" "$manifest"
    artifact_version=$(artifact_field "$manifest" "$artifact_id" version)
    [ "$artifact_version" = "$resolved" ] || fail "artifact $artifact_id version does not match Release v$resolved."
    download_url=$(artifact_field "$manifest" "$artifact_id" downloadUrl)
    expected_sha=$(artifact_field "$manifest" "$artifact_id" sha256 | tr 'A-F' 'a-f')
    [ -n "$download_url" ] || fail "release manifest does not contain artifact $artifact_id downloadUrl."
    printf '%s\n' "$expected_sha" | grep -Eq '^[0-9a-f]{64}$' || fail "release manifest does not contain a valid SHA-256 for $artifact_id."
    case "$download_url" in
      "$release_url/download/v$resolved/"*) ;;
      *) fail "artifact $artifact_id download URL is outside Release v$resolved." ;;
    esac
    mkdir -p "$(dirname "$output")"
    curl -fL --retry 2 --connect-timeout 15 "$download_url" -o "$output" \
      || fail "could not download artifact $artifact_id from GitHub Release v$resolved."
    actual_sha=$(checksum_file "$output")
    [ "$actual_sha" = "$expected_sha" ] || fail "SHA-256 verification failed for artifact $artifact_id."
    printf '%s\n' "$resolved"
    ;;
  *) fail "command must be resolve, field, or download." ;;
esac

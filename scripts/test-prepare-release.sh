#!/usr/bin/env bash
set -euo pipefail

script="$(cd "$(dirname "$0")/.." && pwd)/.github/scripts/prepare-release.sh"
temp="$(mktemp -d)"
trap 'rm -rf "$temp"' EXIT
mkdir "$temp/bin"
cd "$temp"
export PATH="$temp/bin:$PATH"
export GITHUB_REPOSITORY='test/picker'
export GITHUB_SHA='1111111111111111111111111111111111111111'
export BEFORE_SHA='2222222222222222222222222222222222222222'

cat > bin/git <<'MOCK'
#!/usr/bin/env bash
set -eu
[[ "$1" == 'show' && "$2" == "$BEFORE_SHA:package.json" ]]
printf '{"version":"%s"}\n' "$MOCK_BEFORE_VERSION"
MOCK

cat > bin/curl <<'MOCK'
#!/usr/bin/env bash
set -eu
[[ "$*" == *'https://registry.npmjs.org/@ntustray%2freact-datetime-range-picker/'* ]]
echo 'registry' >> calls
printf '%s' "$MOCK_REGISTRY_STATUS"
MOCK

cat > bin/gh <<'MOCK'
#!/usr/bin/env bash
set -eu
case "$*" in
  "api repos/test/picker/commits/tags/v1.2.3 --jq .sha")
    echo 'lookup tag' >> calls
    case "$MOCK_TAG" in
      existing) echo "$GITHUB_SHA" ;;
      different) echo "$BEFORE_SHA" ;;
      missing|racing)
        grep -qx 'create tag' calls && echo "$GITHUB_SHA"
        ;;
      *) exit 1 ;;
    esac
    ;;
  "api --method POST repos/test/picker/git/refs -f ref=refs/tags/v1.2.3 -f sha=$GITHUB_SHA")
    echo 'create tag' >> calls
    [[ "$MOCK_TAG" == missing ]]
    ;;
  "api --method POST repos/test/picker/actions/workflows/release.yml/dispatches -f ref=v1.2.3")
    echo 'dispatch tag' >> calls
    ;;
  *) echo "Unexpected gh call: $*" >&2; exit 1 ;;
esac
MOCK

chmod +x bin/*
fixture() {
  : > calls
  export GITHUB_REF='refs/heads/main'
  export GITHUB_EVENT_NAME='push'
  export MOCK_BEFORE_VERSION='1.2.2'
  export MOCK_REGISTRY_STATUS='404'
  export MOCK_TAG='missing'
  printf '{"name":"@ntustray/react-datetime-range-picker","version":"%s"}\n' "$1" > package.json
}
run() {
  local result=0
  bash "$script" > output 2>&1 || result=$?
  if [[ "$result" != "$1" ]]; then
    cat output calls
    echo "Expected exit $1, received $result." >&2
    exit 1
  fi
  if [[ "$(cat calls)" != "$2" ]]; then
    cat output calls
    echo 'Unexpected registry or GitHub calls.' >&2
    exit 1
  fi
}

fixture '1.2.3'
export MOCK_BEFORE_VERSION='1.2.3'
run 0 ''
grep -q 'did not change' output
fixture '1.2.3-beta.1'
run 0 ''
fixture '01.2.3'
run 0 ''
fixture '1.2.3'
export GITHUB_REF='refs/tags/v1.2.3'
run 1 ''
fixture '1.2.3'
export MOCK_REGISTRY_STATUS='200'
run 0 'registry'
fixture '1.2.3'
export MOCK_REGISTRY_STATUS='503'
run 1 'registry'
fixture '1.2.3'
run 0 $'registry\nlookup tag\ncreate tag\nlookup tag\ndispatch tag'
fixture '1.2.3'
export MOCK_TAG='existing'
run 0 $'registry\nlookup tag\ndispatch tag'
fixture '1.2.3'
export MOCK_TAG='racing'
run 0 $'registry\nlookup tag\ncreate tag\nlookup tag\ndispatch tag'
fixture '1.2.3'
export MOCK_TAG='different'
run 1 $'registry\nlookup tag'
grep -q 'must stay immutable' output
fixture '1.2.3'
export GITHUB_EVENT_NAME='workflow_dispatch'
export MOCK_BEFORE_VERSION='1.2.3'
run 0 $'registry\nlookup tag\ncreate tag\nlookup tag\ndispatch tag'
echo '11 npm release preparation scenarios passed.'

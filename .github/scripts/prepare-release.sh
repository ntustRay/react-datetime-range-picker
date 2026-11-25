#!/usr/bin/env bash
set -euo pipefail

if [[ "$GITHUB_REF" != 'refs/heads/main' ]]; then
  echo '::error::Release preparation must run on main.'
  exit 1
fi

package='@ntustray/react-datetime-range-picker'
version=$(jq -er --arg package "$package" 'select(.name == $package) | .version' package.json)
stable='^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$'
if [[ ! "$version" =~ $stable ]]; then
  echo "Skipping $version because automatic releases require a stable X.Y.Z version."
  exit 0
fi

if [[ "$GITHUB_EVENT_NAME" == 'push' ]]; then
  before_version=$(git show "${BEFORE_SHA}:package.json" | jq -er '.version')
  if [[ "$before_version" == "$version" ]]; then
    echo "Version $version did not change on main."
    exit 0
  fi
fi

tag="v$version"
endpoint="https://registry.npmjs.org/@ntustray%2freact-datetime-range-picker/$version"
status=$(curl --silent --show-error --retry 3 --connect-timeout 10 --max-time 20 \
  --output /dev/null --write-out '%{http_code}' "$endpoint")
case "$status" in
  200) echo "$package@$version is already published."; exit 0 ;;
  404) ;;
  *) echo "::error::npm registry returned HTTP $status."; exit 1 ;;
esac

# Ask for the commit so this also resolves an existing annotated tag.
tag_endpoint="repos/$GITHUB_REPOSITORY/commits/tags/$tag"
if ! tagged_sha=$(gh api "$tag_endpoint" --jq '.sha' 2>/dev/null); then
  # Creating a ref never moves an existing tag, even if another run wins the race.
  if ! gh api --method POST "repos/$GITHUB_REPOSITORY/git/refs" \
    -f ref="refs/tags/$tag" -f sha="$GITHUB_SHA" >/dev/null; then
    echo "Could not create $tag; checking whether it now exists."
  fi
  tagged_sha=$(gh api "$tag_endpoint" --jq '.sha')
fi
if [[ "$tagged_sha" != "$GITHUB_SHA" ]]; then
  echo "::error::$tag points to $tagged_sha, expected $GITHUB_SHA. Existing tags must stay immutable."
  exit 1
fi

# GITHUB_TOKEN-created tag pushes don't start workflows. An explicit dispatch does.
gh api --method POST "repos/$GITHUB_REPOSITORY/actions/workflows/release.yml/dispatches" -f ref="$tag"
echo "Dispatched the release from $tag ($tagged_sha)."

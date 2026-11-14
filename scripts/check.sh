#!/usr/bin/env bash
# All project checks in one place: CI runs this script on every PR.
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/build.mjs --check     # css/shmotka.css matches tokens/tokens.json
node scripts/check-contrast.mjs    # WCAG contrast in both themes for every accent
node --test test/*.test.mjs        # colour maths + a real Tailwind/daisyUI build of a consumer project

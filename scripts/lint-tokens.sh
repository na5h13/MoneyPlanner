#!/bin/bash
# lint-tokens.sh — Scan codebase for OpenSpec violations
# Run: bash scripts/lint-tokens.sh

echo "🔍 Keel Token Lint Scanner"
echo "══════════════════════════"
echo ""

ERRORS=0
WARNINGS=0

# Find all src files excluding tokens.ts and node_modules
FILES=$(find src/ app/ web/src/ -name "*.ts" -o -name "*.tsx" -o -name "*.css" 2>/dev/null | grep -v node_modules | grep -v tokens.ts | grep -v __tests__ | grep -v '.d.ts')

for f in $FILES; do
    FILE_ERRORS=""

    # Check hardcoded hex
    HEX=$(grep -nE '#[0-9a-fA-F]{3,8}' "$f" 2>/dev/null | grep -v '^\s*//' | grep -v 'import ' | grep -v 'tokens\.' | grep -v 'theme\.' | head -3)
    [ -n "$HEX" ] && FILE_ERRORS="${FILE_ERRORS}  🚫 Hardcoded hex:\n${HEX}\n"

    # Check hardcoded rgba
    RGBA=$(grep -nE 'rgba?\(' "$f" 2>/dev/null | grep -v '^\s*//' | grep -v 'import ' | grep -v 'tokens\.' | grep -v 'glass\.' | head -3)
    [ -n "$RGBA" ] && FILE_ERRORS="${FILE_ERRORS}  🚫 Hardcoded rgba:\n${RGBA}\n"

    # Check banned charts
    CHARTS=$(grep -niE 'PieChart|DonutChart|GaugeChart|SpeedometerChart' "$f" 2>/dev/null | head -3)
    [ -n "$CHARTS" ] && FILE_ERRORS="${FILE_ERRORS}  🚫 Banned chart type:\n${CHARTS}\n"

    # Check shame language
    SHAME=$(grep -niE '"over budget"|"overspent"|"failed"|"cut back"' "$f" 2>/dev/null | grep -v '^\s*//' | head -3)
    [ -n "$SHAME" ] && FILE_ERRORS="${FILE_ERRORS}  ⚠️  Shame language:\n${SHAME}\n"

    # Check red in non-decision
    RED=$(grep -niE "'red'|\"red\"|#[fF][fF]0000|#[fF]00\b|color:.*red" "$f" 2>/dev/null | grep -v '^\s*//' | grep -v 'breach\|hardStop\|BEHIND' | head -3)
    [ -n "$RED" ] && FILE_ERRORS="${FILE_ERRORS}  🚫 Red in ambient:\n${RED}\n"

    # Check non-spec fonts
    FONTS=$(grep -niE "fontFamily.*['\"]" "$f" 2>/dev/null | grep -viE "Playfair|Source.Sans|Source.Code|system|Platform|tokens\.|theme\." | head -3)
    [ -n "$FONTS" ] && FILE_ERRORS="${FILE_ERRORS}  ⚠️  Non-spec font:\n${FONTS}\n"

    if [ -n "$FILE_ERRORS" ]; then
        echo "📄 $f"
        echo -e "$FILE_ERRORS"
        ERRORS=$((ERRORS+1))
    fi
done

echo "══════════════════════════"
if [ $ERRORS -eq 0 ]; then
    echo "✅ All clean — 0 violations"
else
    echo "🚫 $ERRORS file(s) with violations"
    exit 1
fi

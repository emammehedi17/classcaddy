#!/bin/bash
TOTAL=$(wc -l < study-plan-styles.css.bak)
BOTTOM=800
TOP=$TOTAL
while [ $BOTTOM -lt $TOP ]; do
  MID=$(( (BOTTOM + TOP) / 2 ))
  head -n $MID study-plan-styles.css.bak > study-plan-styles.css
  if npm run build >/dev/null 2>&1; then
    # success, error is in the second half
    BOTTOM=$((MID + 1))
  else
    # failed, error is in the first half
    TOP=$MID
  fi
  echo "Range: $BOTTOM - $TOP"
done
echo "Failing line is roughly $BOTTOM"

#!/bin/bash
while true; do
  if grep -q "Done" <<< "$(cat /tmp/build_output.txt 2>/dev/null)"; then
    break
  fi
  sleep 1
done

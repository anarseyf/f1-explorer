#!/bin/bash
# Downloads missing driver portraits from Wikipedia.
# Run from the f1-explorer root directory: bash images/temp/download_portraits.sh

OUT="images/drivers"
CSV="images/temp/missing_portraits.csv"
UA="F1Explorer/1.0 (personal project)"

tail -n +2 "$CSV" | while IFS=, read -r ref name wiki_title; do
  out_file="${OUT}/${ref}.jpg"
  if [ -f "$out_file" ]; then
    echo "skip  $name (already exists)"
    continue
  fi

  api="https://en.wikipedia.org/api/rest_v1/page/summary/${wiki_title}"
  result=$(curl -sf "$api" -H "User-Agent: $UA")
  if [ -z "$result" ]; then
    echo "FAIL  $name (API error)"
    continue
  fi

  img_url=$(echo "$result" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('originalimage', d.get('thumbnail', {})).get('source', ''))
" 2>/dev/null)

  if [ -z "$img_url" ]; then
    echo "MISS  $name (no image in API response)"
    continue
  fi

  curl -sfL "$img_url" -H "User-Agent: $UA" -o "$out_file"
  if [ $? -eq 0 ]; then
    echo "OK    $name -> ${ref}.jpg"
  else
    echo "FAIL  $name (download error)"
  fi

  sleep 2
done

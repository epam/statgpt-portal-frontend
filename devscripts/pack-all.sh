#!/bin/bash

# Relative paths from the project root
LIBS_DIR="./dist/libs"
OUTPUT_DIR="./dist/packages"

# Make sure output folder exists
mkdir -p "$OUTPUT_DIR"

echo "Packing libs from: $LIBS_DIR"
echo "Output folder: $OUTPUT_DIR"

for dir in "$LIBS_DIR"/*; do
  if [ -d "$dir" ]; then
    echo "📦 Packing $(basename "$dir")"
    npm pack "$dir" --pack-destination "$OUTPUT_DIR"
  fi
done

echo "--------------------------------------"
echo " Done! Packed files stored in:"
echo " $OUTPUT_DIR"
echo "--------------------------------------"

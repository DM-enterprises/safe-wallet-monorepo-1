#!/bin/bash

# Define the output file
OUTPUT_FILE="hashes.txt"
BUILD_DIR="../out/_next"

# Clear the output file if it exists
> "$OUTPUT_FILE"

# Find all JS files in the .next directory and compute SHA-256 hashes
find "$BUILD_DIR" -type f -name "*.js" | while read -r file; do
    hash=$(openssl sha256 -binary "$file" | openssl base64)
    echo "'sha256-$hash' -  $file" >> "$OUTPUT_FILE"
done

echo "Hashes written to $OUTPUT_FILE"
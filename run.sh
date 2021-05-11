#!/bin/bash -ex

GOARCH=wasm GOOS=js go build -o main.wasm
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" .
wasm2wat main.wasm > main.wat
python3 process.py > main_formatted.wat
wat2wasm main_formatted.wat
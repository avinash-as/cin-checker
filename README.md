# CIN Checker

A small web app that validates and decodes Indian Corporate Identity Numbers (CIN) and LLP Identification Numbers (LLPIN).

Live: https://avinash-as.github.io/cin-checker/

## What it does

- Paste any number of CINs / LLPINs, one per line.
- For each: valid or invalid, with the exact reason when invalid.
- For valid CINs: listed/unlisted, state, year of incorporation, company type.
- Runs entirely in the browser — nothing is uploaded.

## CIN format (21 characters)

`L/U` + 5-digit industry code + 2-letter state code + 4-digit year + 3-letter company type + 6-digit registration number.

Company type codes: PLC, PTC, OPC, NPL, FLC, GOI, SGC, ULL.

LLPIN format: `AAA-1234` (3 letters, hyphen, 4 digits).

## Run locally

Open `index.html` in any browser. No build step.

#!/bin/bash
mkdir -p submission/screenshots submission/code
cp -r backend frontend n8n data docker-compose.yml submission/code/
node scripts/generate_summary.js
echo "Submission folder ready. Record demo video next."
echo "Form URL: https://forms.gle/WC61fKj5vLybGJtC7"

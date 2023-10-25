#!/bin/bash

OUTPUT=$(yarn --silent ts-prune --ignore '.yalc/|lib/index.ts' | grep -v 'Props (used in module)')

if [ "$OUTPUT" != "" ]; then
    echo $OUTPUT
    exit 1
fi

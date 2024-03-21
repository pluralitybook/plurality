"""
Convert CSV from Google Spreadsheet into more useful format
"""

import os
import re
import csv
from collections import defaultdict


CSV_FILE = "Plurality Book Indexing Exercise - Main.csv"
# This will get the absolute path of the current script file.
script_directory = os.path.dirname(os.path.abspath(__file__))

# Construct the path to the target directory relative to the script file.
# This moves up two levels from the script's directory and then into the "contents/english" directory.
target_directory = os.path.join(script_directory, "..", "..", "contents", "english")

# List the contents of the target directory.
sections = os.listdir(target_directory)
sections.remove("Plurality Book Ownership List.md")

section_contents = {}
for filename in sections:
    section = re.match("(\d-\d|\d)-", filename).groups()[0]
    content = open(os.path.join(target_directory, filename)).read()
    section_contents[section] = content.lower()

lines = open(os.path.join(script_directory, CSV_FILE)).readlines()[1:]
poc_count = defaultdict(int)
keywords = set()
for row in csv.reader(lines):
    keywords.add(row[1])
    poc_count[row[3]] += 1

with open(os.path.join(script_directory, "contributors.tsv"), "w") as f:
    for name in sorted(poc_count):
        print(f"{name}\t{poc_count[name]}", file=f)

keyword_occurence = defaultdict(list)
section_occurence = defaultdict(int)
for k in keywords:
    for section in section_contents:
        if k.lower() in section_contents[section]:
            keyword_occurence[k].append(section)
            section_occurence[section] += 1
        elif "(" in k:
            # if keywords looks `AAA (BBB)` style, use occurrence of `AAA` instead
            k2 = k.split("(")[0].strip().lower()
            if k2 in ["", "X"]:  # exception, such as `X(Twitter)`
                continue
            if k2 in section_contents[section]:
                keyword_occurence[k].append(section)
                section_occurence[section] += 1


with open(os.path.join(script_directory, "no_occurence.txt"), "w") as warn_no_occurence:
    for k in sorted(keywords):
        if not keyword_occurence[k]:
            print(k, file=warn_no_occurence)


with open(os.path.join(script_directory, "keyword_occurrence.tsv"), "w") as f:
    for k in sorted(keyword_occurence, key=lambda x: x.lower()):
        occ = ", ".join(sorted(keyword_occurence[k]))
        k = k.replace('"', "")  # care for `Diversity of "groups"`
        print(f"{k}\t{occ}", file=f)

with open(os.path.join(script_directory, "section_occurrence.tsv"), "w") as f:
    for sec in sorted(section_occurence):
        print(f"{sec}\t{section_occurence[sec]}", file=f)

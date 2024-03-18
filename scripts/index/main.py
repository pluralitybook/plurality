"""

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

print("poc_count", poc_count, "\n")
keyword_occurence = defaultdict(list)
section_occurence = defaultdict(int)
for k in keywords:
    for section in section_contents:
        if k.lower() in section_contents[section]:
            keyword_occurence[k].append(section)
            section_occurence[section] += 1

for k in sorted(keyword_occurence, key=lambda x: x.lower()):
    occ = ", ".join(sorted(keyword_occurence[k]))
    print(f"{k}\t{occ}")

print()
for sec in sorted(section_occurence):
    print(f"{sec}\t{section_occurence[sec]}")

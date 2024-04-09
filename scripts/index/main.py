"""
Convert CSV from Google Spreadsheet into more useful format
"""

import os
import re
from collections import defaultdict
import json
import csv


def normalize_section_name(s):
    "XX-YY -> X-Y"
    return "-".join(str(x) for x in [int(x) for x in s.split("-")])


def remove_palen(s):
    "`AAA (BBB)` -> `AAA`"
    return k.split("(")[0].strip()


CSV_FILE = "Plurality Book Indexing Exercise - Candidates.csv"
# This will get the absolute path of the current script file.
script_directory = os.path.dirname(os.path.abspath(__file__))

# keywords which should avoid mechine search, such as `X`(Twitter) or `her`(Movie name)
ignore_file = os.path.join(script_directory, "ignore.txt")
IGNORE = open(ignore_file).read().strip().splitlines()

# keywords which should case sensitive and word boundary sensitive, such as `BERT`, `ROC`, `UN`
ignore_file = os.path.join(script_directory, "case_sensitive.txt")
CASE_SENSITIVE = open(ignore_file).read().strip().splitlines()

# List the contents of the target directory.
pages = json.load(open(os.path.join(script_directory, "book.json")))
pages_lower = {}
for p in pages:
    pages_lower[p] = pages[p].lower()


lines = open(os.path.join(script_directory, CSV_FILE)).readlines()[1:]
keywords = set()
keyword_recorded_by_human = defaultdict(set)
for row in csv.reader(lines):
    k = row[1]
    if k in ["Just", "Author", "Fair", "Writing"]:  # not a keyword
        continue
    keywords.add(k)
    keyword_recorded_by_human[k].add(normalize_section_name(row[2]))


# find keyword occurence in other sections
keyword_occurence = defaultdict(list)
section_occurence = defaultdict(int)
for k in keywords:
    # find occurence in other sections
    if k in IGNORE:
        continue

    for p in pages:
        if k in CASE_SENSITIVE:
            if k in pages[p]:
                keyword_occurence[k].append(p)
                section_occurence[p] += 1
        else:
            if k.lower() in pages_lower[p]:
                keyword_occurence[k].append(p)
                section_occurence[p] += 1
            elif "(" in k:
                # if keywords looks `AAA (BBB)` style, use occurrence of `AAA` instead
                k2 = remove_palen(k)
                if not k2 or k2 in IGNORE:
                    continue
                if k2.lower() in pages[p]:
                    keyword_occurence[k].append(p)
                    section_occurence[p] += 1


with open(
    os.path.join(script_directory, "j_no_occurence.txt"), "w"
) as warn_no_occurence:
    print("Keywords\tSections", file=warn_no_occurence)
    for k in sorted(keywords):
        if not keyword_occurence[k] and k not in IGNORE:
            sections = ", ".join(sorted(keyword_recorded_by_human[k]))
            print(f"{k}\t{sections}", file=warn_no_occurence)


with open(os.path.join(script_directory, "j_keyword_occurrence.tsv"), "w") as f:
    print(f"Keywords\tSection(by Human)\tSection(by Script)", file=f)

    for k in sorted(keyword_occurence, key=lambda x: (x.lower(), x)):
        human = ", ".join(sorted(keyword_recorded_by_human[k]))
        occ = ", ".join(sorted(keyword_occurence[k]))
        k = k.replace('"', "")  # care mulformed TSV such as `Diversity of "groups"`
        print(f"{k}\t{human}\t{occ}", file=f)


too_many_occurrence = []
for k in sorted(keyword_occurence, key=lambda x: x.lower()):
    if len(keyword_occurence[k]) >= 5:
        human = ", ".join(sorted(keyword_recorded_by_human[k]))
        occ = ", ".join(sorted(keyword_occurence[k]))
        k = k.replace('"', "")  # care mulformed TSV such as `Diversity of "groups"`
        too_many_occurrence.append((len(keyword_occurence[k]), k, human, occ))

too_many_occurrence.sort(reverse=True)
with open(os.path.join(script_directory, "j_too_many_occurrence.tsv"), "w") as f:
    print(f"Keywords\tSection(by Human)\tSection(by Script)", file=f)
    for num, k, human, occ in too_many_occurrence:
        print(f"{k}\t{human}\t{occ}", file=f)

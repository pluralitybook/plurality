"""
Convert CSV from Google Spreadsheet into more useful format
"""

import os
import re
from collections import defaultdict
import json
import csv

# Make section pages mapping

SECTION_PAGES_MAPPINGS_str = """
1-1 4
2-0 6
2-1 38
2-2 50
3-0 70
3-1 74
3-2 87
3-3 103
4-0 126
4-1 140
4-2 161
4-3 177
4-4 194
4-5 213
5-0 220
5-1 235
5-2 244
5-3 255
5-4 265
5-5 279
5-6 290
5-7 299
6-0 316
6-1 328
6-2 340
6-3 354
6-4 362
7-0 367
7-1 391
"""
lines = SECTION_PAGES_MAPPINGS_str.strip().splitlines()
items = [line.split() for line in lines]
SECTION_START = {}
for section, page in items:
    SECTION_START[section] = int(page)
SECTION_END = {}
for i in range(len(lines) - 1):
    SECTION_END[items[i][0]] = int(items[i + 1][1])
SECTION_END["7-1"] = 400


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
_pages = json.load(open(os.path.join(script_directory, "book.json")))
pages = {}
pages_lower = {}
for _p in _pages:
    p = int(_p) - 1  # cover page offset
    pages[p] = _pages[_p]
    pages_lower[p] = _pages[_p].lower()


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

    mask = [0] * len(pages)
    for section in keyword_recorded_by_human[k]:
        for p in range(SECTION_START[section], SECTION_END[section]):
            mask[p] = 1

    for p in pages:
        if not mask[p]:
            continue
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


with open(os.path.join(script_directory, "no_occurence.txt"), "w") as warn_no_occurence:
    print("Keywords\tSections", file=warn_no_occurence)
    for k in sorted(keywords):
        if not keyword_occurence[k] and k not in IGNORE:
            sections = ", ".join(sorted(keyword_recorded_by_human[k]))
            print(f"{k}\t{sections}", file=warn_no_occurence)


too_many_occurrence = []
with open(os.path.join(script_directory, "keyword_occurrence.tsv"), "w") as f:
    print(f"Keywords\tPages", file=f)

    for k in sorted(keyword_occurence, key=lambda x: (x.lower(), x)):
        occ = []
        prev = -999
        for p in sorted(keyword_occurence[k]):
            if p != prev + 1:  # ignore continuous pages
                occ.append(p)
            prev = p
        occ_str = ", ".join(str(p) for p in occ)
        k = k.replace('"', "")  # care mulformed TSV such as `Diversity of "groups"`
        print(f"{k}\t{occ_str}", file=f)

        if len(occ) >= 5:
            human = ", ".join(sorted(keyword_recorded_by_human[k]))
            k = k.replace('"', "")  # care mulformed TSV such as `Diversity of "groups"`
            too_many_occurrence.append((len(keyword_occurence[k]), k, human, occ_str))


too_many_occurrence.sort(reverse=True)
with open(os.path.join(script_directory, "too_many_occurrence.tsv"), "w") as f:
    print(f"Keywords\tSection(by Human)\tSection(by Script)", file=f)
    for num, k, human, occ in too_many_occurrence:
        print(f"{k}\t{human}\t{occ}", file=f)

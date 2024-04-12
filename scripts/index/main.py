"""
Convert CSV from Google Spreadsheet into more useful format
"""

import os
import re
from collections import defaultdict
import json
import csv

PLURALITY = "\u2ffb"

# Make section pages mapping

SKIP = 0  # page numbered 1 is page 1 on PDF

SECTION_PAGES_MAPPINGS_str = """
1-1 1
2-0 3
2-1 47
2-2 64
3-0 88
3-1 94
3-2 112
3-3 132
4-0 161
4-1 179
4-2 208
4-3 230
4-4 251
4-5 277
5-0 285
5-1 305
5-2 317
5-3 332
5-4 345
5-5 363
5-6 377
5-7 390
6-0 411
6-1 427
6-2 444
6-3 462
6-4 473
7-0 479
7-1 510
"""
LAST_PAGE = 520

lines = SECTION_PAGES_MAPPINGS_str.strip().splitlines()
items = [line.split() for line in lines]
SECTION_START = {}
for section, page in items:
    SECTION_START[section] = int(page)
SECTION_END = {}
for i in range(len(lines) - 1):
    SECTION_END[items[i][0]] = int(items[i + 1][1])
SECTION_END["7-1"] = LAST_PAGE  # last page


def normalize_section_name(s):
    "XX-YY -> X-Y"
    return "-".join(str(x) for x in [int(x) for x in s.split("-")])


def remove_palen(s):
    "`AAA (BBB)` -> `AAA`"
    return k.split("(")[0].strip()


def remove_quotation(s):
    s = s.replace('"', "")  # remove quotation
    s = s.replace("\u201c", "")  # remove quotation
    s = s.replace("\u201d", "")  # remove quotation
    return s


CSV_FILE = "Plurality Book Indexing Exercise - Candidates.csv"
# This will get the absolute path of the current script file.
script_directory = os.path.dirname(os.path.abspath(__file__))

# keywords which should avoid mechine search, such as `X`(Twitter) or `her`(Movie name)
ignore_file = os.path.join(script_directory, "ignore.txt")
IGNORE = open(ignore_file).read().strip().splitlines()
# TODO: need to pick page-number by hand because it is not searched automatically

# keywords which should case sensitive and word boundary sensitive, such as `BERT`, `ROC`, `UN`
ignore_file = os.path.join(script_directory, "case_sensitive.txt")
CASE_SENSITIVE = open(ignore_file).read().strip().splitlines()

# List the contents of the target directory.
_pages = json.load(open(os.path.join(script_directory, "book.json")))
pages = {}
pages_lower = {}
for _p in _pages:
    p = int(_p) - SKIP
    if p < 1:
        continue
    pages[p] = _pages[_p]
    pages_lower[p] = _pages[_p].lower()

# load human-picked keywords and its position
lines = open(os.path.join(script_directory, CSV_FILE)).readlines()[1:]
keywords = set()
keyword_recorded_by_human = defaultdict(set)
for row in csv.reader(lines):
    k = row[1]
    k = remove_quotation(k)
    keywords.add(k)
    keyword_recorded_by_human[k].add(normalize_section_name(row[2]))


# load in-index(one) to in-text(many) mapping
index_text_mapping = json.load(
    open(os.path.join(script_directory, "inindex_intext_mapping.json"))
)
reverse_index_text_mapping = {}
for k, vs in index_text_mapping.items():
    for v in vs:
        reverse_index_text_mapping[v] = k

keywords.union(reverse_index_text_mapping)


def filter_pages(pages):
    """
    Filter pages which are not in the section which human specified.
    """
    mask = [0] * (LAST_PAGE + 1)
    for section in keyword_recorded_by_human[k]:
        for p in range(SECTION_START[section], SECTION_END[section]):
            mask[p] = 1

    return list(filter(lambda x: mask[x], pages))


# find keyword occurence in other sections
keyword_occurence = defaultdict(list)
section_occurence = defaultdict(int)
for k in keywords:
    # find occurence in other sections
    if k in IGNORE:
        continue

    for p in pages:
        # if not mask[p]:
        #     continue
        if k in CASE_SENSITIVE:
            if k in pages[p]:
                keyword_occurence[k].append(p)
                section_occurence[p] += 1
        else:
            if k.lower() in pages_lower[p]:
                keyword_occurence[k].append(p)
                section_occurence[p] += 1
                continue
            if "(" in k:
                # if keywords looks `AAA (BBB)` style, use occurrence of `AAA` instead
                k2 = remove_palen(k)
                if not k2 or k2 in IGNORE:
                    continue
                if k2.lower() in pages[p]:
                    keyword_occurence[k].append(p)
                    section_occurence[p] += 1
                    continue

    if len(keyword_occurence[k]) > 5:
        keyword_occurence[k] = filter_pages(keyword_occurence[k])

section_to_no_occurence = defaultdict(list)
with open(os.path.join(script_directory, "no_occurence.txt"), "w") as warn_no_occurence:
    print("Keywords\tSections", file=warn_no_occurence)
    for k in sorted(keywords):
        if not keyword_occurence[k] and k not in IGNORE:
            sections = ", ".join(sorted(keyword_recorded_by_human[k]))
            print(f"{k}\t{sections}", file=warn_no_occurence)
            for s in keyword_recorded_by_human[k]:
                section_to_no_occurence[s].append(k)


with open(os.path.join(script_directory, "section_to_no_occurence.txt"), "w") as f:
    for s in sorted(section_to_no_occurence):
        print(f"### {s}", file=f)
        for k in sorted(section_to_no_occurence[s]):
            print(f"- {k}", file=f)
        print(file=f)

# keyword_occurrence.tsv is now a debug output
too_many_occurrence = []
with open(os.path.join(script_directory, "keyword_occurrence.tsv"), "w") as f:
    print(f"Keywords\tPages", file=f)

    for k in sorted(keyword_occurence, key=lambda x: (x.lower(), x)):
        occ = []
        prev = -999
        for p in sorted(keyword_occurence[k]):
            if p != prev + 1 and p != prev + 2:  # ignore continuous pages (see README)
                occ.append(p)
            prev = p
        occ_str = ", ".join(str(p) for p in occ)

        print(f"{k}\t{occ_str}", file=f)

        if len(occ) >= 5:
            human = ", ".join(sorted(keyword_recorded_by_human[k]))
            too_many_occurrence.append((len(keyword_occurence[k]), k, human, occ_str))

# in-index representation
index_items = defaultdict(set)
for k in keyword_occurence:
    occ = keyword_occurence[k]
    if k in reverse_index_text_mapping:
        k = reverse_index_text_mapping[k]
    # merge multiple in-text expression into one in-index expression
    if (
        k[0] == PLURALITY
    ):  # hacky sort-order control. This spaces will be trimmed when output
        k = " " + k
    elif k == "數位":
        k = "  " + k
    index_items[k].update(occ)

with open(os.path.join(script_directory, "index.txt"), "w") as f:
    for k in sorted(index_items, key=lambda x: (x.lower(), x)):
        occ = []
        prev = -999
        for p in sorted(index_items[k]):
            if p != prev + 1 and p != prev + 2:  # ignore continuous pages (see README)
                occ.append(p)
            prev = p
        occ_str = ", ".join(str(p) for p in occ)
        k = k.strip()
        print(f"{k}\t{occ_str}", file=f)


too_many_occurrence.sort(reverse=True)
with open(os.path.join(script_directory, "too_many_occurrence.tsv"), "w") as f:
    print(f"Keywords\tSection(by Human)\tSection(by Script)", file=f)
    for num, k, human, occ in too_many_occurrence:
        print(f"{k}\t{human}\t{occ}", file=f)

if 0:  # Merge with Claude 3 Opus information
    claude_data = json.load(open("claude.json"))
    for k in claude_data:
        if k in keyword_occurence and claude_data[k] == "NaN":
            del keyword_occurence[k]
        elif claude_data[k] == "NaN":
            continue
        else:
            keyword_occurence[k].append(int(claude_data[k]))

    with open(os.path.join(script_directory, "index_with_claude.tsv"), "w") as f:
        print(f"Keywords\tPages", file=f)

        for k in sorted(keyword_occurence, key=lambda x: (x.lower(), x)):
            occ = []
            prev = -999
            for p in sorted(keyword_occurence[k]):
                if (
                    p != prev + 1 and p != prev + 2
                ):  # ignore continuous pages (see README)
                    occ.append(p)
                prev = p
            occ_str = ", ".join(str(p) for p in occ)
            if k in view_mapping:
                k = view_mapping[k]
            k = k.replace('"', "")  # care mulformed TSV such as `Diversity of "groups"`

            print(f"{k}\t{occ_str}", file=f)

            if len(occ) >= 5:
                human = ", ".join(sorted(keyword_recorded_by_human[k]))
                k = k.replace(
                    '"', ""
                )  # care mulformed TSV such as `Diversity of "groups"`
                too_many_occurrence.append(
                    (len(keyword_occurence[k]), k, human, occ_str)
                )

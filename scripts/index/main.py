"""
Convert CSV from Google Spreadsheet into more useful format
"""

import os
import re
import csv
from collections import defaultdict


def normalize_section_name(s):
    "XX-YY -> X-Y"
    return "-".join(str(x) for x in [int(x) for x in s.split("-")])


def remove_palen(s):
    "`AAA (BBB)` -> `AAA`"
    return k.split("(")[0].strip()


CSV_FILE = "Plurality Book Indexing Exercise - Main.csv"
# This will get the absolute path of the current script file.
script_directory = os.path.dirname(os.path.abspath(__file__))

# Construct the path to the target directory relative to the script file.
# This moves up two levels from the script's directory and then into the "contents/english" directory.
target_directory = os.path.join(script_directory, "..", "..", "contents", "english")

# keywords which should avoid mechine search, such as `X`(Twitter) or `her`(Movie name)
ignore_file = os.path.join(script_directory, "ignore.txt")
IGNORE = open(ignore_file).read().strip().splitlines()

# keywords which should case sensitive and word boundary sensitive, such as `BERT`, `ROC`, `UN`
ignore_file = os.path.join(script_directory, "case_sensitive.txt")
CASE_SENSITIVE = open(ignore_file).read().strip().splitlines()

# List the contents of the target directory.
sections = os.listdir(target_directory)
sections.remove("Plurality Book Ownership List.md")

section_contents = {}
section_contents_lower = {}
for filename in sections:
    section = re.match("(\d-\d|\d)-", filename).groups()[0]
    content = open(os.path.join(target_directory, filename)).read()
    section_contents[section] = content
    section_contents_lower[section] = content.lower()

lines = open(os.path.join(script_directory, CSV_FILE)).readlines()[1:]
poc_count = defaultdict(int)
keywords = set()
keyword_recorded_by_human = defaultdict(set)
for row in csv.reader(lines):
    keywords.add(row[1])
    keyword_recorded_by_human[row[1]].add(normalize_section_name(row[2]))
    poc_count[row[3]] += 1


# detect similar words
similar_keywords = defaultdict(set)
for k in keywords:
    similar_keywords[k.lower()].add(k)
    if "(" in k:
        k2 = remove_palen(k)
        if k2 != "":
            similar_keywords[k2.lower()].add(k)


with open(os.path.join(script_directory, "similar_words.tsv"), "w") as f:
    for k in similar_keywords:
        if len(similar_keywords[k]) > 1:  # has multiple presentatin
            print(similar_keywords[k], file=f)


# output contributors
with open(os.path.join(script_directory, "contributors.tsv"), "w") as f:
    for name in sorted(poc_count):
        print(f"{name}\t{poc_count[name]}", file=f)


# find keyword occurence in other sections
keyword_occurence = defaultdict(list)
section_occurence = defaultdict(int)
for k in keywords:
    # find occurence in other sections
    if k in IGNORE:
        continue

    for section in section_contents:
        if k in CASE_SENSITIVE:
            if k in section_contents[section]:
                keyword_occurence[k].append(section)
                section_occurence[section] += 1
        else:
            if k.lower() in section_contents_lower[section]:
                keyword_occurence[k].append(section)
                section_occurence[section] += 1
            elif "(" in k:
                # if keywords looks `AAA (BBB)` style, use occurrence of `AAA` instead
                k2 = remove_palen(k)
                if not k2 or k2 in IGNORE:
                    continue
                if k2.lower() in section_contents[section]:
                    keyword_occurence[k].append(section)
                    section_occurence[section] += 1


with open(os.path.join(script_directory, "no_occurence.txt"), "w") as warn_no_occurence:
    print("Keywords\tSections", file=warn_no_occurence)
    for k in sorted(keywords):
        if not keyword_occurence[k] and k not in IGNORE:
            sections = ", ".join(keyword_recorded_by_human[k])
            print(f"{k}\t{sections}", file=warn_no_occurence)


with open(os.path.join(script_directory, "keyword_occurrence.tsv"), "w") as f:
    print(f"Keywords\tSection(by Human)\tSection(by Script)", file=f)

    for k in sorted(keyword_occurence, key=lambda x: x.lower()):
        human = ", ".join(sorted(keyword_recorded_by_human[k]))
        occ = ", ".join(sorted(keyword_occurence[k]))
        k = k.replace('"', "")  # care mulformed TSV such as `Diversity of "groups"`
        print(f"{k}\t{human}\t{occ}", file=f)


with open(os.path.join(script_directory, "section_occurrence.tsv"), "w") as f:
    print(f"section\tcount\tcount per 10k chars", file=f)
    for sec in sorted(section_occurence):
        ratio = int(10000 * section_occurence[sec] / len(section_contents[sec]))
        print(f"{sec}\t{section_occurence[sec]}\t{ratio}", file=f)


with open(os.path.join(script_directory, "too_many_occurrence.tsv"), "w") as f:
    print(f"Keywords\tSection(by Human)\tSection(by Script)", file=f)
    for k in sorted(keyword_occurence, key=lambda x: x.lower()):
        if len(keyword_occurence[k]) >= 5:
            human = ", ".join(sorted(keyword_recorded_by_human[k]))
            occ = ", ".join(sorted(keyword_occurence[k]))
            k = k.replace('"', "")  # care mulformed TSV such as `Diversity of "groups"`
            print(f"{k}\t{human}\t{occ}", file=f)

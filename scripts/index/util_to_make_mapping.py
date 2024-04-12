"""
utility script to make one-to-one mapping
"""

import json

# in-text in-index one-to-one
data = """
Kenneth Arrow
Arrow, Kenneth
Kaliya Young
Young, Kaliya
"""

lines = data.strip().splitlines()
dict = {}
for i in range(0, len(lines), 2):
    dict[lines[i + 1]] = [lines[i]]

json.dump(dict, open("tmp.json", "w"), indent=2)

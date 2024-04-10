"""
Read View.csv and make mappings
"""

import csv


def read_view_mapping(file_path="View.csv"):
    # Initialize an empty list to hold the converted data
    data = {}

    # Open the CSV file for reading
    with open(file_path, mode="r", encoding="utf-8") as csv_file:
        # Use csv.DictReader to read the file. The first line of the CSV will be treated as the column names.
        csv_reader = csv.reader(csv_file)
        # skip 2 rows
        next(csv_reader)
        next(csv_reader)
        # Iterate over each row in the CSV
        for row in csv_reader:
            # Convert each row into a dictionary, and append it to our data list
            in_text = row[1].replace('"', "")  # remove quotation
            data[in_text] = row[2]

    return data


view_mapping = read_view_mapping()
view_reverse_mapping = {}
for k, v in view_mapping.items():
    view_reverse_mapping[v] = k

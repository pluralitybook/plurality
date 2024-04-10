"""
prerequisites:
$ pip install PyMuPDF
"""

import fitz  # Import the PyMuPDF library
import json

pdf_path = "in.pdf"

# Open the provided PDF file
doc = fitz.open(pdf_path)

data = {}
# Loop through each page of the PDF
for page_num in range(len(doc)):
    page = doc.load_page(page_num)  # Load the current page
    text = page.get_text()  # Extract text from the current page

    # # Create a text file for the current page
    # with open(f"page_{page_num + 1}.txt", "w") as text_file:
    #     text_file.write(text)  # Write the extracted text to the file

    text = text.replace("-\n", "")  # remove hyphenation

    text = text.replace("\u201c", "")  # remove quotation
    text = text.replace("\u201d", "")
    text = text.replace('"', "")

    # replace newlines with spaces (sometimes there are spaces
    text = text.replace(" \n", " ")
    text = text.replace("\n ", " ")
    text = text.replace("\n", " ")
    data[page_num + 1] = text

# Close the PDF document
doc.close()

json.dump(data, open("book.json", "w"), indent=2)

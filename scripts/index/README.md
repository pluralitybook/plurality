# Making Indexes

## second step (4/9~)
- `in.pdf`: input PDF, currently I used the latest PDF from Sharepoint 4/10 11:30 JST (in previous version it was `release/latest` on 4/9 14:42 JST)
- `from_pdf.py`: read PDF `in.pdf` and output JSON `book.json`
- `main.py`: output keywords to page numbers into `keyword_occurrence.tsv`


### memo
- Removed keywords "not found" in "NotFound.csv". those are once added by human, not found by machine and then not found by additional human eyes.
- Tried to remove space after ⿻, but it won't improve outputs.
- For example, "Advanced Research Projects Agency" is recorded as in 2-0, but in the latest PDF, it found in 3-3. Searching only within the specified section, as chosen by the user, should not be the default behavior; it should be limited to cases where there are too many hits.
- For example, "Parliament of Things" is in text but not hit. It is because the new line with spaces causes extra space like: "Parliament of  Things". This fix resulted in a decrease in the number of "not found" keywords from 242 to 79.
- In PDF, quotation `"..."` sometimes converted to `\u201...\u201d` (not all time). I removed quotation before matching. 

## first step (~3/26)
- `Plurality Book Indexing Exercise - Main.csv`: raw file exported from [Spreadsheet](https://docs.google.com/spreadsheets/d/1gmyjFbErt_CW8-qLKChSpciLlCDGUhLriYFov0HO3qA/edit#gid=0)
- `step1.py`: output POC count, occurence of each keywords in each sections, and the count of occurences
- `ignore.txt`: keywords which should avoid mechine search
- `case_sensitive.txt`: keywords which should case-sensitive search (e.g. `ROC`, `BERT`, `UN`)

### output
- `contributors.tsv`: number of contribution on the spreadsheet
- `1_keyword_occurrence.tsv`: occurrence of each keywords in each sections (renamed to `1_*` to avoid overwrite)
- `1_no_occurence.txt`: Keywords which does not occur in the contents.
- `1_too_many_occurrence.tsv`: Keywords which occur in more than 5 sections.
- `section_occurrence.tsv`: number of occurrences in each sections of any keywords. It is to find less-covered sections.
- `similar_keywords.txt`: Output if there are keywords like `Neural network` and `Neural Network`.

### memo

- At least, we need special care for the movie name "her".
- cFQ or cFQ2f7LRuLYP is GithubID: dedededalus. ref: https://github.com/dedededalus
- no_occurence: Some looks mistake (e.g. `W. Mitchell Waldrop` does not occur but `M. Mitchell Waldrop` occurs), some may because of acronym in palens (e.g. `Distributed Ledger Technology (DLT)`)
- Changed `Universal Record Locator` to `Uniform Resource Locator`, and fixed `W. Mitchell Waldrop`.
- Fix some upper/lower diversity (e.g. `Virtual Reality` and `Virtual reality`)
- Keywords with acronym such as `Artificial Intelligence (AI)`: If it does not occerred, remove after palens and search again.
- Keywords with quotes such as `Diversity of "groups"`: remove quotes
- `keyword_occurrence.tsv`: Output "by human" keywords and "by script" keywords on the different columns
- Fix bug: I ignored `X` derived from `X (formerly Twitter)` but the comparison was done after lower().
- `the ancient concept of 'dao.'` in section 4-5 and `Distributed Autonomous Organizations (DAOs)` are distinct concepts, so I've decided not to merge them. I'll leave a note of this in the final version of the index for attention.
- `Physical (paper or plastic) Government-issued IDs` is in manuscript but in index it should be `Physical Government-issued IDs`, currently added in ignore list
- `Open-source software (OSS)` in 4-3 should be `Open Source Software (OSS)` as in other sections, but the manuscript is freezed, so I keep it as is. Need care on the index.
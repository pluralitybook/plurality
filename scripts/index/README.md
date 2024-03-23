# Making Indexes

- `Plurality Book Indexing Exercise - Main.csv`: raw file exported from [Spreadsheet](https://docs.google.com/spreadsheets/d/1gmyjFbErt_CW8-qLKChSpciLlCDGUhLriYFov0HO3qA/edit#gid=0)
- `main.py`: output POC count, occurence of each keywords in each sections, and the count of occurences 

## output
- `contributors.tsv`: number of contribution on the spreadsheet
- `keyword_occurrence.tsv`: occurrence of each keywords in each sections
- `section_occurrence.tsv`: number of occurrences in each sections of any keywords. It is to find less-covered sections.
- `no_occurence.txt`: Keywords which does not occur in the contents.
- `too_many_occurrence.tsv`: Keywords which occur in more than 5 sections.
- `similar_keywords.txt`: Output if there are keywords like `Neural network` and `Neural Network`.


## memo

- At least, we need special care for the movie name "her".
- cFQ or cFQ2f7LRuLYP is GithubID: dedededalus. ref: https://github.com/dedededalus
- no_occurence: Some looks mistake (e.g. `W. Mitchell Waldrop` does not occur but `M. Mitchell Waldrop` occurs), some may because of acronym in palens (e.g. `Distributed Ledger Technology (DLT)`)
- Changed `Universal Record Locator` to `Uniform Resource Locator`, and fixed `W. Mitchell Waldrop`.
- Fix some upper/lower diversity (e.g. `Virtual Reality` and `Virtual reality`)
- Keywords with acronym such as `Artificial Intelligence (AI)`: If it does not occerred, remove after palens and search again.
- Keywords with quotes such as `Diversity of "groups"`: remove quotes
- `keyword_occurrence.tsv`: Output "by human" keywords and "by script" keywords on the different columns
- Fix bug: I ignored `X` derived from `X (formerly Twitter)` but the comparison was done after lower().
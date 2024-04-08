---
title: Style guide for ⿻數位 Plurality
---

# Style guide for ⿻數位 Plurality

This article provides stylistic guidance for contributors who are in the process of adding content to *⿻數位 Plurality*.  

If you are new to the project and would like to learn how to contribute, you can start learning [here](Getting started as a contributor).

## Book structure

*⿻數位 Plurality* is broken up into different components which are referred to as *Parts*, *Chapters*, *Sections*, and occasional *Subsections*.

These components are indicated in the markdown file name, within the markdown file itself, or both.

### Parts

Parts divide the content of ⿻數位 Plurality into sections of broadly connected concepts and ideas. The aim of Parts is to guide readers into the content that aligns most with their particular interests. There are currently 7 Parts.

In the Markdown file name, the first number indicates the Part, starting at 0.

*Example*:

> **6**-2-health

Parts are not indicated within the contents of the markdown file.

### Chapters

Chapters are found within Parts. Chapters are used to break down Parts into a specific set of related ideas or concepts.

For example, *Part 6* might be interesting for a reader who would like to learn more about how Plurality impacts the real-world in specific social sectors. *Part 6, Chapter 2* will then focus in on the health sector.

The second number in the markdown file name indicates the Chapter number, starting at 0. The text following the number indicates the chapter name. Each single markdown file is one Chapter.  

*Example*:

> 6-**2**-**health**

The Chapter title can also be found within the markdown file content, usually at the very top of the file, and is set off by a single "#".

### Sections

Sections are found within Chapters. They are used to provide structure to a chapter, and to focus the readers attention to a specific idea.

For example: In *6-2-health*, there is a section  on "Reimagining Health Insurance"

The Section title can be found within a markdown file, somewhere below a Chapter, and is set off by a triple "###".

### Subsections

Subsections provide greater structure to a Chapter when required. The use of subsections should generally be avoided except when absolutely necessary.

The subsection title can be found within a makrdown file, somewhere below a Section, and is set off by a quadrupule "####".

### Divisions

Chapters in Parts 2-7 all begin with some sort of introductory material before the main substances of the chapter.

The introductory material is homogeneous in a Part and varies across Parts (e.g. Part 4 chapters all begin with an illustration of a currently deployed technology illustrating the idea of the chapter).

Introductory material should be separated from the rest of the text with `---`.

## Punctuation and grammar

### Capitalization

Chapter titles are fully capitalized; only the first letter of Sections are titled.

### Commas

We use Oxford commas.

### Justification

Paragraphs are not indented.

## Figures

This article provides information on figure style recommendations. For information on how to add a figure to ⿻數位 Plurality, see [Contributing figures](Contributing figures.md).

If you have any questions about a figure that you would like to add, visit the discord and ask your question in the [#data](https://discord.com/channels/1133444567031627846/1212804858457890927) channel.

### Figure syntax

Figures are added as [HTML syntax](https://www.w3schools.com/html/html_images.asp) to markdown files. Figures should include the following:

* A ```<figure>``` tag
* An ```<img>``` tag
* The image source
* The image width which should be set to 100%
* An ```<alt>``` tag that describes the image
* A ```<figcaption>``` tag that indicates which chapter the figure is in, and assigns a letter to indicate the order in which the figure appears in a chapter (e.g. the first image in 2-0 would have the caption Fig 2-0-A)

If a figure is referred to within a chapter, the reference should only use the letter of the figures caption (e.g. "Figure A shows...")

Below is an example of the HTML syntax required for figure:

```
<figure>
    <img src="https://raw.githubusercontent.com/pluralitybook/plurality/main/figs/private.png" width="100%" alt="A plot showing the growth of private investment in AI over time.">
    <figcaption>Figure 2-0-A The rise in private sector AI investment over time.  Source: NetBase Quid/Stanford Center on Human-Centered AI .</figcaption>
</figure>
```

### Figure style

Figures should have:
* A white background 
* Black text/gridlines/etc.

The preferred font is [Jost](https://fonts.google.com/specimen/Jost). 

Colours should be converted to grayscale. The recommended grayscale colours are:

```python
BLACK = '#222222'
GRAY1 = '#5C5C5C'
GRAY2 = '#ADADAD'
GRAY3 = '#DEDEDE'
WHITE = '#FFFFFF'
```
The resolution, number of pixels, and print size of figures are related mathematically.
Pixels = Resolution (DPI) × Print size (in inches). 

Figures should have at least 300 [DPI](https://en.wikipedia.org/wiki/Dots_per_inch) and should try to meet the following sizing guidelines:

| Size | Image Width | @ 300 DPI | @ 500 DPI |
| :--- | :---------- | :-------- | :-------- |
| Small | 90 mm, 3.54 in | 1063 px | 1772 px |
| Medium | 140 mm, 5.51 in | 1654 px | 2756 px |
| Large | 190 mm, 7.48 in | 2244 px | 3740 px |

## Citations and referencing

This article provides information on citation style recommendations. For information on how to add a citations to ⿻數位 Plurality, see [Contributing citations](docs/Contributing citations.md).

The book currently uses the Chicago Manual of Style for citations. For more information and examples citating using on the Chicago Manual of style, see [The Chicago Manual of Style](https://www.chicagomanualofstyle.org/tools_citationguide/citation-guide-1.html).

### Citing a book

FirstName LastName, *Book Title* (City, State of publication: Publisher, Publication year), page number(s) if a direct quote.

*Example*:

> Zadie Smith, *Swing Time* (New York: Penguin Press, 2016), 315–16.

### Citing a journal article

FirstName LastName, “Article Title,” *Journal Title* volume number, issue number (Publication Year): page numbers, link or DOI if available.

*Example*:

> Shao-Hsun Keng, Chun-Hung Lin, and Peter F. Orazem, “Expanding College Access in Taiwan, 1978–2014: Effects on Graduate Quality and Income Inequality,” *Journal of Human Capital* 11, no. 1 (Spring 2017): 9–10, [https://doi.org/10.1086/690235](https://doi.org/10.1086/690235).

### Citing a news or magazine article

FirstName LastName, “Article Title,” *Publication Title*, Month Day, Year. Include URL if available.

*Example*:

> Rebecca Mead, “The Prophet of Dystopia,” New Yorker, April 17, 2017.

### Citing a blog post

FirstName LastName, “Blog Post Title,” *Blog Title*, Month Day, Year, link.

*Example*:

> Deb Amlen, “One Who Gives a Hoot,” *Wordplay*, January 26, 2015, [http://wordplay.blogs.nytimes.com/2015/01/26/one-who-gives-a-hoot/](http://wordplay.blogs.nytimes.com/2015/01/26/one-who-gives-a-hoot/).

### Citing website content

“Page Title,” Company, last modified Month Day, Year, link.

*Example*: 

> "Privacy Policy", Privacy & Term", Google, last modified April 17, 2017, [https://www.google.com/policies/privacy/](https://www.google.com/policies/privacy/).

### Internal referencing

When referencing Parts, Chapters, or Sections, use their titles in quotes.

*Example*:

> * In the Part of the book on 'Freedom'
> * In our Chapter 'The Lost Dao'

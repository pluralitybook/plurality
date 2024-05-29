---
title: Style guide figures
author:
date: 
tags:
  - 
---

# Figures

> Work in progress

---

If you have any questions about a figure that you would like to add, visit the discord and ask your question in the [#data](https://discord.com/channels/1133444567031627846/1212804858457890927) channel.

## Figure syntax

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

## Figure style

Figures should be styled in the following way:

* A white background 
* Black text/gridlines/etc.
* The preferred font is [Jost](https://fonts.google.com/specimen/Jost). 
* Colours should be converted to grayscale. The recommended grayscale colours are:
```python
	BLACK = '#222222'
	GRAY1 = '#5C5C5C'
	GRAY2 = '#ADADAD'
	GRAY3 = '#DEDEDE'
	WHITE = '#FFFFFF'
```
* The resolution, number of pixels, and print size of figures are related mathematically:
```
Pixels = Resolution (DPI) × Print size (in inches). 
```
* Figures should have at least 300 [DPI](https://en.wikipedia.org/wiki/Dots_per_inch) and should try to meet the following sizing guidelines:
| Size   | Image Width     | @ 300 DPI | @ 500 DPI |
| :----- | :-------------- | :-------- | :-------- |
| Small  | 90 mm, 3.54 in  | 1063 px   | 1772 px   |
| Medium | 140 mm, 5.51 in | 1654 px   | 2756 px   |
| Large  | 190 mm, 7.48 in | 2244 px   | 3740 px   |
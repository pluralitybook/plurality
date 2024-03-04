# Figures: data and formatting standards

## Data

Every figure in the book should have its own subdirectory in `data/`. The subdirectory should contain a copy of the data used to generate the figure (in CSV format). It should also contain a readme file citing the source of the data and explaining any steps taken to transfer or analyze the data.

## Formatting

Figures should have a white background and black text, gridlines, etc.

The preferred font is [Jost](https://fonts.google.com/specimen/Jost). 

Colors are grayscale and are also defined in the `style` module. The following colors are defined:

```python
BLACK = '#222222'
GRAY1 = '#5C5C5C'
GRAY2 = '#ADADAD'
GRAY3 = '#DEDEDE'
WHITE = '#FFFFFF'
```

The resolution, number of pixels, and print size of figures are related mathematically.
Pixels = Resolution (DPI) × Print size (in inches). Figures should have at least 300 DPI and try to meet the following sizing guidelines:

| Size | Image Width | @ 300 DPI | @ 500 DPI |
| :--- | :---------- | :-------- | :-------- |
| Small | 90 mm, 3.54 in | 1063 px | 1772 px |
| Medium | 140 mm, 5.51 in | 1654 px | 2756 px |
| Large | 190 mm, 7.48 in | 2244 px | 3740 px |

## Style module

The `style` module contains the color definitions and a function to set the style of the figures. The function is called `prep_plot` and it takes several optional fig size, font and DPI rgements. It sets the background color, the color of the axes, the color of the gridlines, and the color of the ticks. It also sets the font to Jost and applies the default color scheme.

To use the `style` module in a figure, import it and call the `prep_plot` function at the beginning of the script. For example:

```python
import matplotlib.pyplot as plt
import sys
sys.path.append('../_styling/')
from style import prep_plot
plt = prep_plot()
```

Then you add render your plot as usual. For example:

```python
plt = prep_plot()
plt.plot(xs, ys, lw=1)
```

Or via subplots:

```python
plt = prep_plot()
fig, axes = plt.subplots(nrows=1, ncols=2, gridspec_kw={'width_ratios': [1.5, 1]})
```

## Contributing

To contibute, join the Plurality Book Discord server and post your question in the #data channel.
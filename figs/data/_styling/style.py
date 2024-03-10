
import matplotlib.pyplot as plt
from matplotlib import font_manager
import os

# colors
BLACK = '#222222'
GRAY1 = '#5C5C5C'
GRAY2 = '#ADADAD'
GRAY3 = '#DEDEDE'
WHITE = '#FFFFFF'

# figure widths
SMALL = 3.54
LARGE = 5.51
LARGE = 7.48
DPI = 500

# font
FONT_DIR = os.path.join(os.path.dirname(__file__), 'Jost/')


# add a custom font from the project directory
def add_font(font_path=FONT_DIR):
    font_dirs = [font_path]
    font_files = font_manager.findSystemFonts(fontpaths=font_dirs)
    for font_file in font_files:
        font_manager.fontManager.addfont(font_file)


# set the styling of a generic plot for the book
def prep_plot(font='Jost', fig_width=LARGE, fig_height=LARGE/2.5, dpi=DPI):

    add_font()
    plt.rcParams['font.family'] = font
    
    plt.rcParams['figure.figsize'] = [fig_width, fig_height]
    plt.rcParams['figure.dpi'] = dpi

    plt.rcParams['figure.facecolor'] = WHITE
    plt.rcParams['text.color'] = BLACK
    plt.rcParams['axes.labelcolor'] = BLACK
    plt.rcParams['xtick.color'] = BLACK
    plt.rcParams['ytick.color'] = BLACK

    plt.rcParams['axes.spines.right'] = False
    plt.rcParams['axes.spines.top'] = False
    plt.rcParams['axes.grid'] = False

    plt.tight_layout()
    return plt
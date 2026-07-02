#!/usr/bin/env perl
use utf8;
use strict;
use FindBin '$RealBin';
use Encode;
use POSIX qw(strftime);
use JSON::PP;

chdir "$RealBin/..";

# Get current date
my $current_date = strftime "%Y-%m-%d", localtime;

# Header with dynamic date
my $all = << "HEADER";
---
title: Plurality
subtitle: "The Future of Collaborative Technology and Democracy"
author: "E. Glen Weyl, Audrey Tang and ⿻ Community"
date: "$current_date"
lang: en
cover-image: scripts/cover-image.png 
mainfont: "Noto Serif"
linestretch: 1.25
---
HEADER

$all .= (read_file($_) =~ s/^#+\s+(.+)/\n**$1**/rg). "\n\n" for glob("contents/english/0-[13]-*.md");

# Generate credits from canonical JSON source (pluralitybook/plurality.net credits.json)
{
    my $credits = JSON::PP->new->decode(read_file('scripts/credits.json'));
    my $cats = $credits->{categories};
    my $cat_names = $credits->{i18n}{en}{categories};

    # LaTeX block for PDF
    my $tex = "\n```{=latex}\n\\interfootnotelinepenalty=10000\n\\begin{center}\n\n";
    for my $ci (0 .. $#$cats) {
        my $cat = $cats->[$ci];
        my $label = $cat_names->{$cat->{name}} // $cat->{name};
        $tex .= "\\textbf{$label}\\\\[6pt]\n";
        my @c = @{$cat->{contributors}};
        for my $ni (0 .. $#c) {
            my ($name, $pt) = @{$c[$ni]}{qw(name pt)};
            my $bl = sprintf("%.1f", $pt * 1.2);
            my $end = ($ni == $#c) ? ($ci < $#$cats ? "\\\\[16pt]" : "") : "\\\\";
            $tex .= "{\\fontsize{${pt}pt}{${bl}pt}\\selectfont ${name}${end}}\n";
        }
    }
    $tex .= "\n\\end{center}\n```\n";

    # HTML block for ePub
    my $html = "\n```{=html}\n<div style=\"text-align: center\">\n";
    for my $ci (0 .. $#$cats) {
        my $cat = $cats->[$ci];
        my $label = $cat_names->{$cat->{name}} // $cat->{name};
        $html .= "<p style=\"margin-top: 16pt\"><strong>$label</strong></p>\n" if $ci > 0;
        $html .= "<p><strong>$label</strong></p>\n" if $ci == 0;
        for my $c (@{$cat->{contributors}}) {
            $html .= "<p style=\"font-size: $c->{pt}pt; margin: 2pt 0\">$c->{name}</p>\n";
        }
    }
    $html .= "</div>\n```\n\n";

    $all .= $tex . $html;
}

sub read_file {
    my $filename = shift;
    open my $fh, '<:utf8', $filename or die "Cannot open $filename: $!";
    my $content = do { local $/; <$fh> };
    return $content;
}

sub write_file {
    my $filename = shift;
    open my $fh, '>:utf8', $filename or die "Cannot open $filename: $!";
    print $fh @_;
}


sub markdown_img_alt {
    my ($alt) = @_;
    $alt =~ s/\\/\\\\/g;
    $alt =~ s/\[/\\[/g;
    $alt =~ s/\]/\\]/g;
    return $alt;
}

sub img_tag_to_markdown {
    my ($tag) = @_;
    my ( $src, $alt );
    if ( $tag =~ /\bsrc="([^"]+)"/ ) {
        $src = $1;
    }
    elsif ( $tag =~ /\bsrc='([^']+)'/ ) {
        $src = $1;
    }
    return $tag unless defined $src;
    if ( $tag =~ /\balt="([^"]*)"/ ) {
        $alt = $1;
    }
    elsif ( $tag =~ /\balt='([^']*)'/ ) {
        $alt = $1;
    }
    $alt = 'figure' unless defined $alt && length $alt;
    $alt = markdown_img_alt($alt);
    return "![$alt]($src){ width=100% }";
}

my %Sections = (
    1 => "Section 1: Preface",
    2 => "Section 2: Introduction",
    3 => "Section 3: Plurality",
    4 => "Section 4: Freedom",
    5 => "Section 5: Democracy",
    6 => "Section 6: Impact",
    7 => "Section 7: Forward",
    0 => "Endorsements",
);
for (
    "contents/english/0-0-endorsements.md", 
    sort(<contents/english/[1234567]*.md>),
) {
    my $basename = s,.*/([-\d]+)-.*,$1,r;
    my $s = int($basename =~ s/-.*//r);
    if (my $section_name = delete $Sections{$s}) {
        $all .= "# $section_name\n\n";
    }

    my $c = read_file($_);
    Encode::_utf8_on($c);
    if ($s == 0) { $c =~ s/^(.*\n){6}//; $c =~ s/^> /---\n\n/mg; $c =~ s/^— /— /mg; $c =~ s!\s*<br></br>\s*!\n\n!g; $c .= "\n---\n"; $c =~ s/---\n\n// }
    $c =~ s/# /## $basename /;
    $c =~ s/^( +|&nbsp;)+//mg;
    $c =~ s,(\[\^)(.*?\]),$1$basename-$2,g;
    $c =~ s,!<br\s*/?>\s*</br>!,!,g;
    $c =~ s,!\[https?://[^\]]+\]\(([^)]+)\)(\{[^}]*\})?,![figure]($1)$2,g;
    $c =~ s,!\[image\]\(([^)]+)\),![Gitcoin screenshot]($1),g;
    $c =~ s{<img\b[^>]*>}{img_tag_to_markdown($&)}ge;
    $all .= "$c\n\n";
}

write_file('english.md', $all);

write_file(
    'pre.tex', (
	 map { read_file($_) =~ s/\*\*(.*?)\*\*/\\textbf{$1}/rg =~ s/^#+\s+(.+)/\\textbf{$1}/rg =~ s/&/\\&/rg =~ s/\[(.*?)\]\((.*?)\)/\\href{$2}{$1}/rg =~ s/ \*(.*?)\*/ \\emph{$1}/rg =~ s/(\#\w)/\\$1/rg }
             glob 'contents/english/0-2-*.md'
    )
);

print "Generating PDF (this may take a while)...\n";

# Pre-running twice to generate emoji PDFs
system << '.';
docker run --rm --volume "$(pwd):/data" audreyt/pandoc-plurality-book english.md -o tmp.tex --filter=/data/scripts/emoji_filter.js
docker run --rm --volume "$(pwd):/data" audreyt/pandoc-plurality-book english.md -o tmp.tex --filter=/data/scripts/emoji_filter.js
.

system << '.';
docker run --rm --volume "$(pwd):/data" --user $(id -u):$(id -g) audreyt/pandoc-plurality-book english.md -o tmp.pdf --include-in-header=/data/scripts/xelatex-preamble.tex --include-before-body=pre.tex --toc --toc-depth=2 -s --pdf-engine=xelatex -V CJKmainfont='Noto Sans CJK TC' -V fontsize=18pt -V documentclass=extreport -f markdown-implicit_figures --filter=/data/scripts/emoji_filter.js
.

system << '.';
docker run --entrypoint /usr/bin/pdftk --rm --volume "$(pwd):/data" --user $(id -u):$(id -g) audreyt/pandoc-plurality-book A=/data/tmp.pdf B=/data/scripts/cover-image.pdf cat B A2-end output /data/Plurality-english.pdf
.

print "Generating ePub (this should be fast)...\n";

system << '.';
docker run --rm --volume "$(pwd):/data" --user $(id -u):$(id -g) audreyt/pandoc-plurality-book english.md -o Plurality-english.epub --toc --toc-depth=2 -s -f markdown-implicit_figures --resource-path=/data --filter=/data/scripts/emoji_filter.js
.

unlink 'tmp.pdf';
unlink 'tmp.tex';
unlink 'pre.tex';

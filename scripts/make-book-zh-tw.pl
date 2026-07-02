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
title: 多元宇宙
subtitle: 協作技術與民主的未來
author: 衛谷倫、唐鳳、⿻社群
date: "$current_date"
lang: zh-TW
cover-image: scripts/cover-image.zh-tw.png 
linestretch: 1.25
---
HEADER

$all .= (read_file($_) =~ s/^#+\s+(.+)/\n**$1**/rg). "\n\n" for glob("contents/traditional-mandarin/0-[13]-*.md");

# Generate credits from canonical JSON source (pluralitybook/plurality.net credits.json)
{
    my $credits = JSON::PP->new->decode(read_file('scripts/credits.json'));
    my $cats = $credits->{categories};
    my $cat_names = $credits->{i18n}{zh}{categories};

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
    1 => "一、序章",
    2 => "二、導論",
    3 => "三、多元",
    4 => "四、自由",
    5 => "五、民主",
    6 => "六、影響",
    7 => "七、前行",
    0 => "名家推薦",
);
for (
    "contents/traditional-mandarin/0-0-名家推薦.md",
    sort(<contents/traditional-mandarin/[1234567]*.md>),
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
    $basename =~ s,-,_,g; $basename .= '_';
    $c =~ s/^( +|&nbsp;)+//mg;
    $c =~ s,(<(br|img)\b[^>]*)(?<!/)>,$1 />,g;
    $c =~ s,!<br\s*/?>\s*</br>!,!,g;
    $c =~ s,!\[https?://[^\]]+\]\(([^)]+)\)(\{[^}]*\})?,![figure]($1)$2,g;
    $c =~ s,!\[image\]\(([^)]+)\),![Gitcoin screenshot]($1),g;
    $c =~ s{<img\b[^>]*>}{img_tag_to_markdown($&)}ge;
    $c =~ s,(\[\^)(.*?\]),$1$basename-$2,g;
    $c =~ s,(^\s*\|?\s*(?:原文|作者|譯者)：.*\n)(^\s*\|?\s*(?:原文|作者|譯者)：.*\n|^\s*\n|^---\n)+,\n,mg;
    $all .= "$c\n\n";
}

write_file('traditional-mandarin.md', $all);

write_file(
    'pre.tex', (
	 map { read_file($_) =~ s/\*\*(.*?)\*\*/\\textbf{$1}/rg =~ s/^#+\s+(.+)/\\textbf{$1}/rg =~ s/&/\\&/rg =~ s/\[(.*?)\]\((.*?)\)/\\href{$2}{$1}/rg =~ s/ \*(.*?)\*/ \\emph{$1}/rg =~ s/(\#\w)/\\$1/rg }
             glob 'contents/traditional-mandarin/0-2-*.md'
    )
);


print "Generating PDF (this may take a while)...\n";

# Pre-running twice to generate emoji PDFs
system << '.';
docker run --rm --volume "$(pwd):/data" audreyt/pandoc-plurality-book traditional-mandarin.md -o tmp.tex --filter=/data/scripts/emoji_filter.js
docker run --rm --volume "$(pwd):/data" audreyt/pandoc-plurality-book traditional-mandarin.md -o tmp.tex --filter=/data/scripts/emoji_filter.js
.

system << '.';
docker run --rm --volume "$(pwd):/data" --user $(id -u):$(id -g) audreyt/pandoc-plurality-book traditional-mandarin.md -o tmp.pdf -M lang=en-US --include-in-header=/data/scripts/xelatex-preamble.tex --include-before-body=pre.tex --toc --toc-depth=2 -s --pdf-engine=xelatex -V CJKmainfont='Noto Sans CJK TC' -V fontsize=20pt -V documentclass=extreport -f markdown-implicit_figures --filter=/data/scripts/emoji_filter.js
.

system << '.';
docker run --entrypoint /usr/bin/pdftk --rm --volume "$(pwd):/data" --user $(id -u):$(id -g) audreyt/pandoc-plurality-book A=/data/tmp.pdf B=/data/scripts/cover-image.zh-tw.pdf cat B A2-end output /data/Plurality-traditional-mandarin.pdf
.

print "Generating ePub (this should be fast)...\n";

system << '.';
docker run --rm --volume "$(pwd):/data" --user $(id -u):$(id -g) audreyt/pandoc-plurality-book traditional-mandarin.md -o Plurality-traditional-mandarin.epub --toc --toc-depth=2 -s -f markdown-implicit_figures --resource-path=/data --css=/data/scripts/epub-cjk.css --filter=/data/scripts/emoji_filter.js
.

unlink 'tmp.pdf';
unlink 'tmp.tex';
unlink 'pre.tex';

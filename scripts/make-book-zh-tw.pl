#!/usr/bin/env perl
use utf8;
use strict;
use FindBin '$RealBin';
use Encode;
use POSIX qw(strftime);

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
cover-image: scripts/cover-image.zh-tw.png 
---
HEADER

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

my %Sections = (
    1 => "一、序章",
    2 => "二、導論",
    3 => "三、多元",
    4 => "四、自由",
    5 => "五、民主",
    6 => "六、影響",
    7 => "七、前行",
);
for (sort <contents/traditional-mandarin/0*.md>) {
    my $basename = s,.*/([-\d]+)-.*,$1,r;
    my $s = int($basename =~ s/-.*//r);
    if (my $section_name = delete $Sections{$s}) {
        $all .= "# $section_name\n\n";
    }

    my $c = read_file($_);
    Encode::_utf8_on($c);
    $c =~ s/# /## $basename /;
    $basename =~ s,-,_,g; $basename .= '_';
    $c =~ s/^( +|&nbsp;)+//mg;
    $c =~ s,(<(br|img)\b[^>]*)(?<!/)>,$1 />,g;
    $c =~ s,<img\b[^>]*src="([^"]+)"[^>]*>,![$1]($1){ width=100% },g;
    $c =~ s,(\[\^)(\d+\]),$1$basename$2,g;
    $c =~ s,(^\s*\|?\s*(?:原文|作者|譯者)：.*\n)(^\s*\|?\s*(?:原文|作者|譯者)：.*\n|^\s*\n|^---\n)+,\n,mg;
    $all .= "$c\n\n";
}

write_file('traditional-mandarin.md', $all);

print "Generating PDF (this may take a while)...\n";

system << '.';
docker run --rm --volume "$(pwd):/data" --user $(id -u):$(id -g) audreyt/pandoc-plurality-book traditional-mandarin.md -o Plurality-traditional-mandarin.pdf --toc --toc-depth=2 -s --pdf-engine=xelatex -V CJKmainfont='Noto Sans CJK TC' -V fontsize=20pt -V documentclass=extreport -f markdown-implicit_figures
.

print "Generating ePub (this should be fast)...\n";

system << '.';
docker run --rm --volume "$(pwd):/data" --user $(id -u):$(id -g) audreyt/pandoc-plurality-book traditional-mandarin.md -o Plurality-traditional-mandarin.epub --toc --toc-depth=2 -s
.

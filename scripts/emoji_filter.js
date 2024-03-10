#!/usr/bin/node

// Copyright [2020] [Miguel Angelo]
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

const pandoc = require("pandoc-filter")
const fs = require('fs')
const https = require('https')
const twemoji = require('twemoji')
const shell = require('shelljs')
const path = require('path')

function wait_debugger() {
	var hr=process.hrtime.bigint,f=wait_debugger,t
	while(!f._r){t=hr();debugger;if(hr()-t>100000000)f._r=true}
}

const inkscape_path = shell.which("inkscape").stdout.split("\n")[0].trim()

function imageSourceGenerator(icon, options) {
	return icon
}

function svg_to_pdf(src) {
	const full_target = path.join(process.cwd(), src.replace(/\.svg$/, ".pdf"))
	const full_src = path.join(process.cwd(), src)
	const cmd_line = `dbus-run-session "${inkscape_path}" --export-type=pdf "${full_target}" "${full_src}"`
	if (!fs.existsSync(full_target))
		shell.exec(cmd_line)
	return full_target
}

async function get_emoji(icon, source) {
	const cache_dir = process.env["SVG_FILTER_CACHE_DIR"] || ""
	var src, dirname
	if (source == "noto-emoji") {
		src = `https://raw.githubusercontent.com/googlefonts/noto-emoji/master/svg/emoji_u${icon}.svg`
		dirname = "noto-emoji"
	}
	else if (source == "twemoji") {
		src = `${twemoji.base}svg/${icon}.svg`
		dirname = "twemoji"
	}
	dirname = path.join(cache_dir, dirname)
	const filename = `${dirname}/${icon}.svg`
	if (!fs.existsSync(dirname))
		shell.mkdir('-p', dirname)
	if (!fs.existsSync(filename)) {
		const file = fs.createWriteStream(filename)
		await new Promise((resolve, reject) => {
			try {
				const request = https.get(src, function (response) {
					response.pipe(file)
					file.on('finish', () => {
						file.close();
						resolve()
					})
				})
			} catch (e) {
				reject(e)
			}
		})
	}
	return filename
}

async function replace_emojis(text, format, emoji_source, context) {

	var text_w_img = twemoji.parse(text, { callback: imageSourceGenerator })
	var split = text_w_img.split(/\<img class="emoji" draggable="false" alt="([^"]+)" src="([^"]+)"\/>/g)
	if (split.length == 1)
		return pandoc.Str(split[0])
	
	const result_array = []
	for (var it = 0; it < split.length; it += 3) {
		if (split[it] !== "") {
			result_array.push(pandoc.Str(split[it]))
		}
		if (it + 2 < split.length && split[it + 2] !== null) {
			const id = ""
			const classes = []
			const attrs = []
			const caption_list = []
			if (split[it + 1] !== null) {
				const str_emoji = pandoc.Str(split[it + 1])
				str_emoji.__skip = true
				caption_list.push(str_emoji)
			}
			var src = split[it + 2]
			src = await get_emoji(src, emoji_source)
			src = svg_to_pdf(src)
			attrs.push(["height", "1em"])
			var img_emoji
			if (format == "latex" && (context == "Verbatim" || context == "texttt")) {
				var raw = `$\\includegraphics[${attrs.map(a=>a.join('=')).join(',')}]{${src.replace(/\\/g, '/')}}$`
				img_emoji = pandoc.RawInline("latex", raw)
			}
			else {
				img_emoji = pandoc.Image([id, classes, attrs], caption_list, [src, "fig:"])
			}
			result_array.push(img_emoji)
		}
	}
	return result_array
}

async function code_to_texttt(code_text, format, emoji_source) {
	const context = "texttt"
	var items = await replace_emojis(code_text, format, emoji_source, context)
	return ([
		pandoc.RawInline("latex", "\\texttt{"),
		...(Array.isArray(items) ? items : [items]),
		pandoc.RawInline("latex", "}"),
	])
}

async function codeblock_to_verbatim(code_text, format, emoji_source) {
	const context = "Verbatim"
	var items = await replace_emojis(code_text, format, emoji_source, context)
	return ([
		pandoc.RawBlock("latex", "\\begin{"+context+"}[commandchars=\\\\\\{\\}, mathescape, gobble=\\autogobble]"),
		pandoc.Para([...(Array.isArray(items) ? items : [items]),]),
		pandoc.RawBlock("latex", "\\end{"+context+"}"),
	])
}

async function visit(obj, format, meta) {
	if (obj.__skip) return
	var { t: type, c: value } = obj

	if (meta.__debug && JSON.parse(meta.__debug.c))
		wait_debugger()

	const emoji_source = meta.emoji ? meta.emoji.c : process.env["emoji_source"] || "noto-emoji"
	if (type === "Str") {
		return await replace_emojis(value, format, emoji_source)
	}
	else if (type == "Code") {
		var [[code_identifier, code_classes, code_attributes], code_text] = value
		return await code_to_texttt(code_text, format, emoji_source)
		// return pandoc.Code([code_identifier, code_classes, code_attributes], code_text)
	}
	else if (type == "RawBlock") {
		// var [raw_format, raw_text] = value
		// return pandoc.RawBlock(raw_format, raw_text)
	}
	else if (type == "RawInline") {
		// var [raw_format, raw_text] = value
		// return pandoc.RawInline(raw_format, raw_text)
	}
	else if (type == "CodeBlock") {
		var [[code_identifier, code_classes, code_attributes], code_text] = value
		return await codeblock_to_verbatim(code_text, format, emoji_source)
		// return pandoc.CodeBlock([code_identifier, code_classes, code_attributes], code_text)
	}
}

async function visit_array(arr, format, meta) {
	// we could look for <pre> and </pre> tags
	return arr
}

pandoc.stdio({"single": visit, "array": visit_array})

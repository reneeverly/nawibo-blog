/*
https://github.com/fresswolf/syllable-count-english

MIT License

Copyright (c) 2023 Andreas Siegrist

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

let dictionary = {};

var xhr = new XMLHttpRequest()
xhr.onreadystatechange = loadDictionary
xhr.open("GET", "cmudict-0.7b")
xhr.send()

function loadDictionary() {
	var lines = xhr.responseText.split('\n')
	for (let line of lines) {
		const trimmedLine = line;
		if (trimmedLine.startsWith(";;;")) {
			continue;
		}
		const [key, arpabet] = trimmedLine.split("  ");
		if (arpabet) {
			dictionary[key] = arpabet.trim();
		}
	}
	handleInput()
}

function cmuDictionaryLookup(word) {
    return dictionary[word.toUpperCase()];
}

function syllableCountForWord(word) {
	var a = getStressForWord(word)
	if (a == -1) return -1
	return a.length
}

function getStressForWord(word) {
	const arpabet = cmuDictionaryLookup(word)
	if (arpabet) {
		return arpabet.split(/([0-2])/g).filter(y=>(y=='0')||(y=='1')||(y=='2')).join('')
	} else {
        if (word.length > 1 && word.endsWith(".")) {
            return getStressForWord(word.substring(0, word.length - 2));
        }
        if (word.endsWith("s")) {
            return getStressForWord(word.substring(0, word.length - 1));
        }
	}
	return -1
}

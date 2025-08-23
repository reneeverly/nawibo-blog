// https://stackoverflow.com/a/901144
var urlSearchParams = new URLSearchParams(window.location.search)
var params = Object.keys(Object.fromEntries(urlSearchParams.entries()))

Date.prototype.getMinutesSince1970 = function() {
	return this.getTime() / 1000 / 60
}

var now = Math.round(new Date().getMinutesSince1970())

function minutesToHoursAndMinutesString(value) {
//   0 = 0 minutes
//   1 = 1 minute
//   2 = 2 minutes
//  59 = 59 minutes
//  60 = 60 minutes
//  61 = 1 hour, 1 minute
//  62 = 1 hour, 2 minutes
// ...
// 120 = 2 hours, 0 minutes
// 121 = 2 hours, 1 minute
// 122 = 2 hours, 2 minutes
	var resultant = ''
	var min = Math.floor(value % 60)
	if (value > 60) {
		var hrs = Math.floor(value / 60)
		resultant = hrs + " hour" + (hrs != 1 ? "s" : "") + ", "
	}
	resultant += min + " minute" + (min != 1 ? "s" : "")
	return resultant
}

function addUpDurations(container, startingIndex, endingIndex) {
	var duration = 0
	for (var j = startingIndex; j < endingIndex; j+= 2) {
		var start = new Date(container[j+1]).getMinutesSince1970()
		var end = new Date(container[j]).getMinutesSince1970()
		duration += end - start
	}
	return duration
}

var category_html = ''
for (var i = 0; i < params.length; i++) {
	category_html += '<div><div class="catbox"><h3>' + params[i] + '</h3><div class="timebox">' 
	timefix_category.innerHTML += '<option>' + params[i] + '</option>'
	var values = urlSearchParams.get(params[i]).split('|')
	var duration = values[values.length - 1] * 1
	var j = 0
	var button_text = "Punch In"
	if ((values.length % 2) == 0) {
		j++
		category_html += '<p>' + minutesToHoursAndMinutesString(Math.floor(now - new Date(values[0]).getMinutesSince1970())) + ' pending.</p>'
		button_text = "Punch Out"
	}
	duration += addUpDurations(values, j, values.length - (2 - j))
	category_html += '<p>' + minutesToHoursAndMinutesString(duration) + '</p></div></div><button onclick="addPunchToCategory(`' + params[i] + '`)">' + button_text + '</button></div>'

}
category_container.innerHTML = category_html

function addNewCategory(categoryLabel) {
	urlSearchParams.set(categoryLabel, '')
	window.location.search = urlSearchParams.toString()
}

function addPunchToCategory(categoryLabel) {
	var old_values = urlSearchParams.get(categoryLabel).split('|')
	var duration = old_values[old_values.length - 1] * 1
	old_values.splice(old_values.length - 1)
	// tally up and remove anything beyond the last three pairs of punches
	// j is used to account for unpaired
	var j = old_values.length % 2
	if (old_values.length > (4 + j)) {
		duration += addUpDurations(old_values,4 + j,old_values.length - 1)
		old_values.splice(4 + j)
	}
	var new_values = new Date().toUTCString() + ((old_values.length > 0) ? '|' : '') + old_values.join('|')  + '|' + Math.floor(duration)

	urlSearchParams.set(categoryLabel,  new_values)
	window.location.search = urlSearchParams.toString()
}

function adjustCategoryDuration(categoryLabel, adjustmentValue) {
	var old_values = urlSearchParams.get(categoryLabel).split('|')
	var duration = old_values[old_values.length - 1] * 1
	old_values[old_values.length - 1] = Math.floor(duration + adjustmentValue * 1)
	
	urlSearchParams.set(categoryLabel, old_values.join('|'))
	window.location.search = urlSearchParams.toString()
}

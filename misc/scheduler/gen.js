var classContainer = Array();
var cvrat = 0.65;
var daywidth = 150;

/**
 * Gets the values from the form, and appends (or replaces) a class.
 * @function
 * @param {Number} index - The 
 */
function main(index) {
   // Get the data.
   var className = document.getElementById('classname').value;
   /*if (className.length < 2) {
      alert('The class name was not long enough.');
      return;
   }*/
   var days = {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
   };
   var daystr = "";
   if (document.getElementById("M").checked) {
      daystr += "M";
      days.monday = [
         true
      ];
      days.monday.push(getTimes("M"));
   }
   if (document.getElementById("Tu").checked) {
      daystr += "Tu";
      days.tuesday = [
         true
      ];
      days.tuesday.push(getTimes("Tu"));
   }
   if (document.getElementById("W").checked) {
      daystr += "W";
      days.wednesday = [
         true
      ];
      days.wednesday.push(getTimes("W"));
   }
   if (document.getElementById("Th").checked) {
      daystr += "Th";
      days.thursday = [
         true
      ];
      days.thursday.push(getTimes("Th"));
   }
   if (document.getElementById("F").checked) {
      daystr += "F";
      days.friday = [
         true
      ];
      days.friday.push(getTimes("F"));
   }
   if (document.getElementById("Sa").checked) {
      daystr += "Sa";
      days.saturday = [
         true
      ];
      days.saturday.push(getTimes("Sa"));
   }
   if (document.getElementById("Su").checked) {
      daystr += "Su";
      days.sunday = [
         true
      ];
      days.sunday.push(getTimes("Su"));

   }
   if (daystr.length < 1) {
      alert('You did not select any days.');
      return;
   }
   
   //Return value
   var thisClass = Object();
   thisClass.name = className;
   thisClass.desc = document.getElementById('classdesc').value
   thisClass.bldg = document.getElementById('classlocation').value
   thisClass.days = days;
   if (typeof index == "undefined") {
      index = classContainer.length
      classContainer.push(thisClass)
      classItems.innerHTML += '<span class="item" onclick="switchConfig(addnewclass); editClass('+(classContainer.length - 1)+')"><span class="icon icon-controller-record"></span>' + className + '</span>'
   } else {
      classContainer[index] = thisClass
   }

   // Switch to editing mode.
   editClass(index)
   
   generateGraph()
}
/**
 * @function
 * @param {String} id
 * @returns {Array}
 */
function getTimes(id) {
   var A = Array();
   A = [document.getElementById(id+"_times").children[1].children[0].value,document.getElementById(id+"_times").children[1].children[1].value];
   if (document.getElementById(id+"_times").children[3].children[0].value !== '') {
      A.push(document.getElementById(id+"_times").children[3].children[0].value,document.getElementById(id+"_times").children[3].children[1].value);
   }
   return A;
}

/**
 * Displays the textbox for the times of the day provided.
 * @function
 * @param {Boolean} checked
 * @param {String} id
 */
function displaytimes(checked,id) {
   console.log(checked,id+"_times");
   if (checked) {
      document.getElementById(id+"_times").style.display = "table-row";
   } else {
      document.getElementById(id+"_times").style.display = "none";
      document.getElementById(id+"_times").children[1].children[0].value= "";
      document.getElementById(id+"_times").children[1].children[1].value= "";
      document.getElementById(id+"_times").children[3].children[0].value= "";
      document.getElementById(id+"_times").children[3].children[1].value= "";
   }
}

/**
 * @function
 */
function generateGraph() {
   try {
      do {
         a = document.getElementsByClassName('printed')[0].parentElement.removeChild(document.getElementsByClassName('printed')[0]);
      } while(true)
   } catch(err) {}
   drawAxis();

   for (var clazz = 0; clazz < classContainer.length; clazz++) {
      var padding = Number();
      var height = Number();
      var name = String();
      var desc = String();
      var locale = String();
      var style = String();

      name = classContainer[clazz].name
      desc = classContainer[clazz].desc
      locale = classContainer[clazz].bldg

      generateElement(classContainer[clazz].days.monday,0);
      generateElement(classContainer[clazz].days.tuesday,1);
      generateElement(classContainer[clazz].days.wednesday,2);
      generateElement(classContainer[clazz].days.thursday,3);
      generateElement(classContainer[clazz].days.friday,4);
      generateElement(classContainer[clazz].days.saturday,5);
      generateElement(classContainer[clazz].days.sunday,6);

      /**
       * @function
       * @param {Object} day
       * @returns {Number} status code: -1 no class. -2 one class.
       */
      function generateElement(day,ct) {
         // print the first and second timeslots
         for (var i = 0; i <= 2; i += 2) {
            try {
               padding = day[1][0. + i].substr(3)*(100/60)+day[1][0. + i].substr(0,2)*100;
               height = day[1][1. + i].substr(3)*(100/60)+day[1][1. + i].substr(0,2)*100;
   
               padding *=cvrat;
               height *=cvrat;
               height = height - padding;
               
               padding = padding-700*cvrat;
   
               style = 'position: absolute;text-align:center; box-sizing:border-box;left:'+(60+daywidth*ct)+'px; top:'+(padding+20)+'px;height:'+height+'px;background:#41abe1;border:1px solid black;width:'+daywidth+'px;';
               var element = document.createElement('div');
               element.style = style;
               element.innerHTML = name + (desc.length > 1 ? '<br><b>'+desc+'</b>' : '') + '<br>'+locale+'<br>'+day[1][0. + i]+'-'+day[1][1. + i];
               element.className = 'printed';
               printcontainer.append(element);
            } catch(err) {
               return -1 * i;
            }
         }
      }
   }
}



/**
 */
function drawAxis() {

   document.getElementById('titleblock').innerHTML = document.getElementById('titleinput').value;

   var w2 = document.getElementById('twoweek').checked;

   if (w2) {
      daywidth = 150/2;
   } else {
      daywidth = 150;
   }

   var dfs = 'position:absolute;left:0px;width:60px;border-top:1px solid black;top:';

   for (var i = 0; i < 12; i++) {
      var element = document.createElement('div');
      element.style = dfs+(i*100*cvrat+20)+'px;';
      if (i == 5) {
         element.innerHTML = '12:00pm';
      } else if (i < 6) {
         element.innerHTML = (i+7)+':00am';
      } else {
         element.innerHTML = (i-12+7)+':00pm';
      }
      element.className = 'printed';
      printcontainer.append(element);

      var element = document.createElement('div');
      element.style = 'position:absolute;top:'+(i*100*cvrat+20)+'px;'+'width:'+150*7+'px !important;left:60px;border-top:1.5px dashed black;';
      element.className = 'printed';
      printcontainer.append(element);
   }
   var dfs = 'position:absolute;width:'+daywidth+'px;height:20px;border-bottom:1px solid black;top:0px;text-align:center;left:';

   var element = document.createElement('div');
   element.style = dfs+'60px;';
   element.innerHTML = 'Monday';
   element.className = 'printed';
   printcontainer.append(element);

   var element = document.createElement('div');
   element.style = dfs+(60+daywidth*1)+'px;';
   element.innerHTML = 'Tuesday';
   element.className = 'printed';
   printcontainer.append(element);

   var element = document.createElement('div');
   element.style = dfs+(60+daywidth*2)+'px;';
   element.innerHTML = 'Wednesday';
   element.className = 'printed';
   printcontainer.append(element);

   var element = document.createElement('div');
   element.style = dfs+(60+daywidth*3)+'px;';
   element.innerHTML = 'Thursday';
   element.className = 'printed';
   printcontainer.append(element);

   var element = document.createElement('div');
   element.style = dfs+(60+daywidth*4)+'px;';
   element.innerHTML = 'Friday';
   element.className = 'printed';
   printcontainer.append(element);

   var element = document.createElement('div');
   element.style = dfs+(60+daywidth*5)+'px;';
   element.innerHTML = 'Saturday';
   element.className = 'printed';
   printcontainer.append(element);

   var element = document.createElement('div');
   element.style = dfs+(60+daywidth*6)+'px;';
   element.innerHTML = 'Sunday';
   element.className = 'printed';
   printcontainer.append(element);

   if (w2) {
      var element = document.createElement('div');
      element.style = dfs+(60+daywidth*7)+'px;';
      element.innerHTML = 'Monday';
      element.className = 'printed';
      printcontainer.append(element);
   
      var element = document.createElement('div');
      element.style = dfs+(60+daywidth*8)+'px;';
      element.innerHTML = 'Tuesday';
      element.className = 'printed';
      printcontainer.append(element);
   
      var element = document.createElement('div');
      element.style = dfs+(60+daywidth*9)+'px;';
      element.innerHTML = 'Wednesday';
      element.className = 'printed';
      printcontainer.append(element);
   
      var element = document.createElement('div');
      element.style = dfs+(60+daywidth*10)+'px;';
      element.innerHTML = 'Thursday';
      element.className = 'printed';
      printcontainer.append(element);
   
      var element = document.createElement('div');
      element.style = dfs+(60+daywidth*11)+'px;';
      element.innerHTML = 'Friday';
      element.className = 'printed';
      printcontainer.append(element);
   
      var element = document.createElement('div');
      element.style = dfs+(60+daywidth*12)+'px;';
      element.innerHTML = 'Saturday';
      element.className = 'printed';
      printcontainer.append(element);
   
      var element = document.createElement('div');
      element.style = dfs+(60+daywidth*13)+'px;';
      element.innerHTML = 'Sunday';
      element.className = 'printed';
      printcontainer.append(element);
   }
}

      
/**
 * Local File Reading API
 */
function readSingleFile(e) {
   var file = e.target.files[0]
   if (!file) {
      return
   }
   var reader = new FileReader()
   reader.onload = function(e) {
      var contents = e.target.result
      classContainer = JSON.parse(contents)
      classItems.innerHTML = "";
      for (var i = 0; i < classContainer.length; i++) {
         var curClass = classContainer[i]
         var curDays = curClass.days
         classItems.innerHTML += '<span class="item" onclick="switchConfig(addnewclass); editClass('+i+')"><span class="icon icon-controller-record"></span>' + curClass.name + '</span>'

         // patch files from v2 to v3
         if (typeof classContainer[i].desc == "undefined") { classContainer[i].desc = "" }
      }
      generateGraph()
   }
   reader.readAsText(file)
}
//window.onload = function() { document.getElementById('prevsched').addEventListener('change', readSingleFile, false) }

/**
 * Save File via link trick
 */
function saveFile(filename, data) {
   var blob = new Blob([data], {type: 'application/json'});
   if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(blob, filename);
   } else {
      var elem = window.document.createElement('a');
      elem.href = window.URL.createObjectURL(blob);
      elem.download = filename;        
      document.body.appendChild(elem);
      elem.click();        
      document.body.removeChild(elem);
   }
}

/**
 * Formatted Title
 */
function setFTitle() {
   titleinput.value = ftitlename.value + "'s Schedule for " + ftitlesem.value + " @ " + ftitlecol.value
   generateGraph()
}

/**
 * Clear the schedule.
 */
function clearSchedule() {
   // List of classes
   classContainer = []
   classItems.innerHTML = ''
   // Lingering ui elements
   ftitlename.value = ''
   ftitlesem.value = ''
   ftitlecol.value = ''
   titleinput.value = ''
   clearClassEditor()
   // The result
   generateGraph()
}

/**
 * Clear the class editor.
 */
function clearClassEditor() {
   classname.value = ''
   classdesc.value = ''
   classlocation.value = ''
   M.checked = false
   Tu.checked = false
   W.checked = false
   Th.checked = false
   F.checked = false
   Sa.checked = false
   Su.checked = false
   var doloop = 1;
   do {
      try {
         document.getElementsByName('stop')[doloop].parentElement.style.display = 'none';
         document.getElementsByName('stop')[doloop-1].parentElement.parentElement.style.display = 'none';
      } catch(what) {break;}
      doloop += 2;
   } while (true);
   document.getElementsByName('start').forEach(function(element) { element.value = ''; element.parentElement.parentElement.style.display = 'none' })
   document.getElementsByName('stop').forEach(function(element) { element.value = ''; if (element.className == 'second') { element.parentElement.style.display = 'none' } })
   addclassbtn.innerHTML = "Add Class"
   addclassbtn.onclick = function(){main()}
   addclasstitle.innerHTML = "Add New Class"
}

/**
 * Render the week at the forefront as well.
 */
window.onload = function() { generateGraph() }

/**
 * Switches to the provided configuration set.
 */
function switchConfig(newconfig) {
   try { document.getElementsByClassName('item selected')[0].className = "item" } catch(e) { }
   if (newconfig == addnewclass) { addclassoption.className = "item selected" }
   if (newconfig == printconfig) { printoption.className = "item selected" }
   addnewclass.style.display = "none"
   printconfig.style.display = "none"
   newconfig.style.display = "block"
   clearClassEditor()
}

/**
 * Fill new class fields with information.
 */
function editClass(index) {
   clearClassEditor()
   try { document.getElementsByClassName('item selected')[0].className = "item" } catch(e) { }
   classItems.children[index].className = "item selected"
   classname.value = classContainer[index].name
   classdesc.value = classContainer[index].desc
   classlocation.value = classContainer[index].bldg
   M.checked = (typeof classContainer[index].days.monday[0] != "undefined")
   Tu.checked = (typeof classContainer[index].days.tuesday[0] != "undefined")
   W.checked = (typeof classContainer[index].days.wednesday[0] != "undefined")
   Th.checked = (typeof classContainer[index].days.thursday[0] != "undefined")
   F.checked = (typeof classContainer[index].days.friday[0] != "undefined")
   Sa.checked = (typeof classContainer[index].days.saturday[0] != "undefined")
   Su.checked = (typeof classContainer[index].days.sunday[0] != "undefined")

   ;([["M","monday"],["Tu","tuesday"],["W","wednesday"],["Th","thursday"],["F","friday"],["Sa","saturday"],["Su","sunday"]]).forEach(function(id) {
      if (document.getElementById(id[0]).checked) {
         document.getElementById(id[0]+"_times").style.display = "table-row"
         try { document.getElementById(id[0]+"_times").children[1].children[0].value = classContainer[index].days[id[1]][1][0]} catch(e) { }
         try { document.getElementById(id[0]+"_times").children[1].children[1].value = classContainer[index].days[id[1]][1][1]} catch(e) { }
         try { document.getElementById(id[0]+"_times").children[3].children[0].value = classContainer[index].days[id[1]][1][2]} catch(e) { }
         try { document.getElementById(id[0]+"_times").children[3].children[1].value = classContainer[index].days[id[1]][1][3]} catch(e) { }
      }
   })

   addclassbtn.innerHTML = "Update Class"
   addclassbtn.onclick = function(){main(index)}
   addclasstitle.innerHTML = "Edit Existing Class"
}

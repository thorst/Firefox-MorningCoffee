/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Morning Coffee.
 *
 * The Initial Developer of the Original Code is
 * Shane J. M. Liesegang.
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * ***** END LICENSE BLOCK ***** */


var morningCoffee_main = {

	shuffle : function(o)
	{
		for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	},

	trimString : function(o)
	{
		return o.replace(/^\s*|\s*$/g,'');
	},

	switchFlag : function(i) 
	{
		switch (i)
		{
			case 0:
				return "U";
			case 1:
				return "M";
			case 2:
				return "T";
			case 3:
				return "W";
			case 4:
				return "R";
			case 5:
				return "F";
			case 6:
				return "A";
		}
		return "Z";
	},

	prefs : null,
	files : null,
	NUM_FILES : null,
	dayArray : null,
	dayFiles : null,
	masterSiteList : null,

	/* INITIALIZATION */
	Init : function() {

		morningCoffee_main.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		morningCoffee_main.prefs = morningCoffee_main.prefs.getBranch("extensions.morningCoffee.");

		morningCoffee_main.files = new Array("Z", "U", "M", "T", "W", "R", "F", "A");
		morningCoffee_main.NUM_FILES = morningCoffee_main.files.length;
		morningCoffee_main.dayArray = new Array();

		morningCoffee_main.masterSiteList = new Array();
		morningCoffee_main.masterSiteList["Z"] = new Array();
		morningCoffee_main.masterSiteList["U"] = new Array();
		morningCoffee_main.masterSiteList["M"] = new Array();
		morningCoffee_main.masterSiteList["T"] = new Array();
		morningCoffee_main.masterSiteList["W"] = new Array();
		morningCoffee_main.masterSiteList["R"] = new Array();
		morningCoffee_main.masterSiteList["F"] = new Array();
		morningCoffee_main.masterSiteList["A"] = new Array();
		
		/* set up the site list files if they don't exist */
		var ext = Components.classes["@mozilla.org/file/directory_service;1"]
				.createInstance(Components.interfaces.nsIProperties)
				.get("ProfD", Components.interfaces.nsIFile);
		ext.append("morningCoffee");
		ext.append("sites");
		
		if (!ext.exists()) 
		{
			ext.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);
			for (var i=0; i < morningCoffee_main.NUM_FILES; i++)
			{
				var newFile = Components.classes["@mozilla.org/file/directory_service;1"]
					.createInstance(Components.interfaces.nsIProperties)
					.get("ProfD", Components.interfaces.nsIFile);
				newFile.append("morningCoffee");
				newFile.append("sites");
				newFile.append(morningCoffee_main.files[i]);

				var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
							.createInstance(Components.interfaces.nsIFileOutputStream);
		
				foStream.init(newFile, 0x08, 0644, 0);
				foStream.close();
			}
		}

		var entries = ext.directoryEntries;
		var fileCount = 0;
		morningCoffee_main.dayFiles = [];
		while (entries.hasMoreElements())
		{
			fileCount++;
			var entry = entries.getNext();
			entry.QueryInterface(Components.interfaces.nsIFile);
			if (entry.leafName[0] == '.')
			{
				fileCount--;
				continue;
			}
			morningCoffee_main.dayFiles[entry.leafName] = entry; 
		}
		/* end file setup */

		/* set up appropriate stylesheets */
		var stylesheets = document.styleSheets;
		for (var i = 0; i < stylesheets.length; i++) 
		{
			if (stylesheets[i].href == "chrome://morningcoffee/skin/morningCoffee.css") 
			{
				stylesheets[i].disabled = false;
			}
			else if (stylesheets[i].href.indexOf("morningcoffee") >= 0)
			{
				stylesheets[i].disabled = true;
			}
		}
		/* end stylesheet setup */


		/* GUI setup */
		if (morningCoffee_main.prefs.getBoolPref("firstTimeLaunch")) 
		{
			/* add the button, if necessary */
			var toolbar = document.getElementById("nav-bar");
			var buttonCheck = document.getElementById("MorningCoffee-button");
			if (!buttonCheck) {
				var newSet = "";
				for (var i=0; i < toolbar.childNodes.length; i++)
				{
					if (toolbar.childNodes[i].id == "urlbar-container")
					{
						newSet += "MorningCoffee-button,";
					}
					newSet += toolbar.childNodes[i].id + ",";
				}				

				toolbar.setAttribute("currentset", newSet);
				toolbar.currentSet = newSet;
				document.persist("nav-bar", "currentset");
				try { BrowserToolboxCustomizeDone(true); } catch (e) {}
			}

			/* set it so this only happens at first launch */
			morningCoffee_main.prefs.setBoolPref("firstTimeLaunch", false);			
		}
		/* end button management */

		/* load the site list from files */
		morningCoffee_main.LoadFromFiles();
		/* end site list load */
		
		/* set home page if necessary */
		if (morningCoffee_main.prefs.getBoolPref("loadAsHomePage"))
		{
			morningCoffee_main.ReplaceHomePage();
		}
		/* end home page management */
		
		/* INITIALIZATION END */
	},
	
	
	ReplaceHomePage : function()
	{
		morningCoffee_main.GetDays();
		pageString = "";
	
		for (var i=0; i < morningCoffee_main.dayArray.length; i++)
		{
			pageString += morningCoffee_main.dayArray[i];
		
			if (i < morningCoffee_main.dayArray.length - 1)
			{
				pageString += "|";
			}
		}
		
		morningCoffee_main.SetHomeString(pageString);
	},
	
	
	SetHomeString : function(newString)
	{
		homePage = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		homePage = homePage.getBranch("browser.startup.");
		homePage.setCharPref("homepage", newString);
	},
	

	LoadFromFiles : function() 
	{
		//read the info back in from the files
		for (var i=0; i < morningCoffee_main.NUM_FILES; i++)
		{
			var istream = Components.classes["@mozilla.org/network/file-input-stream;1"].
							createInstance(Components.interfaces.nsIFileInputStream);
			istream.init(morningCoffee_main.dayFiles[morningCoffee_main.files[i]], 0x01, 044, 0);
			istream.QueryInterface(Components.interfaces.nsILineInputStream);
	
			morningCoffee_main.masterSiteList[morningCoffee_main.files[i]] = Array();
			var line = {};
			var lines = []
			var hasmore;
			do {
				hasmore = istream.readLine(line);
				/* make sure that it's not a blank line -- can cause problems with config screen */
				var urlVal = morningCoffee_main.trimString(line.value);
				if (urlVal.length > 0)
					morningCoffee_main.masterSiteList[morningCoffee_main.files[i]].push(urlVal);
			} while (hasmore);	
		}
	},
	
	/*
	    Get the sites for a day
	    Default to todays sites
	*/
	GetDays : function (event,flag)
	{
		//If they didnt pass a flag default to today 
		if (typeof flag === "undefined") {
		    var dayOfWeekNum = new Date().getDay();
		    flag = morningCoffee_main.switchFlag(dayOfWeekNum);
		}
		
		morningCoffee_main.dayArray = morningCoffee_main.masterSiteList["Z"].concat(morningCoffee_main.masterSiteList[flag]);
	
		if (morningCoffee_main.prefs.getBoolPref("randomizeOrdering")) {
			morningCoffee_main.dayArray = morningCoffee_main.shuffle(morningCoffee_main.dayArray);
		}
	},
	
	
	LoadUp : function (event,flag)
	{
		morningCoffee_main.GetDays(event,flag);
		window.gBrowser.loadTabs(morningCoffee_main.dayArray, true, morningCoffee_main.prefs.getBoolPref("closeCurrentTabs"));		
	},


	AddTo : function (event, days)
	{
		var currURL = window.gBrowser.currentURI.spec;
		var file = "";

		if (days == undefined)
		{
			days = "Z";
		}
		for (var i = 0; i < days.length; i++)
		{
			morningCoffee_main.WriteToFile(days.charAt(i), currURL + "\n");

			morningCoffee_main.masterSiteList[days.charAt(i)].push(currURL);
		}
	},


	AddTabs : function (event, days)
	{
		var tabs = window.gBrowser.mTabContainer;
		var oldTab = tabs.selectedIndex;
		for(var i = 0; i < tabs.childNodes.length; i++)
		{
			tabs.selectedIndex = i;
			morningCoffee_main.AddTo(event, days);
		}
		tabs.selectedIndex = oldTab;
	},


	WriteToFile : function (fileRef, string)
	{
		var writeFile = Components.classes["@mozilla.org/file/directory_service;1"]
				.createInstance(Components.interfaces.nsIProperties)
				.get("ProfD", Components.interfaces.nsIFile);
		writeFile.append("morningCoffee");
		writeFile.append("sites");
		writeFile.append(fileRef);
		
		var fstream = Components.classes["@mozilla.org/network/file-output-stream;1"].
						createInstance(Components.interfaces.nsIFileOutputStream);
		fstream.init(writeFile, 0x02 | 0x10, 0644, 0);
		fstream.write(string, string.length);
		fstream.close();
	},

	About : function() 
	{
		window.openDialog(
			"chrome://morningcoffee/content/morningCoffeeAbout.xul",
			"MorningCoffeeAboutDialog",
			"chrome,dependent,centerscreen,modal"
		);
	},

	Configure : function() 
	{
		window.openDialog(
			"chrome://morningcoffee/content/morningCoffeeConfigDialog.xul", 
			"MorningCoffeeConfigDialog", 
			"chrome,dependent,centerscreen,modal",
			morningCoffee_main.masterSiteList,
			morningCoffee_main.prefs
		);

		morningCoffee_main.LoadFromFiles();
	},


	OnConfigLoad : function () 
	{

		if (morningCoffee_main.prefs == undefined)
		{
			morningCoffee_main.Init();
		}

		if (morningCoffee_main.prefs.getBoolPref("randomizeOrdering")) 
		{
			document.getElementById("MorningCoffee_configRandomizeOrderingCheckBox").checked = true;
		}
		if (morningCoffee_main.prefs.getBoolPref("closeCurrentTabs")) 
		{
			document.getElementById("MorningCoffee_configCloseCurrentTabsCheckBox").checked = true;
		}
		if (morningCoffee_main.prefs.getBoolPref("loadAsHomePage"))
		{
			document.getElementById("MorningCoffee_configOpenAsHomePage").checked = true;
		}

		document.getElementById("MorningCoffee-Config_dayListBox").selectedIndex = 0;
		
	},


	OnConfigAccept : function () 
	{
		//write out the new files
		for (var i = 0; i < morningCoffee_main.files.length; i++) {
			var writeFile = Components.classes["@mozilla.org/file/directory_service;1"]
				.createInstance(Components.interfaces.nsIProperties)
				.get("ProfD", Components.interfaces.nsIFile);
			writeFile.append("morningCoffee");
			writeFile.append("sites");
			writeFile.append(morningCoffee_main.files[i]);

			var fstream = Components.classes["@mozilla.org/network/file-output-stream;1"].
						createInstance(Components.interfaces.nsIFileOutputStream);
			fstream.init(writeFile, 0x02 | 0x10 | 0x20, 0644, 0); 
	
			for (var j = 0; j < morningCoffee_main.masterSiteList[morningCoffee_main.files[i]].length; j++) {
				fstream.write(
					morningCoffee_main.masterSiteList[morningCoffee_main.files[i]][j], 
					morningCoffee_main.masterSiteList[morningCoffee_main.files[i]][j].length);
				fstream.write("\n", 1);
			}
		}

		morningCoffee_main.prefs.setBoolPref("randomizeOrdering", document.getElementById("MorningCoffee_configRandomizeOrderingCheckBox").checked);
		morningCoffee_main.prefs.setBoolPref("closeCurrentTabs", document.getElementById("MorningCoffee_configCloseCurrentTabsCheckBox").checked);
		
		homePageBefore = morningCoffee_main.prefs.getBoolPref("loadAsHomePage");
		morningCoffee_main.prefs.setBoolPref("loadAsHomePage", document.getElementById("MorningCoffee_configOpenAsHomePage").checked);
		if (homePageBefore && !morningCoffee_main.prefs.getBoolPref("loadAsHomePage"))
		{
			morningCoffee_main.SetHomeString("about:blank");
		}
		if (morningCoffee_main.prefs.getBoolPref("loadAsHomePage"))
		{
			morningCoffee_main.ReplaceHomePage();
		}
		
		return true;
	},


	OnConfigCancel : function () 
	{
		morningCoffee_main.LoadFromFiles();
		return true;
	},


	OnConfigDayListBoxSelect : function () 
	{
		document.getElementById("MorningCoffee-Config_urlListBox").disabled = false;

		var switchFlag = morningCoffee_main.switchFlag(document.getElementById("MorningCoffee-Config_dayListBox").selectedIndex - 1);

		//empty the box
		for (var i = document.getElementById("MorningCoffee-Config_urlListBox").getRowCount() - 1; 
			i >= 0; 
			i--) 
		{
			document.getElementById("MorningCoffee-Config_urlListBox").removeItemAt(i);
		}

		//fill the box
		for (i = 0; i < morningCoffee_main.masterSiteList[switchFlag].length; i++) 
		{
			if (morningCoffee_main.masterSiteList[switchFlag][i] == "")
				continue;
			document.getElementById("MorningCoffee-Config_urlListBox").
				appendItem(morningCoffee_main.masterSiteList[switchFlag][i]);
		}
		document.getElementById("MorningCoffee-Config_editURLButton").disabled = true;
		document.getElementById("MorningCoffee-Config_deleteURLButton").disabled = true;
		document.getElementById("MorningCoffee-Config_addURLButton").disabled = false;
		document.getElementById("MorningCoffee-Config_moveURLUpButton").src = 
			"chrome://morningcoffee/skin/up_arrow_disabled.png";
		document.getElementById("MorningCoffee-Config_moveURLDownButton").src = 
			"chrome://morningcoffee/skin/down_arrow_disabled.png";
	},


	OnConfigURLListBoxSelect : function () 
	{
		document.getElementById("MorningCoffee-Config_editURLButton").disabled = false;
		document.getElementById("MorningCoffee-Config_deleteURLButton").disabled = false;
		document.getElementById("MorningCoffee-Config_addURLButton").disabled = false;


		if (document.getElementById("MorningCoffee-Config_urlListBox").selectedIndex > 0)
		{
			document.getElementById("MorningCoffee-Config_moveURLUpButton").src = 
				"chrome://morningcoffee/skin/up_arrow.png";
		}
		else 
		{
			document.getElementById("MorningCoffee-Config_moveURLUpButton").src = 
				"chrome://morningcoffee/skin/up_arrow_disabled.png";
		}

		if (document.getElementById("MorningCoffee-Config_urlListBox").selectedIndex < 
			document.getElementById("MorningCoffee-Config_urlListBox").getRowCount() - 1)
		{
			document.getElementById("MorningCoffee-Config_moveURLDownButton").src = 
				"chrome://morningcoffee/skin/down_arrow.png";
		}
		else 
		{
			document.getElementById("MorningCoffee-Config_moveURLDownButton").src = 
				"chrome://morningcoffee/skin/down_arrow_disabled.png";
		}
	},


	OnConfigAddURLClick : function () 
	{
		var switchFlag = morningCoffee_main.switchFlag(document.getElementById("MorningCoffee-Config_dayListBox").selectedIndex - 1);
		window.openDialog("chrome://morningcoffee/content/morningCoffeeConfigAddURL.xul",
				"MorningCoffeeConfigAddURLDialog",
				"chrome,dependent,centerscreen,modal",
				morningCoffee_main.masterSiteList[switchFlag]
			);
	},


	OnConfigAddURLLoad : function () 
	{

	},
	

	OnConfigAddURLAccept : function () 
	{
		var newItem = window.opener.document.getElementById("MorningCoffee-Config_urlListBox")
			.appendItem(document.getElementById("MorningCoffee-ConfigAddURLTextBox").value);

		var index = window.opener.document.getElementById("MorningCoffee-Config_urlListBox").getRowCount() - 1;
		window.opener.document.getElementById("MorningCoffee-Config_urlListBox").ensureIndexIsVisible(index);
		window.opener.document.getElementById("MorningCoffee-Config_urlListBox").selectedIndex = index;

		window.arguments[0].push(document.getElementById("MorningCoffee-ConfigAddURLTextBox").value);

		return true;
	},


	OnConfigAddURLCancel : function() 
	{
		return true;
	},


	OnConfigEditURLClick : function () 
	{
		var switchFlag = morningCoffee_main.switchFlag(document.getElementById("MorningCoffee-Config_dayListBox").selectedIndex - 1);
		var array = morningCoffee_main.masterSiteList[switchFlag];
		var arrayInd = document.getElementById("MorningCoffee-Config_urlListBox").selectedIndex;
		var guiItem = document.getElementById("MorningCoffee-Config_urlListBox").selectedItem;
		
		window.openDialog("chrome://morningcoffee/content/morningCoffeeConfigEditURL.xul",
				"MorningCoffeeConfigURLDialog",
				"chrome,dependent,centerscreen,modal", 
				array,
				arrayInd,
				guiItem
			);
	},


	OnConfigURLLoad : function() 
	{
		document.getElementById("MorningCoffee-ConfigEditURLTextBox").value = window.arguments[0][window.arguments[1]];
	},


	OnConfigURLAccept : function() 
	{
		window.arguments[0][window.arguments[1]] = document.getElementById("MorningCoffee-ConfigEditURLTextBox").value;
		window.arguments[2].label = document.getElementById("MorningCoffee-ConfigEditURLTextBox").value;

		return true;
	},


	OnConfigURLCancel : function () 
	{
		return true;
	},


	OnConfigDeleteURLClick : function () 
	{
		var index = document.getElementById("MorningCoffee-Config_urlListBox").selectedIndex;
		var switchFlag = morningCoffee_main.switchFlag(document.getElementById("MorningCoffee-Config_dayListBox").selectedIndex - 1);
		morningCoffee_main.masterSiteList[switchFlag].splice(index, 1);
		document.getElementById("MorningCoffee-Config_urlListBox").removeItemAt(index);

		var newIndex = -1;
		if ( (index == 0) && (document.getElementById("MorningCoffee-Config_urlListBox").getRowCount() != 0) )
		{
			newIndex = 0;
		}
		else if (index >= document.getElementById("MorningCoffee-Config_urlListBox").getRowCount())
		{
			newIndex = document.getElementById("MorningCoffee-Config_urlListBox").getRowCount() - 1;
		}
		else 
		{
			newIndex = index;
		}
		
		if (newIndex >= 0) 
		{
			document.getElementById("MorningCoffee-Config_urlListBox").ensureIndexIsVisible(newIndex);
			document.getElementById("MorningCoffee-Config_urlListBox").selectedIndex = newIndex;
		}
	},


	OnMoveURLUpClick : function () 
	{

		if (document.getElementById("MorningCoffee-Config_moveURLUpButton").src.search("disabled") >= 0)
			return;

		var currSelectedIndex = document.getElementById("MorningCoffee-Config_urlListBox").selectedIndex;
		
		if (currSelectedIndex == 0)
		{
			return true;
		}

		var urlSwapAbove = 
			document.getElementById("MorningCoffee-Config_urlListBox")
			.getItemAtIndex(currSelectedIndex - 1).label;

		var urlSwapTemp = 
			document.getElementById("MorningCoffee-Config_urlListBox")
			.selectedItem.label;

		
		document.getElementById("MorningCoffee-Config_urlListBox").selectedItem.label = urlSwapAbove;
		document.getElementById("MorningCoffee-Config_urlListBox")
			.getItemAtIndex(currSelectedIndex - 1).label
			= urlSwapTemp;
		
		document.getElementById("MorningCoffee-Config_urlListBox").selectedItem = 
			document.getElementById("MorningCoffee-Config_urlListBox")
			.getItemAtIndex(currSelectedIndex - 1);

		var switchFlag = morningCoffee_main.switchFlag(document.getElementById("MorningCoffee-Config_dayListBox").selectedIndex - 1);
		
		var arraySwapAbove = morningCoffee_main.masterSiteList[switchFlag][currSelectedIndex - 1];
		var arraySwapTemp = morningCoffee_main.masterSiteList[switchFlag][currSelectedIndex];
		morningCoffee_main.masterSiteList[switchFlag][currSelectedIndex] = arraySwapAbove;
		morningCoffee_main.masterSiteList[switchFlag][currSelectedIndex - 1] = arraySwapTemp;	

		return true;
	},


	OnMoveURLDownClick : function () 
	{
		if (document.getElementById("MorningCoffee-Config_moveURLDownButton").src.search("disabled") >= 0)
			return;
		
		var currSelectedIndex = document.getElementById("MorningCoffee-Config_urlListBox").selectedIndex;
		if (currSelectedIndex == document.getElementById("MorningCoffee-Config_urlListBox").getRowCount() - 1) 
		{
			return true;
		}

		var urlSwapBelow = 
			document.getElementById("MorningCoffee-Config_urlListBox")
			.getItemAtIndex(currSelectedIndex + 1).label;

		var urlSwapTemp = 
			document.getElementById("MorningCoffee-Config_urlListBox")
			.selectedItem.label;
		

		document.getElementById("MorningCoffee-Config_urlListBox").selectedItem.label = urlSwapBelow;
		document.getElementById("MorningCoffee-Config_urlListBox")
			.getItemAtIndex(currSelectedIndex + 1).label
			= urlSwapTemp;
		
		document.getElementById("MorningCoffee-Config_urlListBox").selectedItem = 
			document.getElementById("MorningCoffee-Config_urlListBox")
			.getItemAtIndex(currSelectedIndex + 1);

		var switchFlag = morningCoffee_main.switchFlag(document.getElementById("MorningCoffee-Config_dayListBox").selectedIndex - 1);
		
		var arraySwapBelow = morningCoffee_main.masterSiteList[switchFlag][currSelectedIndex + 1];
		var arraySwapTemp = morningCoffee_main.masterSiteList[switchFlag][currSelectedIndex];
		morningCoffee_main.masterSiteList[switchFlag][currSelectedIndex] = arraySwapBelow;
		morningCoffee_main.masterSiteList[switchFlag][currSelectedIndex + 1] = arraySwapTemp;	

		return true;
	},


}

//init main
window.addEventListener("load", morningCoffee_main.Init, false);

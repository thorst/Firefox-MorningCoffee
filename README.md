Morning-Coffee
==============

Branch of http://www.shaneliesegang.com/projects/coffee.php

##Instructions-##

Download <a href ="https://github.com/thorst/Morning-Coffee/raw/master/morningCoffee@shaneliesegang.xpi">morningCoffee@shaneliesegang.xpi</a> and place the file in C:\Users\%username%\AppData\Roaming\Mozilla\Firefox\Profiles\%profile name%\extensions

##History-##

I used morning coffee quite a bit. The entire purpose is to load specific sites on specific days. But what happends if you miss a day? This happens to me quite a bit, so I decided to quickly modify the code.

##Solution-##

I've added a feauture to allow you to "Load Morning Coffee From" and choose the day you wish to load.

##Change Summary-##

###chrome\chromeFiles\content\morningCoffee.js###

    //modify to add flag param, and only populate flag if undefined
    GetDays : function (event,flag)
    {
      //If they didnt pass a flag default to today 
      if (typeof flag === "undefined") {
        var dayOfWeekNum = new Date().getDay();
        flag = morningCoffee_main.switchFlag(dayOfWeekNum);
      }
		
      ...
    }

    //Add flag param, and pass to GetDays
    LoadUp : function (event,flag)
    {
      morningCoffee_main.GetDays(event,flag);
      ...
    }

###chrome\chromeFiles\content\morningCoffeeOverlay.xul###

**Just below:**

    <menuitem label="&mainbuttonpopup.action;" tooltiptext="&mainbutton.tooltip;" oncommand="morningCoffee_main.LoadUp(event);event.stopPropagation();" id="MorningCoffee-LoadUp"/>`

**Add:**
					
    <menu label="&mainbuttonpopup.loadfrom;">
					<menupopup>
						<menuitem label="&mainbuttonpopup.sunday;" tooltiptext="&mainbuttonpopup.mondayTT;"
							oncommand="morningCoffee_main.LoadUp(event, 'U'); event.stopPropagation();"
								id="MorningCoffee-LoadUpU"/>
						<menuitem label="&mainbuttonpopup.monday;" tooltiptext="&mainbuttonpopup.mondayTT;"
							oncommand="morningCoffee_main.LoadUp(event, 'M'); event.stopPropagation();"
								id="MorningCoffee-LoadUpM"/>
						<menuitem label="&mainbuttonpopup.tuesday;" tooltiptext="&mainbuttonpopup.tuesdayTT;"
							oncommand="morningCoffee_main.LoadUp(event, 'T'); event.stopPropagation();"
							id="MorningCoffee-LoadUpT"/>
						<menuitem label="&mainbuttonpopup.wednesday;" tooltiptext="&mainbuttonpopup.wednesdayTT;"
							oncommand="morningCoffee_main.LoadUp(event, 'W'); event.stopPropagation();"
							id="MorningCoffee-LoadUpW"/>
						<menuitem label="&mainbuttonpopup.thursday;" tooltiptext="&mainbuttonpopup.thursdayTT;"
							oncommand="morningCoffee_main.LoadUp(event, 'R'); event.stopPropagation();"
							id="MorningCoffee-LoadUpR"/>
						<menuitem label="&mainbuttonpopup.friday;" tooltiptext="&mainbuttonpopup.fridayTT;"
							oncommand="morningCoffee_main.LoadUp(event, 'F'); event.stopPropagation();"
							id="MorningCoffee-LoadUpF"/>
						<menuitem label="&mainbuttonpopup.saturday;" tooltiptext="&mainbuttonpopup.mondayTT;"
							oncommand="morningCoffee_main.LoadUp(event, 'A'); event.stopPropagation();"
								id="MorningCoffee-LoadUpA"/>
					</menupopup>
				</menu>
				
###chrome\chromeFiles\locale\en-US\morningCoffee.dtd###
**Just below:**

    <!ENTITY mainbuttonpopup.action "Load My Morning Coffee">

**Add:**

    <!ENTITY mainbuttonpopup.loadfrom "Load Morning Coffee From">


###Markdown Help:###

http://www.ctrlshift.net/project/markdowneditor/

http://github.github.com/github-flavored-markdown/
Milestone 04 - Final Project Documentation
===

NetID
---
sma9098

Name
---
Saif Almheiri

Repository Link
---
(https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-sma9098)

URL for deployed site 
---
1. Backend: (https://final-project-backend-ggey.onrender.com) 
2. Frontend: (https://final-project-sma9098.onrender.com)

URL for form 1 (from previous milestone) 
---
(https://final-project-sma9098.onrender.com)

Special Instructions for Form 1
---
1. If you do not have an account, register
2. If you have an account, login

URL for form 2 (for current milestone)
---
(https://final-project-sma9098.onrender.com/lobby)

Special Instructions for Form 2
---
You need to create a room first to join so:
1. If you didn't make a room, do so
2. Any other player can join the room with the roomcode provided by the host (the one making the room)
3. A GAME CANNOT BE STARTED WITH ONLY ONE PERSON IN THE ROOM. You will know the game can be started if the "start game" button is green
4. IT IS ALSO VERY IMPORTANT TO NOTE THAT STARTING THE GAME OR JOINING A ROOM MAY TAKE VERY LONG. PLEASE BE PATIENT 

URL for form 3 (from previous milestone) 
---
I cannot provide a URL for this link, THE LINK IS DEPENDENT ON ROOM CODE 
it would look something like this:
(https://final-project-sma9098.onrender.com/game/:roomCode)

Special Instructions for Form 3
---
1. Only one person will see the form at any given time. This person is the drawer (highlighted by a pen and paper under the name once the game starts)
2. Once they input the word into the form, the modal will disappear. The word will be present on the drawers screen at the top
3. Conversely, any guesser will only see the length of the word, indicated by underscores next to the word "hint"

First link to github line number(s) for constructor, HOF, etc.
---
USE OF MAP FROM ARRAY.PROTOTYPE:
1. (https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-sma9098/blob/9c274eafc1db122b392c545ab58e15378f817f0b/client/src/pages/WaitingRoom.jsx#L181) 
2. (https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-sma9098/blob/9c274eafc1db122b392c545ab58e15378f817f0b/client/src/pages/GamePage.jsx#L265)
3. (https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-sma9098/blob/9c274eafc1db122b392c545ab58e15378f817f0b/client/src/pages/GamePage.jsx#L315)
4. (https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-sma9098/blob/9c274eafc1db122b392c545ab58e15378f817f0b/client/src/pages/GamePage.jsx#L396)
5. (https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-sma9098/blob/9c274eafc1db122b392c545ab58e15378f817f0b/client/src/pages/GamePage.jsx#L523)

Second link to github line number(s) for constructor, HOF, etc.
---
USE OF FILTER FROM ARRAY.PROTOTYPE
1. (https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-sma9098/blob/9c274eafc1db122b392c545ab58e15378f817f0b/server/app.mjs#L101)
USE OF FOREACH FROM ARRAY.PROTOTYPE
1. (https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-sma9098/blob/9c274eafc1db122b392c545ab58e15378f817f0b/server/app.mjs#L148)
USE OF SOME FROM ARRAY.PROTOTYPE
1. (https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-sma9098/blob/9c274eafc1db122b392c545ab58e15378f817f0b/server/app.mjs#L238)
USE OF EVERY FROM ARRAY.PROTOTYPE
1. (https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-sma9098/blob/9c274eafc1db122b392c545ab58e15378f817f0b/server/app.mjs#L104)


Short description for links above
---
uses of map:
1. maps the array of players to decorate them (based on if you are the player/host or not) and display them in the waiting room
2. maps each letter in the hint word to become an underscore
3. maps the array of players to decroate them and display them in the game page (depending on if they have guessed or not)
4. maps the chat messages just to cycle through and display them on the screen
5. maps the sorted array of players (by score) and displays them in gold, silver, or bronze, based on placement

use of filter:
1. removes the drawer from the array to check if all other players have guessed

use of forEach:
1. cycles through all players to set the "hasGuessed" attribute to false to get ready for next round

use of some: 
1. checks if a player is already in the room and is trying to reenter (prevents adding the same player twice)

use of ever:
1. check if all players have the "hasGuessed" attribute as true, meaning the round should be over


Link to github line number(s) for schemas (db.js or models folder)
---
(https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-sma9098/blob/9c274eafc1db122b392c545ab58e15378f817f0b/server/db.mjs#L1)

Description of research topics above with points
---
1. React - 6 points -> used react to build the clientside interface
2. Socket.io - 4 points -> used to built two way communication between server and the client and to have a real-time application between browsers
3. HTML Canvas - 1 points -> used to build the canvas element of the game so that players can draw

Links to github line number(s) for research topics described above (one link per line)
---
1. (https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-sma9098/blob/9c274eafc1db122b392c545ab58e15378f817f0b/client/src/pages/GamePage.jsx#L1)
2. (https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-sma9098/blob/9c274eafc1db122b392c545ab58e15378f817f0b/server/app.mjs#L163)
3. (https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-sma9098/blob/9c274eafc1db122b392c545ab58e15378f817f0b/client/src/pages/GamePage.jsx#L205)

Optional project notes 
--- 
PLEASE BE PATIENT!
If something takes a while to work, it is likely just being slow. I wasn't sure how to fix this!
Additionally, once you press the "start game" button in the WaitingRoomPage, it will take a while to load and the console of the browser will output the same error constantly : "The game is already in progress." Please just give it time and let it load, this is not a real error, its just the socket emitting this message.

Attributions
---
1. socket.io (primarily issue with the primary socket)
[LINK_IN_GIT] (https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-sma9098/blob/260801982fa3da54c7f44fccc087cb754465a932/client/src/SocketContext.jsx#L1) 
[LINK_USED_AS_REFERENCE] (https://www.youtube.com/watch?v=djMy4QsPWiI)

2. socket.io (learning emittance and listening)
[LINK_IN_GIT] ((https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-sma9098/blob/9c274eafc1db122b392c545ab58e15378f817f0b/server/app.mjs#L163))
[LINK_USED_AS_REFERENCE] (https://socket.io/docs/v4/)

3. react (anything react related was primarily learned from the video)
[LINK_IN_GIT] (https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-sma9098/blob/9c274eafc1db122b392c545ab58e15378f817f0b/client/src/pages/LandingPage.jsx#L1)
[LINK_USED_AS_REFERENCE] (https://www.youtube.com/watch?v=TtPXvEcE11E)

4. HTML CANVAS
[LINK_IN_GIT] (https://github.com/nyu-csci-ua-0467-001-002-fall-2025/final-project-sma9098/blob/9c274eafc1db122b392c545ab58e15378f817f0b/client/src/pages/GamePage.jsx#L205)
[LINK_USED_AS_REFERENCE] (https://www.w3schools.com/html/html5_canvas.asp)
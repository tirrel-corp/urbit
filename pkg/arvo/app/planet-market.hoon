:: planet-market [landscape]
::
/+  default-agent
|%
+$  card  card:agent:gall
::
+$  price
  $%  [%price amount=@rd currency=@t]
      [%free ~]
  ==
::
+$  record  [=ship code=cord =price =referral-policy]
::
+$  referral-policy
  $:  number-referrals=@ud
      =price
  ==
::
+$  state-0
  $:  %0
      =price
      available-codes=(map ship cord)
      sold-codes=(mop time record)
      =referral-policy
  ==
::
+$  update
  $:  [%add-codes codes=(map ship cord)
      [%sell-random-codes n=@ud]
      [%sell-codes codes=(set ship)]
      [%remove-codes codes=(set ship)]
      [%use-referral =ship]
      [%set-price =price]
      [%set-referral-policy =referral-policy]
  ==
--
::
=|  state-0
=*  state  -
::
%-  agent:dbug
%+  verb  |
^-  agent:gall
|_  =bowl:gall
+*  this       .
    def        ~(. (default-agent this %|) bowl)
::
++  on-init   [~ this]
++  on-save   !>(state)
++  on-load
  |=  old-vase=vase
  ^-  (quip card _this)
  =/  old  !<(state-0 old-vase)
  [~ this(state state-0)]
::
++  on-poke
  |=  [=mark =vase]
  ^-  (quip card _this)
  ?>  (team:title our.bowl src.bowl)
  |^
  ?+    mark  (on-poke:def mark vase)
      %planet-market-update
    =^  cards  state
      (planet-market-update !<(update vase))
    [cards this]
  ==
  ::
  ++  planet-market-update
    |=  =update
    ^-  (quip card _state)
    :-  (give /update^~ update)
    ?-    -.update
        %add-codes
      ::  check that no added code has already been sold
      ::  then add them to the map
      ?:  =(~(int by 
      state
    ::
        %sell-random-codes
      ::  check that available-codes has N items in it
      ::  if not, crash. if yes, then sell them
      state
    ::
        %sell-codes
      ::  check that all codes being sold are available
      ::  if not, crash. if yes, then sell them
      state
    ::
        %remove-codes
      ::  check that all codes are available.
      ::  if not, crash. if yes, then remove them.
      state
    ::
        %use-referral
      ::  check that a code is available and that the ship in question
      ::  has referrals left to give out.
      ::  if not, crash. if yes, then sell at the referral code price.
      state
    ::
        %set-price
      state(price price.update)
    ::
        %set-referral-policy
      state(referral-policy referral-policy.update)
    ==
  ::
  ++  give
    |=  [paths=(list path) =update]
    ^-  (list card)
    [%give %fact paths %planet-market-update !>(update)]~
  --
::
++  on-watch
  |=  =path
  ^-  (quip card _this)
  ?>  (team:title our.bowl src.bowl)
  ?:  ?=([%updates ~] path)
    ~
  (on-watch:def path)
::
++  on-leave  on-leave:def
++  on-peek
  |=  =path
  ^-  (unit (unit cage))
  ?+    path  (on-peek:def path)
    [%x %export ~]  ``noun+!>(state)
  ==
::
++  on-agent  on-agent:def
++  on-arvo   on-arvo:def
++  on-fail   on-fail:def
--

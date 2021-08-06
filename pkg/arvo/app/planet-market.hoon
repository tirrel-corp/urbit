:: planet-market [landscape]
::
/-  *planet-market
/+  default-agent, dbug, verb
|%
+$  card  card:agent:gall
+$  state-0
  $:  %0
      =price
      =available-codes
      =sold-codes
      =ship-to-sell-date
      =referral-policy
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
++  on-init   `this
++  on-save   !>(state)
++  on-load
  |=  old-vase=vase
  ^-  (quip card _this)
  =/  old  !<(state-0 old-vase)
  `this(state old)
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
      =/  codes  ~(tap by codes.update)
      |-
      ?~  codes
        state
      =*  ship  -.i.codes
      =*  code  +.i.codes
      ?:  (~(has by ship-to-sell-date) ship)
        !!
      %_  $
        codes  t.codes
        available-codes  (~(put by available-codes) ship code)
      ==
    ::
        %sell-random-codes
      ::  check that available-codes has N items in it
      ::  if not, crash. if yes, then sell them
      ?:  (gth n.update ~(wyt by available-codes))
        !!
      ::  TODO: randomly select N ships, then sell them
      state
    ::
        %sell-codes
      ::  check that all codes being sold are available
      ::  if not, crash. if yes, then sell them
      =/  codes     ~(tap in codes.update)
      =/  =records  (need (fall (get:his now) [~ ~]))
      |-
      ?~  codes
        state(sold-codes (put:on now.bowl records))
      =*  ship  i.codes
      ~|  "cannot sell code that does not exist"
      =/  code  (~(got by available-codes) ship)
      $(records (~(put in records) [ship code price referral-policy]))
    ::
        %remove-codes
      ::  check that all codes are available.
      ::  if not, crash. if yes, then remove them.
      =/  codes  ~(tap in codes.update)
      |-
      ?~  codes
        state
      =*  ship  i.codes
      ~|  "cannot remove code that does not exist"
      ?>  (~(has by available-codes) ship)
      $(available-codes (~(del by available-codes) ship))
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
    `this
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

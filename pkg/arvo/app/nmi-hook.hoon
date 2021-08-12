:: nmi-hook [tirrel]
::
/+  default-agent, dbug, verb
|%
+$  card  card:agent:gall
+$  init-info
  $:  card=*'4111111111111111'
      expiration=*'10/25'
      amount=*'1.00'
      cvv=*'999'
      zip=*'77777'
  ==
+$  update
  $%  [%initiate-payment init-info]
  ==
+$  state-0
  $:  %0
      api-key=cord
      endpoint=cord
      redirect-url=cord
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
+*  this  .
    def   ~(. (default-agent this %|) bowl)
::
++  on-init
  =/  =state-0
    :+  %0
      '2F822Rw39fx762MaV7Yy86jXGTC7sCDy'
    'https://secure.networkmerchants.com/api/v2/three-step'
  :-  ~
  this(state state-0)
::
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
      %nmi-hook-update
    =^  cards  state
      (nmi-hook-update !<(update vase))
    [cards this]
  ==
  ::
  ++  nmi-hook-update
    |=  =update
    ^-  (quip card _state)
    `state
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

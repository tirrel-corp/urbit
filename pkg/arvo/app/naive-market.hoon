:: naive-market [tirrel]
::
/-  *naive-market, dice
/+  ntx=naive-transactions, eth=ethereum, default-agent, dbug, verb
|%
+$  card  card:agent:gall
+$  state-0
  $:  %0
      price=(unit price)
      referrals=(unit referral-policy)
    ::
      =star-configs
      =for-sale
      =sold-ships
      =sold-ship-to-date
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
      %naive-market-update
    =^  cards  state
      (market-update !<(update vase))
    [cards this]
  ==
  ::
  ++  market-update
    |=  =update
    ^-  (quip card _state)
    ?-    -.update
      %set-price      `state(price `price.update)
      %set-referrals  `state(referrals ref.update)
    ::
        %add-star-config
      ?<  (~(has by star-configs) who.update)
      =*  c  config.update
      =.  prv.c
        q:(need (de:base16:mimes:html prv.c))
      =/  =address  (address-from-prv:key:eth prv.c)
      :_  state(star-configs (~(put by star-configs) who.update c))
      :_  ~
      :^  %pass  /address/(scot %ux address)  %agent
      [[our.bowl %roller] %watch /txs/(scot %ux address)]
    ::
        %del-star-config
      =/  c=config  (~(got by star-configs) who.update)
      =/  =address  (address-from-prv:key:eth prv.c)
      :_  state(star-configs (~(del by star-configs) who.update))
      :_  ~
      :^  %pass  /address/(scot %ux address)  %agent
      [[our.bowl %roller] %leave ~]
    ::
        %spawn-ships
      =*  sel    sel.update
      =*  who    who.update
      =/  =config  (~(got by star-configs) who)
      =*  prv    prv.config
      =*  proxy  proxy.config
      =/  addr  (address-from-prv:key:eth prv)
      =/  nonce=@
        (need (scry-for %roller (unit @) /nonce/(scot %p who)/[proxy]))
      :_  state
      =|  cards=(list card)
      |^  ^-  (list card)
      ?:  ?=(%| -.sel)
        =/  unspawned=(list ship)
          (scry-for %roller (list ship) /unspawned/(scot %p who))
        =|  i=@ud
        |-
        ?:  ?|(?=(~ unspawned) (gte i p.sel))
          (flop cards)
        =*  ship  i.unspawned
        %_  $
          i          +(i)
          nonce      +(nonce)
          unspawned  t.unspawned
          cards      [(spawn ship) cards]
        ==
      =/  unspawned=(set ship)
        %-  ~(gas in *(set ship))
        (scry-for %roller (list ship) /unspawned/(scot %p who))
      =/  ships=(list ship)  ~(tap in p.sel)
      |-
      ?~  ships
        (flop cards)
      =*  ship  i.ships
      ~|  "cannot spawn ship {(trip (scot %p ship))}"
      ?>  (~(has in unspawned) ship)
      %_  $
        ships  t.ships
        cards  [(spawn ship) cards]
      ==
      ::
      ++  spawn
        |=  =ship
        ^-  card
        =/  =tx:naive:ntx
          [[who proxy] %spawn ship addr]
        =/  sig=octs
          (gen-tx:ntx nonce tx prv)
        :^  %pass  /spawn/(scot %p ship)  %agent
        :+  [our.bowl %roller]  %poke
        roller-action+!>([%submit | addr q.sig %don tx])
      --
    ::
        %sell-ships
      ?>  ?=(^ price)
      =*  who  who.update
      =/  =records
        =/  urec=(unit records)  (get:his sold-ships now.bowl)
        ?~(urec ~ u.urec)
      =/  ships=(list ship)  ~(tap in (~(get ju for-sale) who))
      ?:  ?=(%| -.sel.update)
        ~|  "cannot sell more ships than we have"
        ?>  (lth p.sel.update (lent ships))
        =|  ships-to-be-sold=(set ship)
        |-
        ?~  ships
          :-  (give /updates^~ [%sell-ships who %&^ships-to-be-sold])
          state(sold-ships (put:his sold-ships now.bowl records))
        =*  ship  i.ships
        %_  $
          ships              t.ships
          ships-to-be-sold   (~(put in ships-to-be-sold) ship)
          records            (~(put in records) [ship u.price referrals])
          for-sale           (~(del ju for-sale) who ship)
          sold-ship-to-date  (~(put by sold-ship-to-date) ship now.bowl)
        ==
      :-  (give /updates^~ update)
      |-
      ?~  ships
        state(sold-ships (put:his sold-ships now.bowl records))
      =*  ship  i.ships
      ~|  "cannot sell ship that does not exist"
      ?>  (~(has ju for-sale) who ship)
      %_  $
        records            (~(put in records) [ship u.price referrals])
        for-sale           (~(del ju for-sale) who ship)
        sold-ship-to-date  (~(put by sold-ship-to-date) ship now.bowl)
      ==
    ::
        %sell-from-referral
      :-  (give /updates^~ update)
      ::  check that a code is available and that the ship in question
      ::  has referrals left to give out.
      ::  if not, crash. if yes, then sell at the referral code price.
      state
    ==
  ::
  ++  give
    |=  [paths=(list path) =update]
    ^-  (list card)
    [%give %fact paths %naive-market-update !>(update)]~
  ::
  ++  scry-for
    |*  [dap=term =mold =path]
    .^  mold
      %gx
      (scot %p our.bowl)
      dap
      (scot %da now.bowl)
      (snoc `^path`path %noun)
    ==
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
++  on-agent
  |=  [=wire =sign:agent:gall]
  ^-  (quip card _this)
  |^
  ?+    wire  (on-agent:def wire sign)
      [%address @ ~]
    ?:  ?=(%kick -.sign)
      :_  this
      [%pass wire %agent [our.bowl %roller] %watch /txs/[i.t.wire]]^~
    ?.  ?=(%fact -.sign)
      `this
    `this(state process)
::
::    ?+    p.cage.sign  !!
::        %tx
::      ::=/  tx  !<(roller-tx:dice q.cage.sign)
::      `this(state process)
::    ::
::        %txs
::      ::=/  txs  !<((list roller-tx:dice) q.cage.sign)
::      `this(state process)
::    ==
  ==
  ::
  ++  process
    ^-  _state
    =/  configs=(list (pair ship config))   ~(tap by star-configs)
    |-
    ?~  configs
      state
    =*  who  p.i.configs
    =*  c    q.i.configs
    =/  =address  (address-from-prv:key:eth prv.c)
    =/  ships=(list ship)
      %+  murn
        (scry-for %roller (list ship) /ships/(scot %ux address))
      |=  s=ship
      ?.(=(%duke (clan:title s)) ~ `s)
    |-
    ?~  ships
      ^$(configs t.configs)
    %_  $
      ships     t.ships
      for-sale  (~(put ju for-sale) who i.ships)
    ==
  ::
  ++  scry-for
    |*  [dap=term =mold =path]
    .^  mold
      %gx
      (scot %p our.bowl)
      dap
      (scot %da now.bowl)
      (snoc `^path`path %noun)
    ==
  --
++  on-arvo   on-arvo:def
++  on-fail   on-fail:def
--

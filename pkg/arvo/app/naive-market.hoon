:: naive-market [tirrel]
::
/-  *naive-market, dice
/+  ntx=naive-transactions, default-agent, dbug, verb
|%
+$  card  card:agent:gall
+$  state-0
  $:  %0
      config
      price=(unit price)
      referrals=(unit referral-policy)
    ::
      =available-ships
      =sold-ships
      =ship-to-sell-date
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
        %set-config
      =*  c  config.update
      =/  cards=(list card)
        =/  watch-card=(unit card)
          ?~  address.c  ~
          :-  ~
          :^  %pass  /address/(scot %p u.address.c)  %agent
          [[our.bowl %roller] %watch /txs/(scot %ux u.address.c)]
        ?~  address
          ?~(address.c ~ (need watch-card)^~)
        :-  :^  %pass  /address/(scot %p u.address)  %agent
            [[our.bowl %roller] %leave ~]
        ?~  address.c
          ~
        (need watch-card)^~
      :-  cards
      %_  state
        who      who.c
        address  address.c
        pk       pk.c
        proxy    proxy.c
      ==
    ::
      %set-price            `state(price `price.update)
      %set-referral-policy  `state(referrals ref.update)
    ::
        %spawn-ships
      ?>  ?=(^ who)
      ?>  ?=(^ address)
      ?>  ?=(^ pk)
      ?>  ?=(^ proxy)
      ::  get nonce. if no nonce, fail
      ::  generate and sign tx
      ::  submit roller-action
      =/  nonce=@
        (need (scry-for %roller (unit @) /nonce/(scot %p u.who)/[u.proxy]))
      =/  unspawned=(list ship)
        (scry-for %roller (list ship) /unspawned/(scot %p u.who))
      :_  state
      =|  cards=(list card)
      |-  ^-  (list card)
      ?~  unspawned
        (flop cards)
      =*  ship  i.unspawned
      =/  =tx:naive:ntx
        [[u.who u.proxy] %spawn ship u.address]
      =/  sig=octs
        (gen-tx:ntx nonce tx u.pk)
      %_    $
        unspawned  t.unspawned
        nonce      +(nonce)
      ::
          cards
        :_  cards
        :^  %pass  /spawn/(scot %p ship)  %agent
        :+  [our.bowl %roller]  %poke
        roller-action+!>([%submit | u.address q.sig %don tx])
      ==
    ::
        %add-ships
      :-  (give /updates^~ update)
      ::  check that no added code has already been sold
      ::  then add them to the map
      =/  ships  ~(tap in ships.update)
      |-
      ?~  ships
        state
      =*  ship  i.ships
      ::  TODO:  check that ship is still owned by our star, perhaps
      ::  add to a "pending but not verified" section?
      ::  =/  code  *@ux
      ?:  (~(has by ship-to-sell-date) ship)
        !!
      %_  $
        ships            t.ships
        available-ships  (~(put in available-ships) ship)
      ==
    ::
        %sell-next-ships
      ?>  ?=(^ price)
      =/  ships     ~(tap in available-ships)
      =/  len       (lent ships)
      ?:  (gth n.update len)
        !!
      =/  =records
        =/  urec=(unit records)  (get:his sold-ships now.bowl)
        ?~(urec ~ u.urec)
      =|  ships-to-be-sold=(set ship)
      |-
      ?~  ships
        :-  (give /updates^~ [%sell-ships ships-to-be-sold])
        state(sold-ships (put:his sold-ships now.bowl records))
      =*  ship  i.ships
      %_  $
        ships              t.ships
        ships-to-be-sold   (~(put in ships-to-be-sold) ship)
        ship-to-sell-date  (~(put by ship-to-sell-date) ship now.bowl)
        records            (~(put in records) [ship u.price referrals])
        available-ships    (~(del in available-ships) ship)
      ==
    ::
        %sell-ships
      ?>  ?=(^ price)
      :-  (give /updates^~ update)
      ::  check that all codes being sold are available
      ::  if not, crash. if yes, then sell them
      =/  ships     ~(tap in ships.update)
      =/  =records
        =/  urec=(unit records)  (get:his sold-ships now.bowl)
        ?~(urec ~ u.urec)
      |-
      ?~  ships
        state(sold-ships (put:his sold-ships now.bowl records))
      =*  ship  i.ships
      ~|  "cannot sell ship that does not exist"
      ?>  (~(has in available-ships) ship)
      %_  $
        records            (~(put in records) [ship u.price referrals])
        available-ships    (~(del in available-ships) ship)
        ship-to-sell-date  (~(put by ship-to-sell-date) ship now.bowl)
      ==
    ::
        %remove-ships
      :-  (give /updates^~ update)
      ::  check that all codes are available.
      ::  if not, crash. if yes, then remove them.
      =/  ships  ~(tap in ships.update)
      |-
      ?~  ships
        state
      =*  ship  i.ships
      ~|  "cannot remove ship that does not exist"
      ?>  (~(has in available-ships) ship)
      $(available-ships (~(del in available-ships) ship))
    ::
        %use-referral
      :-  (give /updates^~ update)
      ::  check that a code is available and that the ship in question
      ::  has referrals left to give out.
      ::  if not, crash. if yes, then sell at the referral code price.
      state
    ::
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
    ?.  ?=(%fact -.sign)
      `this
    ?.  ?=(%txs p.cage.sign)
      `this
    =/  txs  !<((list roller-tx:dice) q.cage.sign)
    [(process-txs txs) this]
  ==
  ::
  ++  process-txs
    |=  txs=(list roller-tx:dice)
    ^-  (list card)
    =|  ships=(set ship)
    |-
    ?~  txs
      ?~  ships  ~
      :_  ~
      :^  %pass  /add-ships/(scot %ux (mug txs))  %agent
      :+  [our.bowl %naive-market]  %poke
      naive-market-update+!>([%add-ships ships])
    =*  tx  i.txs
    %_    $
      txs  t.txs
    ::
        ships
      ?.  ?&  ?=(%confirmed status.tx)
            ?=(%spawn type.tx)
          ==
        ships
      (~(put in ships) ship.tx)
    ==
  --
++  on-arvo   on-arvo:def
++  on-fail   on-fail:def
--

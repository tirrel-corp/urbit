:: planet-market [tirrel]
::
/-  *planet-market
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
      %planet-market-update
    =^  cards  state
      (planet-market-update !<(update vase))
    [cards this]
  ==
  ::
  ++  planet-market-update
    |=  =update
    ^-  (quip card _state)
    ?-    -.update
        %set-config
      =*  c  config.update
      :-  ~
      %_  state
        who      who.c
        address  address.c
        pk       pk.c
        proxy    proxy.c
      ==
    ::
      %set-price            `state(price `price.update)
      %set-referral-policy  `state(referral-policy referral-policy.update)
    ::
        %spawn-ships
      ?>  ?=(^ who)
      ?>  ?=(^ address)
      ?>  ?=(^ pk)
      ?>  ?=(^ proxy)
      ::  get nonce. if no nonce, fail
      ::  generate and sign tx
      ::  submit roller-action
      =/  nonce=(unit @)
        (scry-for %roller (unit @) /nonce/(scot %p u.who)/[u.proxy])
      ?>  ?=(^ nonce)
      ::  TODO: generate ships to replace ~marzod and end up with a list of
      ::  txs
      =/  =tx:naive:ntx
        [[u.who u.proxy] %spawn ~marzod u.address]
      =/  sig=octs
        (gen-tx:ntx u.nonce tx u.pk u.address))
      :_  state
      :_  ~
      :*  %pass
          /spawn/(scot %ud u.nonce)
          %agent
          [our.bowl %roller]
          %poke
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
      ::  check that available-codes has N items in it
      ::  if not, crash. if yes, then sell them
      ?:  (gth n.update len)
        !!
      =|  i=@ud
      =/  =records  (need (fall (get:his now) [~ ~]))
      =/  ships     ~(tap in available-ships)
      =|  ships-to-be-sold=(set ship)
      =/  len       (lent ships)
      |-
      ?:  =(len i)
        :-  (give /updates^~ [%sell-ships ships-to-be-sold])
        state(sold-ships (put:on now.bowl records))
      =*  ship  i.ships
      %_  $
        i                  +(i)
        ships              t.ships
        ships-to-be-sold   (~(put in ships-to-be-sold) ship)
        ship-to-sell-date  (~(put by ship-to-sell-date) ship now.bowl)
        records            (~(put in records) [ship price referral-policy])
        available-ships    (~(del in available-ships) ship)
      ==
    ::
        %sell-ships
      :-  (give /updates^~ update)
      ::  check that all codes being sold are available
      ::  if not, crash. if yes, then sell them
      =/  ships     ~(tap in ships.update)
      =/  =records  (need (fall (get:his now) [~ ~]))
      |-
      ?~  ships
        state(sold-ships (put:on now.bowl records))
      =*  ship  i.ships
      ~|  "cannot sell ship that does not exist"
      ?>  (~(has in available-ships) ship)
      %_  $
        records            (~(put in records) [ship price referral-policy])
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
    [%give %fact paths %planet-market-update !>(update)]~
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
++  on-agent  on-agent:def
++  on-arvo   on-arvo:def
++  on-fail   on-fail:def
--

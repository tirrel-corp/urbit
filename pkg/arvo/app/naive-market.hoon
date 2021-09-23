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
      ::  TODO: ensure no two stars are owned by same address
      ?>  =(%king (clan:title who.update))
      =*  c  config.update
      =.  prv.c
        q:(need (de:base16:mimes:html prv.c))
      =/  =address  (address-from-prv:key:eth prv.c)
      :_  state(star-configs (~(put by star-configs) who.update c))
      :_  ~
      :^  %pass  /star/(scot %p who.update)  %agent
      [[our.bowl %roller] %watch /txs/(scot %ux address)]
    ::
        %del-star-config
      =/  c=config  (~(got by star-configs) who.update)
      =/  =address  (address-from-prv:key:eth prv.c)
      :_  %_  state
            star-configs  (~(del by star-configs) who.update)
            for-sale      (~(del by for-sale) who.update)
          ==
      :_  ~
      :^  %pass  /star/(scot %p who.update)  %agent
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
          cards      [(configure-keys ship) (spawn ship) cards]
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
        cards  [(configure-keys ship) (spawn ship) cards]
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
      ::
      :: TODO: figure out right constants
      ++  configure-keys
        |=  =ship
        ^-  card
        =/  =tx:naive:ntx
          :+  [ship %own]
            %configure-keys
          [encrypt=*@ auth=*@ crypto-suite=*@ breach=%.n]
        =/  sig=octs
          (gen-tx:ntx nonce=0 tx prv)
        :^  %pass  /configure/(scot %p ship)  %agent
        :+  [our.bowl %roller]  %poke
        roller-action+!>([%submit | addr q.sig %don tx])
      --
    ::
        %sell-ships
      |^
      ?>  ?=(^ price)
      =*  who  who.update
      =*  to   to.update
      =/  =records
        =/  urec=(unit records)  (get:his sold-ships now.bowl)
        ?~(urec ~ u.urec)
      =/  ships=(list ship)  ~(tap in (~(get ju for-sale) who))
      =/  c=config  (~(got by star-configs) who)
      =/  from=address  (address-from-prv:key:eth prv.c)
      =|  cards=(list card)
      ?:  ?=(%| -.sel.update)
        ~|  "cannot sell more ships than we have"
        ?>  (lth p.sel.update (lent ships))
        =|  ships-to-be-sold=(set ship)
        |-
        ?:  =(0 p.sel.update)
          :_  state(sold-ships (put:his sold-ships now.bowl records))
          %+  weld  cards
          (give /updates^~ [%sell-ships who %&^ships-to-be-sold to])
        ?>  ?=(^ ships)
        =*  ship  i.ships
        %_  $
          p.sel.update       (dec p.sel.update)
          ships              t.ships
          ships-to-be-sold   (~(put in ships-to-be-sold) ship)
          records            (~(put in records) [ship u.price referrals])
          for-sale           (~(del ju for-sale) who ship)
          sold-ship-to-date  (~(put by sold-ship-to-date) ship now.bowl)
          cards              [(transfer-point ship who from to prv.c) cards]
        ==
      =/  pending  ~(tap in p.sel.update)
      |-
      ?~  pending
        :_  state(sold-ships (put:his sold-ships now.bowl records))
        %+  weld  cards
        (give /updates^~ update)
      ?>  ?=(^ ships)
      =*  ship  i.pending
      ~|  "cannot sell ship that does not exist"
      ?>  (~(has ju for-sale) who ship)
      %_  $
        pending            t.pending
        records            (~(put in records) [ship u.price referrals])
        for-sale           (~(del ju for-sale) who ship)
        sold-ship-to-date  (~(put by sold-ship-to-date) ship now.bowl)
        cards              [(transfer-point ship who from to prv.c) cards]
      ==
      ::
      ++  transfer-point
        |=  [=ship who=ship from=address to=address prv=@]
        ^-  card
        =/  =tx:naive:ntx
          [[ship %own] %transfer-point to %&]
        =/  nonce=@
          (need (scry-for %roller (unit @) /nonce/(scot %p ship)/own))
        =/  sig=octs
          (gen-tx:ntx nonce tx prv)
        :^  %pass  /transfer/(scot %p who)/(scot %p ship)  %agent
        :+  [our.bowl %roller]  %poke
        roller-action+!>([%submit | from q.sig %don tx])
      --
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
    [%x %price ~]   ``noun+!>(price)
  ::
      [%x %inventory @ ~]
    =/  who=ship  (slav %p i.t.t.path)
    ``noun+!>(`(set ship)`(~(get ju for-sale) who))
  ==
::
++  on-agent
  |=  [=wire =sign:agent:gall]
  ^-  (quip card _this)
  |^
  ?+    wire  (on-agent:def wire sign)
      [%star @ ~]
    =/  who=ship  (slav %p i.t.wire)
    =/  con=config  (~(got by star-configs) who)
    ?:  ?=(%kick -.sign)
      =/  =address  (address-from-prv:key:eth prv.con)
      :_  this
      [%pass wire %agent [our.bowl %roller] %watch /txs/(scot %ux address)]^~
    ?.  ?=(%fact -.sign)
      `this
    `this(state (on-star who con))
  ==
  ::
  ++  on-star
    |=  [who=ship con=config]
    ^-  _state
    ::  TODO: ensure we remove pending sales from set
    =/  =address  (address-from-prv:key:eth prv.con)
    =-  state(for-sale (~(put by for-sale) who -))
    %-  ~(gas in *(set ship))
    %+  murn
      (scry-for %roller (list ship) /ships/(scot %ux address))
    |=  s=ship
    ?.(=(%duke (clan:title s)) ~ `s)
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

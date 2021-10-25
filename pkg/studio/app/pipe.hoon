:: pipe [tirrel]: graph-store to website conversion
::
::
/-  *pipe
/+  default-agent, dbug, verb, graph, pipe-json
|%
+$  card  card:agent:gall
+$  state-0
  $:  %0
      flows=(map name=term flow)
      sites=(map name=term website)
      uid-to-name=(jug uid name=term)
  ==
--
::
=|  state-0
=*  state  -
::
%-  agent:dbug
%+  verb  |
^-  agent:gall
=<
|_  =bowl:gall
+*  this  .
    def   ~(. (default-agent this %|) bowl)
    pc    ~(. +> bowl)
::
++  on-init
  ^-  (quip card _this)
  :_  this(state [%0 ~ ~ ~])
  [%pass /graph %agent [our.bowl %graph-store] %watch /updates]^~
::
++  on-save  !>(state)
++  on-load
  |=  old-vase=vase
  ^-  (quip card _this)
::  `this(state *state-0)
  =/  old  !<(state-0 old-vase)
  `this(state old)
::
++  on-poke
  |=  [=mark =vase]
  ^-  (quip card _this)
  ?>  (team:title our.bowl src.bowl)
  |^
  ?+    mark  (on-poke:def mark vase)
      %pipe-action
    =^  cards  state
      (pipe-action !<(action vase))
    [cards this]
  ==
  ::
  ++  pipe-action
    |=  =action
    ^-  (quip card _state)
    |^
    ?-    -.action
        %add
      ?<  (~(has by flows) name.action)
      =/  to-website=$-(update:store:graph website)  (build:pc mark.action)
      =/  =website
        %-  to-website
        (get-add-nodes:pc resource.action index.action)
      :-  %-  zing
          :~  (poke-ob-hook mark.action)^~
              (give:pc name.action website)^~
              ?.  serve.action  ~
              (serve:pc name.action website)
          ==
      %_    state
        flows  (~(put by flows) name.action +>.action)
        sites  (~(put by sites) name.action website)
      ::
          uid-to-name
        %+  ~(put ju uid-to-name)
          [resource.action index.action]
        name.action
      ==
    ::
        %remove
      =/  =flow  (~(got by flows) name.action)
      :-  ~
      %_    state
        flows  (~(del by flows) name.action)
        sites  (~(del by sites) name.action)
      ::
          uid-to-name
        %+  ~(del ju uid-to-name)
          [resource.flow index.flow]
        name.action
      ==
    ==
    ::
    ++  poke-ob-hook
      |=  =^mark
      ^-  card
      :*  %pass
          /(scot %da now.bowl)/[mark]
          %agent
          [our.bowl %observe-hook]
          %poke
          %observe-action
          !>([%warm-static-conversion mark %pipe-website])
      ==
    --
  --
::
++  on-agent
  |=  [=wire =sign:agent:gall]
  ^-  (quip card _this)
  ?+  -.sign  (on-agent:def wire sign)
      %kick
    :_  this
    ?.  ?=([%graph ~] wire)
      ~
    [%pass /graph %agent [our.bowl %graph-store] %watch /updates]^~
  ::
      %fact
    |^
    ?.  ?=(%graph-update-3 p.cage.sign)
      (on-agent:def wire sign)
    =/  =update:store:graph  !<(update:store:graph q.cage.sign)
    ?.  ?=(%add-nodes -.q.update)
      `this
    =/  [cards=(list card) new-sites=(map name=term website)]
      %+  roll  (update-to-flows update)
      |=  $:  [name=term =flow]
              [cards=(list card) new-sites=(map term website)]
          ==
      ^-  [(list card) (map term website)]
      =/  web=website
        %-  (build:pc mark.flow)
        (get-add-nodes:pc resource.flow index.flow)
      =/  email=website
         ((build:pc mark.flow) update)
      =/  new-cards=(list card)
        %-  zing
        :~  (give:pc name web)^~
            ?.  serve.flow  ~
            (serve:pc name web)
            ?.  email.flow  ~
            (give-email name email)^~
        ==
      :-  new-cards
      (~(put by new-sites) name web)
    :-  cards
    this(sites (~(uni by sites) new-sites))
    ::
    ++  update-to-flows
      |=  =update:store:graph
      ^-  (list [term flow])
      ?>  ?=(%add-nodes -.q.update)
      =*  rid    resource.q.update
      =*  nodes  nodes.q.update
      =-  %+  murn  -
          |=  name=term
          ?~  maybe-flow=(~(get by flows) name)
            ~
          `[name u.maybe-flow]
      %~  tap  in
      %-  ~(gas in *(set term))
      %-  zing
      %+  turn  ~(tap in ~(key by nodes))
      |=  =index
      ^-  (list term)
      =|  names=(set term)
      |-
      ?~  index
        %~  tap  in
        %-  ~(uni in names)
        (~(get ju uid-to-name) [rid index])
      %_  $
        index  (snip `(list @)`index)
        names  (~(uni in names) (~(get ju uid-to-name) [rid index]))
      ==
    --
  ==
::
++  on-arvo  on-arvo:def
++  on-watch
  |=  =path
  ^-  (quip card _this)
  ?>  (team:title our.bowl src.bowl)
  ?+    path  (on-watch:def path)
      [%updates ~]  `this
  ::
      [%site @ ~]
    =*  name  i.t.path
    =/  =update  [%built name (~(got by sites) name)]
    :_  this
    [%give %fact ~ %pipe-update !>(update)]~
  ::
      [%email @ ~]  `this
  ==
::
++  on-peek
  |=  =path
  ^-  (unit (unit cage))
  ?+    path  (on-peek:def path)
      [%x %export ~]
    ``noun+!>(state)
  ::
      [%x %flows ~]
    :^  ~  ~  %json  !>
    :-  %o
    (~(run by flows) flow:enjs:pipe-json)
  ==
::
++  on-leave  on-leave:def
++  on-fail   on-fail:def
--
::
|_  =bowl:gall
+*  gra  ~(. graph bowl)
++  serve
  |=  [name=term =website]
  ^-  (list card)
  ~&  %serve^name
  :+  :*  %pass
          /(scot %da now.bowl)/unserve
          %agent
          [our.bowl %file-server]
          %poke
          %file-server-action
          !>([%unserve-dir /[name]])
      ==
    :*  %pass
        /(scot %da now.bowl)/serve
        %agent
        [our.bowl %file-server]
        %poke
        %file-server-action
        !>([%serve-glob /[name] website %.y])
    ==
  ~
::
++  give
  |=  [name=term =website]
  ^-  card
  ~&  %give^name
  =-  [%give %fact - [%pipe-update !>(`update`[%built name website])]]
  :~  /updates
      /site/[name]
  ==
::
++  give-email
  |=  [name=term =website]
  ^-  card
  ~&  %give-email^name
  =-  [%give %fact - [%pipe-update !>(`update`[%built name website])]]
  :~  /email/[name]
  ==
::
++  build
  |=  =^mark
  ^-  $-(update:store:graph website)
  =/  convert=$-(website $-(update:store:graph website))
    .^  $-(website $-(update:store:graph website))
          %cf
          (scot %p our.bowl)
          q.byk.bowl
          (scot %da now.bowl)
          mark
          %pipe-website
          ~
      ==
  (convert *website)
::
++  get-add-nodes
  |=  [res=resource =index]
  ^-  update:store:graph
  ?~  index
    %+  scry-for:gra  ,=update:store:graph
    /graph/(scot %p entity.res)/[name.res]/node/children/kith/'~'/'~'
  %+  scry-for:gra  ,=update:store:graph
  %+  weld
    /graph/(scot %p entity.res)/[name.res]/node/index/kith
  (turn index (cury scot %ud))
--

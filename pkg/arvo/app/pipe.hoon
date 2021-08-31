:: pipe [tirrel]: graph-store to website conversion
::
::
/-  *pipe
/+  default-agent, dbug, verb, graph
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
|_  =bowl:gall
+*  this  .
    def   ~(. (default-agent this %|) bowl)
    gra   ~(. graph bowl)
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
    ?-    -.action
        %add
      ?<  (~(has by flows) name.action)
      =/  build=$-(update:store:graph website)
        .^  $-(update:store:graph website)
            %cf
            (scot %p our.bowl)
            q.byk.bowl
            (scot %da now.bowl)
            mark.action
            %pipe-website
            ~
        ==
      =/  =website
        %-  build
        (get-add-nodes resource.action index.action)
      :-  :~  (poke-ob-hook mark.action)
              (give name.action website)
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
  ++  give
    |=  [name=term =website]
    ^-  card
    =-  [%give %fact - [%pipe-update !>(`update`[%built name website])]]
    :~  /updates
        /site/[name]
    ==
  ::
  ++  get-add-nodes
    |=  [res=resource =index]
    ^-  update:store:graph
    %+  scry-for:gra  ,=update:store:graph
    %+  weld
      /graph/(scot %p entity.res)/[name.res]/node/index/kith
    (turn index (cury scot %ud))
  ::
  ++  poke-ob-hook
    |=  =^mark
    ^-  card
    :*  %pass
        /[mark]
        %agent
        [our.bowl %observe-hook]
        %poke
        %observe-action
        !>([%warm-static-conversion mark %pipe-website])
    ==
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
    ?.  ?=(%graph-update-2 p.cage.sign)
      (on-agent:def wire sign)
    =/  =update:store:graph  !<(update:store:graph q.cage.sign)
    ?.  ?=(%add-nodes -.q.update)
      `this
    =/  new-sites=(map name=term website)
      %-  ~(gas by *(map name=term website))
      %+  turn  (update-to-flows update)
      |=  [name=term =flow]
      ^-  [name=term website]
      =/  build=$-(update:store:graph website)
        .^  $-(update:store:graph website)
            %cf
            (scot %p our.bowl)
            q.byk.bowl
            (scot %da now.bowl)
            mark.flow
            %pipe-website
            ~
        ==
      :-  name
      (build (get-add-nodes resource.flow index.flow))
    :-  (turn ~(tap by new-sites) give)
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
          ^-  (unit [term flow])
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
        ~(tap in names)
      %_  $
        index  (slag 1 `(list @)`index)
        names  (~(uni in names) (~(get ju uid-to-name) [rid index]))
      ==
    ::
    ++  give
      |=  [name=term =website]
      ^-  card
      =-  [%give %fact - [%pipe-update !>(`update`[%built name website])]]
      :~  /updates
          /site/[name]
      ==
    ::
    ++  get-add-nodes
      |=  [res=resource =index]
      ^-  update:store:graph
      %+  scry-for:gra  ,=update:store:graph
      %+  weld
        /graph/(scot %p entity.res)/[name.res]/node/index/kith
      (turn index (cury scot %ud))
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
      [%site @ ~]   `this
  ==
::
++  on-peek
  |=  =path
  ^-  (unit (unit cage))
  ?+    path  (on-peek:def path)
    [%x %export ~]  ``noun+!>(state)
  ==
::
++  on-leave  on-leave:def
++  on-fail   on-fail:def
--


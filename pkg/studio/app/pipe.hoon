:: pipe [tirrel]: graph-store to website conversion
::
::
/-  *pipe, meta=metadata-store
/+  default-agent,
    dbug,
    verb,
    graph,
    pipe-json,
    server,
    *pipe-templates,
    pipe-render
|%
+$  card  card:agent:gall
+$  template  $-(update:store:graph website)
+$  state-0
  $:  %0
      flows=(map name=term flow)
      sites=(map name=term website)
      uid-to-name=(jug uid name=term)
      host-to-name=(map @t name=term)
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
  :_  this(state *state-0)
  [%pass /graph %agent [our.bowl %graph-store] %watch /updates]~
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
  ::
      %handle-http-request
    =+  !<([eyre-id=@ta req=inbound-request:eyre] vase)
    :_  this
    %+  give-simple-payload:app:server  eyre-id
    (handle-http-request req)
  ==
  ::
  ++  pipe-action
    |=  =action
    ^-  (quip card _state)
    ?-    -.action
        %add
      ?<  (~(has by flows) name.action)
      =.  flows  (~(put by flows) name.action +>.action)
      =.  uid-to-name
        %+  ~(put ju uid-to-name)
          [resource.action index.action]
        name.action
      ?~  site.action
        `state
      =/  =site-template
        ~|  "no such template: {<template.u.site.action>}"
        (~(got by site-templates) template.u.site.action)
      =/  =website   (site-template (get-inputs:pc name.action +>.action))
      =.  sites        (~(put by sites) name.action website)
      =?  host-to-name  ?=(^ site.binding.u.site.action)
        (~(put by host-to-name) u.site.binding.u.site.action name.action)
      :_  state
      :*  (give:pc name.action website)
          (serve:pc name.action binding.u.site.action)
      ==
    ::
        %remove
      =/  =flow  (~(got by flows) name.action)
      =^  cards  host-to-name
        ?~  site.flow
          [~ host-to-name]
        :-  [%pass /eyre %arvo %e %disconnect binding.u.site.flow]~
        ?~  site.binding.u.site.flow  host-to-name
        (~(del by host-to-name) site.binding.u.site.flow)
      :-  cards
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
  ++  handle-http-request
    |=  req=inbound-request:eyre
    ^-  simple-payload:http
    |^
    =/  req-line=request-line:server
      (parse-request-line:server url.request.req)
    =/  host=(unit @t)
      (~(get by (~(gas by *(map @t @t)) header-list.request.req)) 'host')
    ::
    =/  flow-req=(unit [name=term =path])
      %-  ~(rep by flows)
      |=  [[name=term =flow] out=(unit [term path])]
      ?~  site.flow  ~
      =/  suffix=(unit path)
        (get-suffix path.binding.u.site.flow site.req-line)
      ?~  suffix  out
      `[name u.suffix]
    ::
    ?~  flow-req
      not-found:gen:server
    ::
    =/  web=(unit website)
      (~(get by sites) name.u.flow-req)
    =/  page=(unit mime)
      ?~  web  ~
      (~(get by u.web) path.u.flow-req)
    ?~  page
      not-found:gen:server
    [[200 [['content-type' 'text/html'] ~]] `q.u.page]
    ::
    ++  get-suffix
      |=  [a=path b=path]
      ^-  (unit path)
      ?:  (gth (lent a) (lent b))  ~
      |-
      ?~  a  `b
      ?~  b  ~
      ?.  =(i.a i.b)  ~
      %=  $
        a  t.a
        b  t.b
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
    =^  cards  state
      %+  roll  (update-to-flows update)
      |=  $:  [name=term =flow]
              [cards=(list card) sty=_state]
          ==
      ^-  [(list card) _state]
      =^  site-cards   sty
        (update-site name flow update)
      =/  email-cards
        (update-email name flow update)
      :_  sty
      :(weld site-cards email-cards cards)
    [cards this]
    ::
    ++  update-site
      |=  [name=term =flow =update:store:graph]
      ^-  (quip card _state)
      ?~  site.flow
        `state
      =/  =site-template  (~(got by site-templates) template.u.site.flow)
      =/  =website   (site-template (get-inputs:pc name flow))
      :-  [(give:pc name website)]~
      state(sites (~(put by sites) name website))
    ::
    ++  update-email
      |=  [name=term =flow =update:store:graph]
      ^-  (list card)
      ?~  email.flow
        ~
      =/  =email-template  (~(got by email-templates) u.email.flow)
      =/  email=website    (email-template (get-inputs:pc name flow)) :: XX
      [(give-email:pc name email)]~
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
++  on-arvo
  |=  [=wire =sign-arvo]
  ^-  (quip card _this)
  ?+  wire  (on-arvo:def wire sign-arvo)
    [%eyre ~]  `this
  ==
::
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
  ::
      [%http-response *]  `this
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
  ::
      [%x %preview ?(%site %email) @ ~]
    ?+  i.t.t.path  !!
        %site
      =/  temp  (~(get by site-templates) i.t.t.t.path)
      ?~  temp
        [~ ~]
      =/  site  (u.temp lorem-ipsum:pipe-render)
      =/  index=mime    (~(got by site) /)
      =/  article=mime  (~(got by site) /ut-enim-ad-minim-veniam)
      :^  ~  ~  %json  !>
      %-  pairs:enjs:format
      :~  index+s+q.q.index
          article+s+q.q.index
      ==
    ==
  ==
::
++  on-leave  on-leave:def
++  on-fail   on-fail:def
--
::
|_  =bowl:gall
+*  gra  ~(. graph bowl)
++  our-beak
  ^-  beak
  [our.bowl q.byk.bowl %da now.bowl]
::
++  serve
  |=  [name=term =binding:eyre]
  ^-  (list card)
  =/  cards=(list card)
    [%pass /eyre %arvo %e %connect binding dap.bowl]~
  =/  flo  (~(get by flows) name)
  ?~  flo
    cards
  ?~  site.u.flo
    cards
  :_  cards
  [%pass /eyre %arvo %e %disconnect binding.u.site.u.flo]
::
++  give
  |=  [name=term =website]
  ^-  card
  =-  [%give %fact - [%pipe-update !>(`update`[%built name website])]]
  :~  /updates
      /site/[name]
  ==
::
++  give-email
  |=  [name=term =website]
  ^-  card
  =-  [%give %fact - [%pipe-update !>(`update`[%built name website])]]
  :~  /email/[name]
  ==
::
++  orm  ((on atom node:store:graph) gth)
::
++  get-posts
  |=  res=resource
  ^-  (list [initial-date=@da latest-post=post:store:graph])
  =/  =update:store:graph
    %+  scry-for:gra  update:store:graph
    /graph/(scot %p entity.res)/[name.res]/node/children/kith/'~'/'~'
  ?>  ?=(%add-nodes -.q.update)
  %+  sort
    %+  turn  ~(tap by nodes.q.update)
    |=  [=index =node:store:graph]
    ?>  ?=(%graph -.children.node)
    =/  arc=node:store:graph  (got:orm p.children.node 1)
    ?>  ?=(%graph -.children.arc)
    =/  latest=(unit [@ node:store:graph])  (pry:orm p.children.arc)
    =/  first=(unit [@ node:store:graph])   (ram:orm p.children.arc)
    ?~  latest  !!
    ?~  first   !!
    ?>  ?=(%& -.post.+.u.latest)
    ?>  ?=(%& -.post.+.u.first)
    :*  time-sent.p.post.+.u.first
        p.post.+.u.latest
    ==
  |=  $:  a=[t=@da post:store:graph]
          b=[t=@da post:store:graph]
      ==
  (gth t.a t.b)
::
++  get-metadata
  |=  res=resource
  ^-  association:meta
  %-  need
  %^  scry  %metadata-store
    (unit association:meta)
  /metadata/graph/ship/(scot %p entity.res)/[name.res]/noun
::
++  get-inputs
  |=  [name=term =flow]
  ^-  site-inputs
  :*  name
      binding:(need site.flow)
      (get-posts resource.flow)
      (get-metadata resource.flow)
  ==
::
++  scry
  |*  [=term =mold =path]
  .^  mold  %gx
      (scot %p our.bowl)
      term
      (scot %da now.bowl)
      path
  ==
::
--

:: pipe [tirrel]: graph-store to website conversion
::
::
/-  *pipe
/+  default-agent, dbug, verb, graph, pipe-json, server
|%
+$  card  card:agent:gall
+$  template  $-(update:store:graph website)
+$  state-0
  $:  %0
      flows=(map name=term flow)
      sites=(map name=term website)
      uid-to-name=(jug uid name=term)
      host-to-name=(map @t name=term)
      site-templates=(map term template)
      email-templates=(map term template)
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
  :_  this(state load-templates:pc)
  :*  [%pass /graph %agent [our.bowl %graph-store] %watch /updates]
      next-templates:pc
  ==
::
++  on-save  !>(state)
++  on-load
  |=  old-vase=vase
  ^-  (quip card _this)
::  `this(state *state-0)
  =/  old  !<(state-0 old-vase)
  :-  next-templates:pc
  this(state old)
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
      =/  to-website=$-(update:store:graph website)
        (build:pc template.u.site.action)
      =/  =website
        %-  to-website
        (get-add-nodes:pc resource.action index.action)
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
    =/  req-line=request-line:server
      (parse-request-line:server url.request.req)
    =/  host=(unit @t)
      (~(get by (~(gas by *(map @t @t)) header-list.request.req)) 'host')
    ::
    ::  figure out which flow and path this request is for
    ~&  req+site.req-line
    =/  flow-req=(unit [name=term =path])
      ?~  host
        ?~  site.req-line  ~
        ?~  t.site.req-line
          `[i.site.req-line /index/html]
        ?:  ?=([%$ ~] t.site.req-line)
          `[i.site.req-line /index/html]
        `[i.site.req-line (snoc t.site.req-line %html)]
      =/  maybe-name  (~(get by host-to-name) u.host)
      ?~  maybe-name
        ?~  site.req-line  ~
        ?~  t.site.req-line
          `[i.site.req-line /index/html]
        ?:  ?=([%$ ~] t.site.req-line)
          `[i.site.req-line /index/html]
        `[i.site.req-line (snoc t.site.req-line %html)]
      ?~  site.req-line
        `[u.maybe-name /index/html]
      ?:  ?=([%$ ~] site.req-line)
        `[u.maybe-name /index/html]
      `[u.maybe-name (snoc site.req-line %html)]
    ~&  flow+flow-req
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
      =/  =template  (~(got by site-templates) template.u.site.flow)
      =/  =website   (template (get-add-nodes:pc resource.flow index.flow))
      :-  [(give:pc name website)]~
      state(sites (~(put by sites) name website))
    ::
    ++  update-email
      |=  [name=term =flow =update:store:graph]
      ^-  (list card)
      ?~  email.flow
        ~
      =/  =template       (~(got by email-templates) u.email.flow)
      =/  email=website   (template update)
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
      [%clay ~]
    ?>  ?=([%clay %writ *] sign-arvo)
    =^  cards  state
      [next-templates:pc load-templates:pc]
    [cards this]
  ::
      [%eyre ~]
    `this
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
::
++  next-templates
  ^-  (list card)
  =/  =rave:clay
    [%next %z [%da now.bowl] /mar/pipe]
  :~  [%pass /clay %arvo %c %warp our.bowl q.byk.bowl ~]
      [%pass /clay %arvo %c %warp our.bowl q.byk.bowl `rave]
  ==
::
++  load-templates
  ^+  state
  =/  site-paths   .^((list path) %ct (en-beam our-beak /mar/pipe/site))
  =/  email-paths  .^((list path) %ct (en-beam our-beak /mar/pipe/email))
  %_  state
      site-templates
    %-  ~(gas by *(map term template))
    %+  turn  site-paths
    |=  =path
    =/  =mark  (cat 3 %pipe-site- (snag 3 path))
    [mark (build mark)]
  ::
      email-templates
    %-  ~(gas by *(map term template))
    %+  turn  email-paths
    |=  =path
    =/  =mark  (cat 3 %pipe-email- (snag 3 path))
    [mark (build mark)]
  ==
--
